import { useEffect, useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import CertificatePreview from '../components/CertificatePreview'
import Template3 from '../components/Template3'
import { collection, getDocs, writeBatch, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase/config'
import { generateCertificateId } from '../utils/certificateUtils'
import Papa from 'papaparse'

const AdminPanel = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const template1Ref = useRef(null)
  const template2Ref = useRef(null)
  const template3Ref = useRef(null)
  const [downloadingPreview, setDownloadingPreview] = useState(false)

  const [stats, setStats] = useState({
    totalParticipants: 0,
    certificatesGenerated: 0,
    certificatesNotGenerated: 0,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  // Event management state
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [newEvent, setNewEvent] = useState({ eventName: '', eventDate: '', department: '' })
  const [addingEvent, setAddingEvent] = useState(false)
  const [eventMessage, setEventMessage] = useState('')

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
      if (!currentUser) {
        navigate('/admin/login')
      }
    })
    return () => unsub()
  }, [navigate])

  // Fetch events on mount
  useEffect(() => {
    if (user) fetchEvents()
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const downloadPreview = async (templateNum) => {
    setDownloadingPreview(true)
    setMessage('')
    try {
      const ref = templateNum === 1 ? template1Ref : templateNum === 2 ? template2Ref : template3Ref
      const element = ref.current
      if (!element) throw new Error('Preview element not found')

      let bgColor = '#fff9f9'
      if (templateNum === 2) bgColor = '#fdf8f0'
      if (templateNum === 3) bgColor = '#0a0e27'

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgColor,
        logging: false,
      })

      const imageData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      pdf.addImage(imageData, 'PNG', 0, 0, 297, 210, undefined, 'FAST')
      
      pdf.save(`Template_${templateNum}_Preview.pdf`)
      setMessage(`>> Template ${templateNum} downloaded successfully`)
    } catch (error) {
      setMessage(`// ERROR: Download failed - ${error.message}`)
    } finally {
      setDownloadingPreview(false)
    }
  }

  const fetchEvents = async () => {
    setEventsLoading(true)
    try {
      const eventsRef = collection(db, 'events')
      const snapshot = await getDocs(eventsRef)
      const eventList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setEvents(eventList)
    } catch (error) {
      setEventMessage(`// ERROR: ${error.message}`)
    } finally {
      setEventsLoading(false)
    }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    const name = newEvent.eventName.trim()
    const date = newEvent.eventDate.trim()
    const dept = newEvent.department.trim()

    if (!name || !date) {
      setEventMessage('// ERROR: Event Name and Date are required')
      return
    }

    setAddingEvent(true)
    setEventMessage('')

    try {
      await addDoc(collection(db, 'events'), {
        eventName: name,
        eventDate: date,
        department: dept,
        createdAt: serverTimestamp(),
      })
      setNewEvent({ eventName: '', eventDate: '', department: '' })
      setEventMessage(`>> Event "${name}" added successfully`)
      fetchEvents()
    } catch (error) {
      setEventMessage(`// ERROR: ${error.message}`)
    } finally {
      setAddingEvent(false)
    }
  }

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!window.confirm(`Delete event "${eventName}"?`)) return
    try {
      await deleteDoc(doc(db, 'events', eventId))
      setEventMessage(`>> Event "${eventName}" deleted`)
      fetchEvents()
    } catch (error) {
      setEventMessage(`// ERROR: ${error.message}`)
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const participantsRef = collection(db, 'participants')
      const snapshot = await getDocs(participantsRef)

      const totalParticipants = snapshot.size
      const certificatesGenerated = snapshot.docs.filter(
        (doc) => doc.data().certificateGenerated
      ).length
      const certificatesNotGenerated = totalParticipants - certificatesGenerated

      setStats({ totalParticipants, certificatesGenerated, certificatesNotGenerated })
      setMessage('')
    } catch (error) {
      setMessage(`// ERROR: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('')

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(), // normalize headers
        complete: async (results) => {
          console.log('CSV Parse Results:', results.data)
          const batch = writeBatch(db)
          let count = 0

          for (const row of results.data) {
            // Check for normalized 'name' and 'email' keys
            const rawEmail = row.email || row['e-mail'] || row['email address']
            const rawName = row.name || row['full name'] || row['participant name']
            
            if (!rawEmail || !rawName) {
              console.warn('Skipping row due to missing name or email:', row)
              continue
            }

            const cleanEmail = rawEmail.trim()
            const cleanName = rawName.trim()

            const rawEvent = row.eventname || row['event name'] || row.event || 'techathon'
            const safeEventName = rawEvent.replace(/\s+/g, '').toLowerCase()
            const docId = `${cleanEmail}_${safeEventName}`
            const participantDoc = doc(db, 'participants', docId)
            const timestamp = new Date(row.date || Date.now())

            batch.set(
              participantDoc,
              {
                name: cleanName,
                email: cleanEmail,
                teamName: row.teamname || row['team name'] || '',
                role: row.role || '',
                problemStatement: row.problemstatement || row['problem statement'] || '',
                teamPhotoUrl: row.teamphotourl || row['team photo url'] || '',
                certificateGenerated: row.certificategenerated === 'true' || false,
                certificateId: row.certificateid || row['certificate id'] || generateCertificateId(),
                eventName: rawEvent,
                date: timestamp,
              },
              { merge: true }
            )
            count++
          }

          if (count === 0) {
            setMessage('// ERROR: No valid rows found. Check column names (name, email).')
            setUploading(false)
            return
          }

          await batch.commit()
          setMessage(`>> Successfully uploaded ${count} participants`)
          fetchStats()
          
          // Reset file input
          e.target.value = ''
        },
        error: (error) => {
          console.error('PapaParse Error:', error)
          setMessage(`// ERROR: CSV parse - ${error.message}`)
        },
      })
    } catch (error) {
      console.error('Upload catch error:', error)
      setMessage(`// ERROR: Upload failed - ${error.message}`)
    } finally {
      // Note: we don't setUploading(false) here because Papa.parse is async
      // and we want it to stay 'uploading' until complete callback runs
      setTimeout(() => setUploading(false), 2000)
    }
  }

  if (authLoading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>[ AUTHENTICATING... ]</p>
      </main>
    )
  }

  if (!user) return null

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="noise-overlay"></div>

      {/* ═══ TICKER ═══ */}
      <div className="brutal-ticker">
        <div className="brutal-ticker-inner">
          {'ADMIN PANEL ░░ RESTRICTED ACCESS ░░ MANAGE EVENTS & CERTIFICATES ░░ '}
          {'ADMIN PANEL ░░ RESTRICTED ACCESS ░░ MANAGE EVENTS & CERTIFICATES ░░ '}
        </div>
      </div>

      <div className="page-container">
        <div className="slide-in" style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* ═══ HEADER ═══ */}
          <div className="brutal-card" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '4px', height: '28px', background: 'var(--accent-red)', flexShrink: 0 }}></div>
                  <h1 className="brutal-heading" style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: 'var(--accent-red)' }}>
                    ADMIN PANEL
                  </h1>
                </div>
                <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  // Logged in as {user.email}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/admin/bulk-email')}
                  className="brutal-btn brutal-btn-yellow"
                  style={{ padding: '6px 12px', fontSize: '11px', boxShadow: '2px 2px 0px #000' }}
                >
                  BULK EMAIL ✉
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="brutal-btn brutal-btn-cyan"
                  style={{ padding: '6px 12px', fontSize: '11px', boxShadow: '2px 2px 0px #000' }}
                >
                  ← PORTAL
                </button>
                <button
                  onClick={handleLogout}
                  className="brutal-btn"
                  style={{ padding: '6px 12px', fontSize: '11px', boxShadow: '2px 2px 0px #000' }}
                >
                  LOGOUT ✕
                </button>
              </div>
            </div>
          </div>

          {/* ═══ EVENT MANAGEMENT ═══ */}
          <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'var(--accent-lime)', flexShrink: 0 }}></div>
              <h2 className="brutal-heading" style={{ fontSize: '15px', color: 'var(--accent-lime)' }}>
                ▸ MANAGE EVENTS
              </h2>
            </div>

            {/* Add event form */}
            <form onSubmit={handleAddEvent} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="brutal-label" style={{ color: 'var(--accent-lime)' }}>EVENT NAME</label>
                  <input
                    type="text"
                    value={newEvent.eventName}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, eventName: e.target.value }))}
                    className="brutal-input"
                    placeholder="e.g. CodeFest 2026"
                  />
                </div>
                <div>
                  <label className="brutal-label" style={{ color: 'var(--accent-lime)' }}>EVENT DATE</label>
                  <input
                    type="text"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="brutal-input"
                    placeholder="e.g. 15th Aug 2026"
                  />
                </div>
                <div>
                  <label className="brutal-label" style={{ color: 'var(--accent-lime)' }}>DEPARTMENT</label>
                  <input
                    type="text"
                    value={newEvent.department}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, department: e.target.value }))}
                    className="brutal-input"
                    placeholder="e.g. CSE"
                  />
                </div>
              </div>
              <button type="submit" disabled={addingEvent} className="brutal-btn brutal-btn-lime">
                {addingEvent ? '[ ADDING... ]' : 'ADD EVENT +'}
              </button>
            </form>

            {eventMessage && (
              <div className={`msg-bar ${eventMessage.includes('ERROR') ? 'msg-bar-error' : 'msg-bar-success'}`} style={{ marginBottom: '16px' }}>
                {eventMessage}
              </div>
            )}

            {/* Events list */}
            <div>
              <p className="brutal-label" style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
                EXISTING EVENTS ({events.length})
              </p>
              {eventsLoading ? (
                <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</p>
              ) : events.length === 0 ? (
                <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No events added yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {events.map((ev) => (
                    <div key={ev.id} className="data-cell" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px' }}>
                      <div>
                        <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-lime)' }}>{ev.eventName}</p>
                        <p className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {ev.eventDate}{ev.department ? ` · ${ev.department}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.eventName)}
                        className="brutal-btn"
                        style={{ padding: '4px 10px', fontSize: '10px', boxShadow: '2px 2px 0px #000' }}
                      >
                        DELETE ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══ STATISTICS ═══ */}
          <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'var(--accent-yellow)', flexShrink: 0 }}></div>
              <h2 className="brutal-heading" style={{ fontSize: '15px', color: 'var(--accent-yellow)' }}>
                ▸ STATISTICS
              </h2>
            </div>

            <button
              id="refresh-stats-btn"
              onClick={fetchStats}
              disabled={loading}
              className="brutal-btn brutal-btn-cyan"
              style={{ marginBottom: '20px' }}
            >
              {loading ? '[ LOADING... ]' : 'REFRESH STATS →'}
            </button>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              <div className="data-cell" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p className="mono" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: 'var(--accent-cyan)', lineHeight: 1 }}>
                  {stats.totalParticipants}
                </p>
                <p className="brutal-label" style={{ marginTop: '12px', marginBottom: 0 }}>TOTAL</p>
              </div>

              <div className="data-cell" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p className="mono" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: 'var(--accent-lime)', lineHeight: 1 }}>
                  {stats.certificatesGenerated}
                </p>
                <p className="brutal-label" style={{ marginTop: '12px', marginBottom: 0, color: 'var(--accent-lime)' }}>GENERATED</p>
              </div>

              <div className="data-cell" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p className="mono" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: 'var(--accent-yellow)', lineHeight: 1 }}>
                  {stats.certificatesNotGenerated}
                </p>
                <p className="brutal-label" style={{ marginTop: '12px', marginBottom: 0, color: 'var(--accent-yellow)' }}>PENDING</p>
              </div>
            </div>
          </div>

          {/* ═══ CSV UPLOAD ═══ */}
          <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'var(--accent-magenta)', flexShrink: 0 }}></div>
              <h2 className="brutal-heading" style={{ fontSize: '15px', color: 'var(--accent-magenta)' }}>
                ▸ UPLOAD PARTICIPANTS (CSV)
              </h2>
            </div>

            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              // CSV columns: name, email, teamName, role, problemStatement,<br />
              // teamPhotoUrl, certificateGenerated, certificateId, eventName, date
            </p>

            <label style={{ display: 'inline-block', cursor: 'pointer' }}>
              <span className="brutal-btn brutal-btn-lime" style={{ display: 'inline-flex' }}>
                CHOOSE CSV FILE ↑
              </span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>

            {message && (
              <div
                className={`msg-bar ${message.includes('ERROR') ? 'msg-bar-error' : 'msg-bar-success'}`}
                style={{ marginTop: '20px' }}
              >
                {message}
              </div>
            )}
          </div>

          {/* ═══ TEMPLATE PREVIEWS ═══ */}
          <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'var(--accent-cyan)', flexShrink: 0 }}></div>
              <h2 className="brutal-heading" style={{ fontSize: '15px', color: 'var(--accent-cyan)' }}>
                ▸ TEMPLATE PREVIEWS
              </h2>
            </div>

            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              // Generate and download a preview PDF of the certificate templates with random admin data.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => downloadPreview(1)}
                disabled={downloadingPreview}
                className="brutal-btn brutal-btn-cyan"
              >
                {downloadingPreview ? '[ DOWNLOADING... ]' : 'DOWNLOAD TEMPLATE 1 ↓'}
              </button>
              <button
                onClick={() => downloadPreview(2)}
                disabled={downloadingPreview}
                className="brutal-btn brutal-btn-yellow"
              >
                {downloadingPreview ? '[ DOWNLOADING... ]' : 'DOWNLOAD TEMPLATE 2 ↓'}
              </button>
              <button
                onClick={() => downloadPreview(3)}
                disabled={downloadingPreview}
                className="brutal-btn brutal-btn-magenta"
              >
                {downloadingPreview ? '[ DOWNLOADING... ]' : 'DOWNLOAD TEMPLATE 3 ↓'}
              </button>
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
            <CertificatePreview
              showPreview
              participantName="ADMIN PREVIEW"
              eventName="Techathon 1.0"
              certificateDate="30th April 2026"
              certificateId="ADMIN-PREVIEW-001"
              qrCodeUrl={null}
              previewRef={template1Ref}
            />
            <div style={{ height: '50px' }}></div>
            <CertificatePreview
              showPreview
              participantName="ADMIN PREVIEW"
              eventName="Random Event 2026"
              certificateDate="15th August 2026"
              certificateId="ADMIN-PREVIEW-002"
              department="Computer Science"
              qrCodeUrl={null}
              previewRef={template2Ref}
            />
            <div style={{ height: '50px' }}></div>
            {/* Raw Template 3 for downloading without CertificatePreview wrapper logic */}
            <div
              ref={template3Ref}
              style={{
                width: '100%',
                maxWidth: '1123px',
                margin: '0 auto',
                overflow: 'hidden',
                backgroundColor: '#0a0e27',
              }}
            >
              <div style={{ aspectRatio: '1.414 / 1', width: '100%', minWidth: 0, overflow: 'hidden' }}>
                <Template3
                  participantName="ADMIN PREVIEW"
                  eventName="Neon Hackathon 2026"
                  certificateDate="15th August 2026"
                  certificateId="ADMIN-PREVIEW-003"
                  qrCodeUrl={null}
                />
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '2px solid var(--border-brutal)', textAlign: 'center' }}>
            <p className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ░░ ADMIN CONSOLE ░░ RESTRICTED ░░
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}

export default AdminPanel
