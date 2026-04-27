import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import CertificatePreview from '../components/CertificatePreview'
import { db } from '../firebase/config'
import { generateCertificateId, generateQRCodeDataUrl, parseQueryDomain } from '../utils/certificateUtils'

const EVENT_NAME = 'Techathon1.0'
const EMAIL_ENDPOINT = import.meta.env.VITE_CERTIFICATE_EMAIL_ENDPOINT || '/api/send-certificate-email'
const ONE_HOUR_MS = 60 * 60 * 1000

const toDisplayDate = (value) => {
  if (!value) return new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })
  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleDateString('en-IN', { dateStyle: 'long' })
  }
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString('en-IN', { dateStyle: 'long' })
  }
  return new Date(value).toLocaleDateString('en-IN', { dateStyle: 'long' })
}

const GenerateCertificate = () => {
  const navigate = useNavigate()
  const certificateRef = useRef(null)

  const [formData, setFormData] = useState({ name: '', email: '' })
  const [lookupId, setLookupId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [participant, setParticipant] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)

  const certificateDate = useMemo(() => toDisplayDate(participant?.date), [participant])

  const validateParticipant = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setNoticeType('')
    setParticipant(null)

    const cleanName = formData.name.trim()
    const cleanEmail = formData.email.trim()

    if (!cleanName || !cleanEmail) {
      setError('// ERROR: Both fields required')
      return
    }

    setLoading(true)

    try {
      const participantsRef = collection(db, 'participants')
      const q = query(participantsRef, where('email', '==', cleanEmail))
      const snapshot = await getDocs(q)

      const match = snapshot.docs.find((item) => {
        const participantName = (item.data().name || '').trim().toLowerCase()
        return participantName === cleanName.toLowerCase()
      })

      if (!match) {
        setError('// ERROR: Not a registered participant')
        return
      }

      const participantData = { id: match.id, ...match.data() }
      setParticipant(participantData)

      if (participantData.certificateId) {
        const domain = parseQueryDomain()
        const qrUrl = await generateQRCodeDataUrl(participantData.certificateId, domain)
        setQrCodeUrl(qrUrl)
      }
    } catch (validationError) {
      setError('// ERROR: Verification failed. Retry.')
      console.error(validationError)
    } finally {
      setLoading(false)
    }
  }

  const handleLookup = (e) => {
    e.preventDefault()
    const cleanId = lookupId.trim().toUpperCase()
    if (!cleanId) {
      setError('// ERROR: Enter certificate ID')
      return
    }
    navigate(`/verify/${cleanId}`)
  }

  const sendCertificateByEmail = async () => {
    if (!participant || !certificateRef.current) {
      setError('// ERROR: Certificate not ready')
      return
    }

    setSending(true)
    setError('')
    setNotice('')
    setNoticeType('')

    try {
      let certId = participant.certificateId
      let qrUrl = qrCodeUrl

      if (!certId) {
        certId = generateCertificateId()
        const domain = parseQueryDomain()
        qrUrl = await generateQRCodeDataUrl(certId, domain)
        setQrCodeUrl(qrUrl)
        setParticipant((prev) => ({ ...prev, certificateId: certId }))
        await new Promise((resolve) => window.requestAnimationFrame(() => resolve()))
        await new Promise((resolve) => window.requestAnimationFrame(() => resolve()))
      }

      const element = certificateRef.current
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fff9f9',
        logging: false,
      })

      if (!canvas) throw new Error('Canvas generation failed')

      const imageData = canvas.toDataURL('image/png', 1.0)
      if (!imageData || imageData.length < 100) throw new Error('Invalid image data')

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      pdf.addImage(imageData, 'PNG', 0, 0, 297, 210, undefined, 'FAST')
      const pdfBase64 = pdf.output('datauristring').split(',')[1]

      const response = await fetch(EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          participantName: participant.name,
          participantEmail: participant.email,
          certificateId: certId,
          fileName: `${participant.name.replace(/\s+/g, '_')}_${EVENT_NAME}.pdf`,
          eventName: EVENT_NAME,
          pdfBase64,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const minutes = result.retryAfterMinutes ? Math.ceil(result.retryAfterMinutes) : null
        const message = result.message || 'Unable to send certificate email.'
        throw new Error(minutes ? `${message} Try again after ${minutes} min.` : message)
      }

      const participantDoc = doc(db, 'participants', participant.id)
      await updateDoc(participantDoc, {
        certificateGenerated: true,
        certificateId: certId,
        certificateEmailSentAt: new Date(),
      })

      setParticipant((prev) =>
        prev ? { ...prev, certificateGenerated: true, certificateId: certId, certificateEmailSentAt: new Date() } : prev
      )

      setNotice('>> Certificate dispatched to registered email.')
      setNoticeType('success')
    } catch (downloadError) {
      console.error('PDF Generation Error:', downloadError)
      setError(downloadError.message || '// ERROR: Email dispatch failed')
      setNoticeType('error')
    } finally {
      setSending(false)
    }
  }

  const certificateEmailSentAt = participant?.certificateEmailSentAt?.toDate
    ? participant.certificateEmailSentAt.toDate()
    : participant?.certificateEmailSentAt
      ? new Date(participant.certificateEmailSentAt)
      : null

  const canSendEmail = !certificateEmailSentAt || Date.now() - certificateEmailSentAt.getTime() >= ONE_HOUR_MS
  const nextAllowedAt = certificateEmailSentAt ? new Date(certificateEmailSentAt.getTime() + ONE_HOUR_MS) : null

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="noise-overlay"></div>

      {/* ═══ TICKER BAR ═══ */}
      <div className="brutal-ticker">
        <div className="brutal-ticker-inner">
          {'TECHATHON 1.0 ░░ BGMIT INNOVATION COUNCIL ░░ 24-HOUR HACKATHON ░░ CERTIFICATE PORTAL ░░ '}
          {'TECHATHON 1.0 ░░ BGMIT INNOVATION COUNCIL ░░ 24-HOUR HACKATHON ░░ CERTIFICATE PORTAL ░░ '}
        </div>
      </div>

      {/* ═══ PAGE CONTENT ═══ */}
      <div className="page-container">
        <div className="slide-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ═══════════════════════════
               HEADER
             ═══════════════════════════ */}
          <div className="brutal-card" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <h1 className="brutal-heading" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: 'var(--accent-red)', lineHeight: 1.1 }}>
                  TECHATHON<span style={{ color: 'var(--accent-cyan)' }}>1.0</span>
                </h1>
                <p className="mono" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  // Hackathon Certificate Generation Portal
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ border: '2px solid var(--accent-red)', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <span className="status-dot status-dot-green"></span>
                  <span className="mono" style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                    LIVE
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      document.getElementById('verify-input')?.focus()
                    }} 
                    className="brutal-btn brutal-btn-yellow" 
                    style={{ padding: '6px 12px', fontSize: '11px', boxShadow: '2px 2px 0px #000' }}
                  >
                    VERIFY_CERT →
                  </button>
                  <button 
                    onClick={() => navigate('/admin')} 
                    className="brutal-btn brutal-btn-magenta" 
                    style={{ padding: '6px 12px', fontSize: '11px', boxShadow: '2px 2px 0px #000' }}
                  >
                    ADMIN_PANEL →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════
               VERIFY BY CERT ID
             ═══════════════════════════ */}
          <div className="brutal-card section-gap" style={{ padding: '24px' }}>
            <h2 className="brutal-heading" style={{ fontSize: '14px', color: 'var(--accent-yellow)', marginBottom: '4px' }}>
              ▸ VERIFY BY CERT ID
            </h2>
            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              // Paste certificate ID for instant verification
            </p>
            <form onSubmit={handleLookup} id="verify-form"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                id="verify-input"
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="ENTER_CERT_ID"
                className="brutal-input"
              />
              <button id="verify-btn" type="submit" className="brutal-btn brutal-btn-yellow" style={{ alignSelf: 'flex-start' }}>
                VERIFY →
              </button>
            </form>
          </div>

          {/* ═══════════════════════════
               MAIN 2-COLUMN LAYOUT
             ═══════════════════════════ */}
          <div className="section-gap" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '20px',
          }}>
            {/* On desktop, use 2 columns */}
            <style>{`
              @media (min-width: 768px) {
                .main-grid {
                  grid-template-columns: 380px 1fr !important;
                }
              }
            `}</style>

            <div className="main-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '20px',
              alignItems: 'start',
            }}>

              {/* ── LEFT: VALIDATE FORM ── */}
              <div className="brutal-card" style={{ padding: '24px' }}>
                {/* Section title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '4px', height: '24px', background: 'var(--accent-cyan)', flexShrink: 0 }}></div>
                  <h2 className="brutal-heading" style={{ fontSize: '15px', color: 'var(--accent-cyan)' }}>
                    VALIDATE PARTICIPANT
                  </h2>
                </div>

                <form onSubmit={validateParticipant} id="validate-form">
                  {/* Name field */}
                  <div style={{ marginBottom: '16px' }}>
                    <label className="brutal-label">
                      <span style={{ color: 'var(--accent-red)' }}>→</span> NAME
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="brutal-input"
                      placeholder="participant_name"
                    />
                  </div>

                  {/* Email field */}
                  <div style={{ marginBottom: '20px' }}>
                    <label className="brutal-label">
                      <span style={{ color: 'var(--accent-red)' }}>→</span> EMAIL
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="brutal-input"
                      placeholder="participant@email.com"
                    />
                  </div>

                  <button
                    id="validate-btn"
                    type="submit"
                    disabled={loading}
                    className="brutal-btn"
                    style={{ width: '100%' }}
                  >
                    {loading ? '[ CHECKING... ]' : 'VERIFY & CONTINUE →'}
                  </button>
                </form>

                {/* Error */}
                {error && (
                  <div className="msg-bar msg-bar-error" style={{ marginTop: '16px' }}>
                    {error}
                  </div>
                )}

                {/* Verified info */}
                {participant && (
                  <div className="msg-bar msg-bar-info" style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="status-dot status-dot-green"></span>
                      <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                        VERIFIED
                      </span>
                    </div>
                    <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {participant.name}
                    </p>
                    <p className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                      {participant.email}
                    </p>
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-brutal)' }}>
                      <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        TEAM: <span style={{ color: 'var(--accent-yellow)' }}>{participant.teamName || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: EMAIL SECTION ── */}
              <div className="brutal-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <h2 className="brutal-heading" style={{ fontSize: 'clamp(18px, 3vw, 28px)', color: 'var(--accent-magenta)', lineHeight: 1.2 }}>
                      EMAIL CERTIFICATE
                    </h2>
                    <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '400px' }}>
                      // PDF generated in the background and sent directly to the participant's registered email
                    </p>
                  </div>

                  <button
                    id="send-email-btn"
                    type="button"
                    onClick={sendCertificateByEmail}
                    disabled={sending || !participant || !canSendEmail}
                    className="brutal-btn brutal-btn-cyan"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    {sending ? '[ SENDING... ]' : 'SEND EMAIL →'}
                  </button>
                </div>

                {/* Cooldown notice */}
                {certificateEmailSentAt && !canSendEmail && (
                  <div className="msg-bar msg-bar-warn" style={{ marginTop: '16px' }}>
                    // COOLDOWN: Next request after {nextAllowedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                )}

                {/* Success / Error notice */}
                {notice && (
                  <div className={`msg-bar ${noticeType === 'success' ? 'msg-bar-success' : noticeType === 'error' ? 'msg-bar-error' : 'msg-bar-warn'}`}
                    style={{ marginTop: '16px' }}>
                    {notice}
                  </div>
                )}

                {/* Visual separator + status */}
                {participant && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid var(--border-brutal)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="status-dot status-dot-green"></span>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Participant verified — ready to generate & send
                      </span>
                    </div>
                    {participant.certificateId && (
                      <p className="mono" style={{ fontSize: '12px', color: 'var(--accent-yellow)', marginTop: '8px' }}>
                        CERT_ID: {participant.certificateId}
                      </p>
                    )}
                  </div>
                )}

                {!participant && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid var(--border-brutal)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="status-dot status-dot-red"></span>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Validate participant first to enable email
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden off-screen certificate for PDF rendering */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-10000px',
              top: 0,
              width: '1123px',
              height: '794px',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {participant && (
              <CertificatePreview
                showPreview
                participantName={participant?.name || 'Participant Name'}
                eventName={EVENT_NAME}
                certificateDate={certificateDate}
                certificateId={participant?.certificateId || null}
                qrCodeUrl={qrCodeUrl}
                previewRef={certificateRef}
              />
            )}
          </div>

          {/* ═══ FOOTER ═══ */}
          <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '2px solid var(--border-brutal)', textAlign: 'center' }}>
            <p className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ░░ BGMIT INNOVATION COUNCIL © 2026 ░░ BUILT WITH RAW INTENT ░░
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}

export default GenerateCertificate
