import admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const ONE_HOUR_MS = 60 * 60 * 1000

const setCorsHeaders = (res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

const toDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

const sendBrevoEmail = async ({ to, subject, html, text, attachmentName, pdfBase64 }) => {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || 'Techathon1.0'

  if (!apiKey || !senderEmail) {
    throw new Error('Brevo configuration is missing. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.')
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      attachment: [
        {
          name: attachmentName,
          content: pdfBase64,
        },
      ],
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload.message || payload.code || 'Brevo email send failed.'
    throw new Error(message)
  }

  return payload
}

export const sendCertificateEmail = onRequest(async (req, res) => {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      participantId,
      participantEmail,
      participantName,
      certificateId,
      fileName,
      eventName,
      pdfBase64,
    } = req.body || {}

    if (!participantId || !participantEmail || !participantName || !pdfBase64) {
      return res.status(400).json({ message: 'Missing participant or PDF payload.' })
    }

    const participantRef = db.collection('participants').doc(participantId)
    const participantSnap = await participantRef.get()

    if (!participantSnap.exists) {
      return res.status(404).json({ message: 'Participant not found.' })
    }

    const participant = participantSnap.data()
    const storedEmail = String(participant.email || '').trim().toLowerCase()
    const requestedEmail = String(participantEmail).trim().toLowerCase()

    if (!storedEmail || storedEmail !== requestedEmail) {
      return res.status(400).json({ message: 'Email does not match the registered participant.' })
    }

    const sentAt = toDate(participant.certificateEmailSentAt)
    if (sentAt && Date.now() - sentAt.getTime() < ONE_HOUR_MS) {
      const retryAfterMinutes = (ONE_HOUR_MS - (Date.now() - sentAt.getTime())) / 60000
      return res.status(429).json({
        message: 'Certificate email already sent within the last hour.',
        retryAfterMinutes,
      })
    }

    const resolvedCertificateId = String(participant.certificateId || certificateId || '').trim().toUpperCase()
    if (!resolvedCertificateId) {
      return res.status(400).json({ message: 'Certificate ID is missing.' })
    }

    const attachmentName = fileName || `${participantName.replace(/\s+/g, '_')}_Techathon1.0.pdf`
    await sendBrevoEmail({
      to: storedEmail,
      subject: `${eventName || 'Techathon1.0'} Certificate`,
      text: `Hello ${participantName},\n\nYour certificate for ${eventName || 'Techathon1.0'} is attached as a PDF.\nCertificate ID: ${resolvedCertificateId}\n\nRegards,\nTechathon1.0 Team`,
      html: `<p>Hello ${participantName},</p><p>Your certificate for <strong>${eventName || 'Techathon1.0'}</strong> is attached as a PDF.</p><p><strong>Certificate ID:</strong> ${resolvedCertificateId}</p><p>Regards,<br/>Techathon1.0 Team</p>`,
      attachmentName,
      pdfBase64: String(pdfBase64),
    })

    await participantRef.update({
      certificateGenerated: true,
      certificateId: resolvedCertificateId,
      certificateEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      certificateEmailRecipient: storedEmail,
    })

    return res.json({
      success: true,
      message: 'Certificate email sent successfully.',
    })
  } catch (error) {
    console.error('sendCertificateEmail failed:', error)
    return res.status(500).json({
      message: error.message || 'Failed to send certificate email.',
    })
  }
})