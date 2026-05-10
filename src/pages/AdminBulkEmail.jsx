import { useEffect, useState, useRef } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useNavigate, Link } from 'react-router-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { db, auth } from '../firebase/config'
import CertificatePreview from '../components/CertificatePreview'
import { generateCertificateId, generateQRCodeDataUrl, parseQueryDomain } from '../utils/certificateUtils'

const EMAIL_ENDPOINT = import.meta.env.VITE_CERTIFICATE_EMAIL_ENDPOINT || '/api/send-certificate-email'

const AdminBulkEmail = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [logs, setLogs] = useState([])

  // Hidden certificate state for rendering
  const certRef = useRef(null)
  const [currentRender, setCurrentRender] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) navigate('/admin/login')
      else fetchParticipants()
    })
    return () => unsub()
  }, [navigate])

  const fetchParticipants = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'participants'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setParticipants(list.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      addLog(`Error fetching participants: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }])
  }

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selectedIds.length === participants.length) setSelectedIds([])
    else setSelectedIds(participants.map(p => p.id))
  }

  const sendBulkEmails = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to send ${selectedIds.length} emails? This may take several minutes.`)) return

    setSending(true)
    setProgress({ current: 0, total: selectedIds.length, success: 0, failed: 0 })
    setLogs([])

    const targets = participants.filter(p => selectedIds.includes(p.id))

    for (let i = 0; i < targets.length; i++) {
      const p = targets[i]
      setProgress(prev => ({ ...prev, current: i + 1 }))
      addLog(`Processing ${p.name} (${p.email})...`)

      try {
        // 1. Prepare Data
        let certId = p.certificateId
        if (!certId) {
          certId = generateCertificateId()
          await updateDoc(doc(db, 'participants', p.id), { certificateId: certId })
        }
        
        const qrUrl = await generateQRCodeDataUrl(certId, parseQueryDomain())
        const renderData = { ...p, certificateId: certId, qrCodeUrl: qrUrl }
        
        // 2. Render to DOM
        setCurrentRender(renderData)
        await new Promise(r => setTimeout(r, 500)) // Wait for React to render and images to load
        
        // 3. Generate PDF
        if (!certRef.current) throw new Error('Certificate DOM element missing')
        const canvas = await html2canvas(certRef.current, { scale: 2.5, useCORS: true, allowTaint: true, backgroundColor: '#fff9f9', logging: false })
        const imageData = canvas.toDataURL('image/png', 1.0)
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
        pdf.addImage(imageData, 'PNG', 0, 0, 297, 210, undefined, 'FAST')
        const base64Pdf = pdf.output('datauristring').split(',')[1]
        
        // 4. Send Email
        const fileName = `${p.name.replace(/\s+/g, '_')}_Certificate.pdf`
        const res = await fetch(EMAIL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantName: p.name,
            participantEmail: p.email,
            certificateId: certId,
            fileName,
            eventName: p.eventName || 'Techathon',
            pdfBase64: base64Pdf
          })
        })
        
        if (!res.ok) throw new Error('Email server rejected request')

        // 5. Success
        await updateDoc(doc(db, 'participants', p.id), { certificateEmailSentAt: new Date() })
        
        // Update local state to reflect sent status
        setParticipants(prev => prev.map(participant => 
          participant.id === p.id 
            ? { ...participant, certificateEmailSentAt: new Date() } 
            : participant
        ))
        
        setProgress(prev => ({ ...prev, success: prev.success + 1 }))
        addLog(`Successfully sent to ${p.name}`, 'success')

      } catch (err) {
        setProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
        addLog(`Failed for ${p.name}: ${err.message}`, 'error')
      }
    }

    setSending(false)
    setCurrentRender(null)
    addLog('Bulk operation complete.', 'info')
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-primary)', background: 'var(--bg-dark)', minHeight: '100vh', fontFamily: 'monospace' }}>Loading data...</div>

  return (
    <div style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'monospace', padding: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-brutal)', paddingBottom: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: 'var(--accent-yellow)', margin: 0, fontSize: '24px' }}>BULK EMAIL DISPATCHER</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>// Send certificates directly to participant inboxes</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '8px 16px', textDecoration: 'none', border: '1px solid var(--border-brutal)' }}>BACK TO ADMIN</Link>
          <button onClick={handleLogout} style={{ background: 'var(--accent-red)', color: '#000', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>LOGOUT</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        
        {/* Left: Participant List */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-brutal)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h2 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '18px' }}>PARTICIPANTS ({participants.length})</h2>
            <button onClick={toggleAll} style={{ background: 'var(--bg-card-inner)', color: 'var(--text-primary)', border: '1px solid var(--border-brutal)', padding: '4px 12px', cursor: 'pointer' }}>
              {selectedIds.length === participants.length ? 'DESELECT ALL' : 'SELECT ALL'}
            </button>
          </div>
          
          <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid var(--border-brutal)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ background: 'var(--bg-card-inner)', textAlign: 'left', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '10px', width: '40px' }}></th>
                  <th style={{ padding: '10px' }}>NAME</th>
                  <th style={{ padding: '10px' }}>EMAIL</th>
                  <th style={{ padding: '10px' }}>EVENT</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-brutal)', background: selectedIds.includes(p.id) ? 'var(--bg-input)' : 'transparent' }}>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(p.id)} 
                        onChange={() => toggleSelection(p.id)}
                        disabled={sending}
                      />
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{p.name}</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{p.email}</td>
                    <td style={{ padding: '10px', color: 'var(--accent-cyan)' }}>{p.eventName}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: p.certificateEmailSentAt ? 'var(--accent-lime)' : 'var(--accent-red)' }}>
                      {p.certificateEmailSentAt ? 'SENT' : 'NOT SENT'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Controls & Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Action Panel */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-brutal)', padding: '20px' }}>
            <h2 style={{ color: 'var(--accent-yellow)', margin: '0 0 15px 0', fontSize: '18px' }}>DISPATCH CONTROL</h2>
            <div style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Selected: <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.length}</strong>
            </div>
            <button 
              onClick={sendBulkEmails} 
              disabled={sending || selectedIds.length === 0}
              style={{ 
                width: '100%', padding: '15px', background: sending || selectedIds.length === 0 ? 'var(--bg-input)' : 'var(--accent-cyan)', 
                color: sending || selectedIds.length === 0 ? 'var(--text-muted)' : '#000', 
                border: 'none', fontWeight: 'bold', cursor: sending || selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {sending ? 'SENDING IN PROGRESS...' : 'SEND SELECTED EMAILS'}
            </button>
            
            {sending && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  <span>PROGRESS</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div style={{ width: '100%', background: 'var(--bg-input)', height: '10px' }}>
                  <div style={{ width: `${(progress.current / progress.total) * 100}%`, background: 'var(--accent-cyan)', height: '100%', transition: 'width 0.3s' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '10px' }}>
                  <span style={{ color: 'var(--accent-lime)' }}>SUCCESS: {progress.success}</span>
                  <span style={{ color: 'var(--accent-red)' }}>FAILED: {progress.failed}</span>
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-brutal)', padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: 'var(--accent-cyan)', margin: '0 0 10px 0', fontSize: '18px' }}>SYSTEM LOGS</h2>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-brutal)', padding: '10px', flexGrow: 1, overflowY: 'auto', maxHeight: '300px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {logs.length === 0 && <div>No activity...</div>}
              {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '5px', color: log.type === 'error' ? 'var(--accent-red)' : log.type === 'success' ? 'var(--accent-lime)' : 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Hidden Certificate Renderer */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '297mm', height: '210mm' }}>
        {currentRender && (
          <CertificatePreview
            ref={certRef}
            participantName={currentRender.name}
            eventName={currentRender.eventName}
            date={currentRender.date}
            qrCodeUrl={currentRender.qrCodeUrl}
            certificateId={currentRender.certificateId}
            templateId="template1"
          />
        )}
      </div>

    </div>
  )
}

export default AdminBulkEmail
