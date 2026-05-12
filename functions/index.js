import admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const ONE_DAY_MS = 24 * 60 * 60 * 1000

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
    if (sentAt && Date.now() - sentAt.getTime() < ONE_DAY_MS) {
      const retryAfterMinutes = (ONE_DAY_MS - (Date.now() - sentAt.getTime())) / 60000
      return res.status(429).json({
        message: 'Certificate email already sent within the last 24 hours.',
        retryAfterMinutes,
      })
    }

    const resolvedCertificateId = String(participant.certificateId || certificateId || '').trim().toUpperCase()
    if (!resolvedCertificateId) {
      return res.status(400).json({ message: 'Certificate ID is missing.' })
    }

    const attachmentName = fileName || `${participantName.replace(/\s+/g, '_')}_Techathon1.0.pdf`
    
    // Sanitize base64 string to ensure Brevo doesn't fail
    const sanitizedBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '')
    
    await sendBrevoEmail({
      to: storedEmail,
      subject: '🎓 Your Techathon 1.0 Participation Certificate | BGMIT Mudhol',
      text: `Dear ${participantName},\n\nGreetings from the Department of CSE & AIML, BGMIT Mudhol.\n\nCongratulations on successfully participating in Techathon 1.0 – 24 Hour Hackathon. Your official digital Certificate of Participation is attached as a PDF.\n\nCertificate ID: ${resolvedCertificateId}\n\nBest Regards,\nBGMIT Innovation Council`,
      html: `
        <div style="background-color: #FAF9F6; padding: 40px 20px; font-family: 'Helvetica', 'Arial', sans-serif; color: #1F2937; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; border-top: 6px solid #3730A3; border-bottom: 6px solid #D4AF37; padding: 40px; background-color: #FFFDF7; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <h2 style="color: #3730A3; margin-top: 0; margin-bottom: 25px; font-size: 22px;">🎓 Techathon 1.0 - Certificate of Participation</h2>
            <p>Dear <strong>${participantName}</strong>,</p>
            <p>Greetings from the Department of CSE & AIML, BGMIT Mudhol.</p>
            <p>Congratulations on successfully participating in <strong>Techathon 1.0 – 24 Hour Hackathon</strong> conducted at Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol. Your enthusiasm, creativity, teamwork, and innovative thinking throughout the event were truly appreciated.</p>
            <p>We are pleased to share your official digital Certificate of Participation with this email. The certificate is attached as a PDF for your records and future reference.</p>
            <div style="background-color: #F3F4F6; border-left: 4px solid #D4AF37; padding: 15px; margin: 25px 0;">
              <p style="margin: 0;"><strong>Certificate ID:</strong> <span style="color: #3730A3; font-family: monospace; font-size: 16px;">${resolvedCertificateId}</span></p>
            </div>
            <p>Thank you for being a part of Techathon 1.0 and contributing to the spirit of innovation and technology. We look forward to seeing your participation in many more future events and achievements.</p>
            <p style="margin-bottom: 5px;">Best Regards,</p>
            <p style="margin-top: 0; color: #4B5563;">
              <strong style="color: #1F2937;">BGMIT Innovation Council</strong><br/>
              Department of CSE & AIML<br/>
              Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol<br/>
              B.V.V Sangha’s BGMIT, Mudhol
            </p>
          </div>
        </div>
      `,
      attachmentName,
      pdfBase64: sanitizedBase64,
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