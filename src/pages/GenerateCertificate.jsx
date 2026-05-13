import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { collection, doc, getDocs, getDoc, query, updateDoc, where, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import CertificatePreview from '../components/CertificatePreview'
import { db } from '../firebase/config'
import { generateCertificateId, generateQRCodeDataUrl, parseQueryDomain } from '../utils/certificateUtils'
import { buildVectorPdf } from '../utils/vectorPdf'
import logoImage from '../../code/logo.svg'
import swamiImage from '../../code/swami.png'

const EMAIL_ENDPOINT = import.meta.env.VITE_CERTIFICATE_EMAIL_ENDPOINT || '/api/send-certificate-email'
const ONE_DAY_MS = 24 * 60 * 60 * 1000 // Standard 24 hours
const TWO_HOUR_MS = 2 * 60 * 60 * 1000

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

  const [formData, setFormData] = useState({ name: '', email: '', eventName: '', eventDate: '' })
  const [lookupId, setLookupId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [participant, setParticipant] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const [events, setEvents] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [sharing, setSharing] = useState(false)

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events')
        const snapshot = await getDocs(eventsRef)
        const eventList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setEvents(eventList)
        // Default to Techathon 1.0 if available or first event
        if (eventList.length > 0 && !formData.eventName) {
          const techathon = eventList.find(e => e.eventName?.toLowerCase().includes('techathon'))
          const first = techathon || eventList[0]
          setFormData(prev => ({ ...prev, eventName: first.eventName, eventDate: first.eventDate || '' }))
          setSelectedDepartment(first.department || '')
        }
      } catch (err) {
        console.error('Failed to fetch events:', err)
      }
    }
    fetchEvents()
  }, [])

  const handleEventChange = (e) => {
    const selected = e.target.value
    const eventObj = events.find((ev) => ev.eventName === selected)
    setFormData(prev => ({
      ...prev,
      eventName: selected,
      eventDate: eventObj?.eventDate || '',
    }))
    setSelectedDepartment(eventObj?.department || '')
  }

  const certificateDate = useMemo(() => formData.eventDate || toDisplayDate(participant?.date), [participant, formData.eventDate])

  const validateParticipant = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setNoticeType('')
    setParticipant(null)

    const cleanName = formData.name.trim()
    const cleanEmail = formData.email.trim()
    const cleanEventName = formData.eventName.trim()

    if (!cleanName || !cleanEmail || !cleanEventName) {
      setError('// ERROR: Name, Email and Event Name are required')
      return
    }

    setLoading(true)

    try {
      const participantsRef = collection(db, 'participants')
      const q = query(participantsRef, where('email', '==', cleanEmail))
      const snapshot = await getDocs(q)

      const match = snapshot.docs.find((item) => {
        const data = item.data()
        const participantName = (data.name || '').trim().toLowerCase()
        
        // Remove spaces for robust event name comparison
        const dbEventName = (data.eventName || 'Techathon 1.0').replace(/\s+/g, '').toLowerCase()
        const formEventName = cleanEventName.replace(/\s+/g, '').toLowerCase()
        
        // Custom logic: Treat "techathon" and "techathon1.0" as the same
        const isTechathonMatch = 
          (dbEventName === 'techathon' && formEventName === 'techathon1.0') ||
          (dbEventName === 'techathon1.0' && formEventName === 'techathon')

        return participantName === cleanName.toLowerCase() && (dbEventName === formEventName || isTechathonMatch)
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
      } else {
        // AUTO-GENERATE ID IF MISSING
        const newId = generateCertificateId()
        const domain = parseQueryDomain()
        const qrUrl = await generateQRCodeDataUrl(newId, domain)
        setQrCodeUrl(qrUrl)
        
        // Save to DB immediately
        const participantRef = doc(db, 'participants', participantData.id)
        await updateDoc(participantRef, {
          certificateId: newId
        })
        
        // Update local state
        setParticipant(prev => ({ ...prev, certificateId: newId }))
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

  const downloadCertificateLocally = async () => {
    if (!participant || !certificateRef.current) {
      setError('// ERROR: Certificate not ready')
      return
    }



    setDownloading(true)
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

      const pdf = await buildVectorPdf({
        participantName: participant.name,
        certificateId: certId,
        qrCodeUrl: qrUrl,
        logoSrc: logoImage,
        swamiSrc: swamiImage,
      })

      const fileName = `${participant.name.replace(/\s+/g, '_')}_${formData.eventName.replace(/\s+/g, '')}.pdf`
      pdf.save(fileName)

      const participantDoc = doc(db, 'participants', participant.id)
      await updateDoc(participantDoc, {
        certificateGenerated: true,
        certificateId: certId,
      })

      setParticipant((prev) =>
        prev ? { ...prev, certificateGenerated: true, certificateId: certId } : prev
      )



      setNotice('>> Certificate downloaded successfully.')
      setNoticeType('success')
    } catch (downloadError) {
      console.error('PDF Download Error:', downloadError)
      setError(downloadError.message || '// ERROR: Download failed')
      setNoticeType('error')
    } finally {
      setDownloading(false)
    }
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

      const pdf = await buildVectorPdf({
        participantName: participant.name,
        certificateId: certId,
        qrCodeUrl: qrUrl,
        logoSrc: logoImage,
        swamiSrc: swamiImage,
      })

      const pdfBase64 = pdf.output('datauristring').split(',')[1]

      const response = await fetch(EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          participantName: participant.name,
          participantEmail: participant.email,
          certificateId: certId,
          fileName: `${participant.name.replace(/\s+/g, '_')}_${formData.eventName.replace(/\s+/g, '')}.pdf`,
          eventName: formData.eventName,
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

  const shareCertificate = async (platform) => {
    if (!participant || !certificateRef.current) return
    setSharing(true)
    try {
      // Ensure certificate has an ID and QR
      let certId = participant.certificateId
      if (!certId) {
        certId = generateCertificateId()
        const domain = parseQueryDomain()
        const qrUrl = await generateQRCodeDataUrl(certId, domain)
        setQrCodeUrl(qrUrl)
        setParticipant((prev) => ({ ...prev, certificateId: certId }))
        
        // SAVE TO DATABASE IMMEDIATELY
        const participantDoc = doc(db, 'participants', participant.id)
        await updateDoc(participantDoc, {
          certificateId: certId,
          certificateGenerated: true
        })

        await new Promise((r) => window.requestAnimationFrame(r))
        await new Promise((r) => window.requestAnimationFrame(r))
      }

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#4a3abf',
        logging: false,
      })

      const name = participant?.name || 'Participant'
      const domain = parseQueryDomain()
      const certLink = `${domain}/verify/${certId}`

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
      const file = new File([blob], `${name.replace(/\s+/g, '_')}_Techathon_Certificate.png`, { type: 'image/png' })

      const linkedInText = `🚀 Proud to share that I, ${name}, successfully participated in TECHATHON 1.0 – 24 Hour Hackathon organized by the Department of CSE & AIML, BGMIT, Mudhol, in collaboration with HackCulture.\n\nOver 24 intense hours, I worked on solving real-world challenges through innovation, teamwork, and technology. This experience helped me sharpen my skills in:\n✅ Problem Solving\n✅ Innovation & Ideation\n✅ Team Collaboration\n✅ Rapid Prototyping\n✅ Technical Implementation under Time Constraints\n\nGrateful to the organizers, mentors, judges, and my teammates for making this an unforgettable experience.\n\n🏆 Event: TECHATHON 1.0\n📍 Venue: BGMIT, Mudhol, Bagalkote\n🗓 Date: 30 April – 1 May 2026\n⏱ Duration: 24 Hours\n\n🔗 Certificate Verification: ${certLink}\n🔗 Event Link: https://techathon-certificates.onrender.com\n\n#TECHATHON1_0 #Hackathon #BGMIT #HackCulture #Innovation #Coding #AI #ML #WebDevelopment #Blockchain #Students #Engineering #Technology #24HourHackathon #ProblemSolving #Developer #TechCommunity #FutureInnovators #CertificateAchievement`

      const whatsAppText = `🚀 Proud to share that I, *${name}*, successfully participated in *TECHATHON 1.0 – 24 Hour Hackathon* organized by the *Department of CSE & AIML, BGMIT, Mudhol* in collaboration with HackCulture.\n\nOver 24 intense hours, I worked on solving real-world challenges through innovation, teamwork, and technology. This experience strengthened my problem-solving, technical, and collaboration skills.\n\n🏆 Event: TECHATHON 1.0\n📍 Venue: BGMIT, Mudhol, Bagalkote\n🗓 Date: 30 April – 1 May 2026\n⏱ Duration: 24 Hours\n\nI'm grateful to the organizers, mentors, judges, and my teammates for this amazing experience.\n\n🔗 Certificate Verification: ${certLink}\n🔗 Event Details: https://techathon-certificates.onrender.com\n\nBuild. Innovate. Create.`

      const shareText = platform === 'linkedin' ? linkedInText : whatsAppText

      // Try native share API with file (works on mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] })
      } else {
        // Fallback: download image, then open share URL
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = file.name
        link.click()
        URL.revokeObjectURL(link.href)

        setTimeout(() => {
          if (platform === 'linkedin') {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certLink)}`, '_blank', 'noopener,noreferrer')
          } else {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
          }
        }, 500)
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share error:', err)
    } finally {
      setSharing(false)
    }
  }

  const certificateEmailSentAt = participant?.certificateEmailSentAt?.toDate
    ? participant.certificateEmailSentAt.toDate()
    : participant?.certificateEmailSentAt
      ? new Date(participant.certificateEmailSentAt)
      : null

  const isTestingEmail = participant?.email?.trim().toLowerCase() === 'ffgzk5310@gmail.com'
  const cooldownPeriod = isTestingEmail ? 2 * 60 * 1000 : ONE_DAY_MS // 2 minutes for test email
  const canSendEmail = !certificateEmailSentAt || Date.now() - certificateEmailSentAt.getTime() >= cooldownPeriod
  const nextAllowedAt = certificateEmailSentAt ? new Date(certificateEmailSentAt.getTime() + cooldownPeriod) : null

  // Download cooldown removed as requested
  const canDownload = true 
  const nextDownloadAt = null

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
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div style={{ border: '2px solid var(--accent-red)', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <span className="status-dot status-dot-green"></span>
                  <span className="mono" style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                    LIVE
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                  <div style={{ marginBottom: '16px' }}>
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

                  {/* Event Name Dropdown */}
                  <div style={{ marginBottom: '16px' }}>
                    <label className="brutal-label">
                      <span style={{ color: 'var(--accent-red)' }}>→</span> EVENT NAME
                    </label>
                    <select
                      id="event-input"
                      value={formData.eventName}
                      onChange={handleEventChange}
                      className="brutal-input"
                      style={{ cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23999%27 d=%27M6 8L1 3h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                    >
                      <option value="" disabled>Select Event...</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.eventName}>{ev.eventName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Event Date (auto-filled, read-only) */}
                  <div style={{ marginBottom: '20px' }}>
                    <label className="brutal-label">
                      <span style={{ color: 'var(--accent-red)' }}>→</span> EVENT DATE
                    </label>
                    <input
                      id="date-input"
                      type="text"
                      value={formData.eventDate}
                      readOnly
                      className="brutal-input"
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                      placeholder="Auto-filled from event"
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

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      id="download-pdf-btn"
                      type="button"
                      onClick={downloadCertificateLocally}
                      disabled={downloading || !participant}
                      className="brutal-btn brutal-btn-yellow"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" x2="12" y1="15" y2="3"/>
                      </svg>
                      {downloading ? '[ DOWNLOADING... ]' : 'DOWNLOAD ↓'}
                    </button>
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
                      {sending ? '[ SENDING... ]' : !canSendEmail ? '[ COOLDOWN ]' : 'EMAIL CERTIFICATE'}
                    </button>
                  </div>
                </div>


                {/* Email cooldown notice */}
                {certificateEmailSentAt && !canSendEmail && (
                  <div className="msg-bar msg-bar-warn" style={{ marginTop: '16px' }}>
                    // EMAIL COOLDOWN: Next request after {nextAllowedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
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

                {/* ── SOCIAL SHARE SECTION ── */}
                {participant && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px dashed var(--border-brutal)' }}>
                    <h3 className="brutal-heading" style={{ fontSize: 'clamp(14px, 2vw, 20px)', color: 'var(--accent-cyan)', marginBottom: '12px', letterSpacing: '0.1em' }}>
                      📣 SHARE YOUR ACHIEVEMENT
                    </h3>
                    <p className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      // Spread the word — certificate image will be attached automatically
                    </p>
                    <p className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.7 }}>
                      // On mobile: shares image directly • On desktop: downloads image + opens share page
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        id="share-linkedin-btn"
                        type="button"
                        onClick={() => shareCertificate('linkedin')}
                        disabled={sharing}
                        className="brutal-btn"
                        style={{
                          background: '#0A66C2',
                          color: '#fff',
                          border: '2px solid #084d94',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: 'clamp(11px, 1.5vw, 14px)',
                          padding: '10px 18px',
                          cursor: sharing ? 'wait' : 'pointer',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          opacity: sharing ? 0.6 : 1,
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        {sharing ? '[ GENERATING... ]' : 'SHARE ON LINKEDIN'}
                      </button>

                      <button
                        id="share-whatsapp-btn"
                        type="button"
                        onClick={() => shareCertificate('whatsapp')}
                        disabled={sharing}
                        className="brutal-btn"
                        style={{
                          background: '#25D366',
                          color: '#fff',
                          border: '2px solid #1da851',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: 'clamp(11px, 1.5vw, 14px)',
                          padding: '10px 18px',
                          cursor: sharing ? 'wait' : 'pointer',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          opacity: sharing ? 0.6 : 1,
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {sharing ? '[ GENERATING... ]' : 'SHARE ON WHATSAPP'}
                      </button>
                    </div>
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

                {/* Visible Certificate Preview removed as requested */}
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
                eventName={formData.eventName}
                certificateDate={certificateDate}
                certificateId={participant?.certificateId || null}
                qrCodeUrl={qrCodeUrl}
                department={selectedDepartment}
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
