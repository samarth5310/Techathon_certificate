import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useNavigate, Link } from 'react-router-dom'
import { db, auth } from '../firebase/config'
import { generateCertificateId, generateQRCodeDataUrl, parseQueryDomain } from '../utils/certificateUtils'
import { buildWinnerPdf } from '../utils/winnerPdf'
import logoImage from '../../code/logo.png'
import swamiImage from '../../code/swami.png'
import principalSignImage from '../../code/principal_sign.png'
import Papa from 'papaparse'

const EMAIL_ENDPOINT = import.meta.env.VITE_CERTIFICATE_EMAIL_ENDPOINT || '/api/send-certificate-email'

const PRIZE_LABELS = { 1: '🥇 FIRST PRIZE — ₹15,000', 2: '🥈 SECOND PRIZE — ₹10,000', 3: '🥉 THIRD PRIZE — ₹5,000' }
const PRIZE_COLORS = { 1: '#D4AF37', 2: '#C0C0C0', 3: '#CD7F32' }

const AdminWinners = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Winner data state
  const [winners, setWinners] = useState([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [logs, setLogs] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
      if (!currentUser) navigate('/admin/login')
    })
    return () => unsub()
  }, [navigate])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }])
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMessage('')
    setLogs([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        const parsed = []
        for (const row of results.data) {
          const name = (row.name || row['full name'] || row['participant name'] || '').trim()
          const email = (row.email || row['e-mail'] || '').trim()
          const teamName = (row.teamname || row['team name'] || row.team || '').trim()
          const prizeRaw = (row.prize || row['prize position'] || row.position || row.rank || '').trim()

          if (!name || !email) {
            addLog(`Skipping row: missing name or email`, 'error')
            continue
          }

          let prize = parseInt(prizeRaw, 10)
          if (isNaN(prize) || prize < 1 || prize > 3) {
            // Try text matching
            const lower = prizeRaw.toLowerCase()
            if (lower.includes('first') || lower.includes('1st') || lower === '1') prize = 1
            else if (lower.includes('second') || lower.includes('2nd') || lower === '2') prize = 2
            else if (lower.includes('third') || lower.includes('3rd') || lower === '3') prize = 3
            else {
              addLog(`Skipping ${name}: invalid prize "${prizeRaw}" (must be 1, 2, or 3)`, 'error')
              continue
            }
          }

          parsed.push({ name, email, teamName, prize, selected: true })
        }

        if (parsed.length === 0) {
          setMessage('// ERROR: No valid winner rows found. Columns needed: name, email, prize (1/2/3)')
        } else {
          setMessage(`>> Parsed ${parsed.length} winners from CSV`)
          addLog(`Loaded ${parsed.length} winners`, 'success')
        }
        setWinners(parsed)
        e.target.value = ''
      },
      error: (error) => {
        setMessage(`// ERROR: CSV parse failed - ${error.message}`)
      }
    })
  }

  const toggleWinner = (index) => {
    setWinners(prev => prev.map((w, i) => i === index ? { ...w, selected: !w.selected } : w))
  }

  const toggleAll = () => {
    const allSelected = winners.every(w => w.selected)
    setWinners(prev => prev.map(w => ({ ...w, selected: !allSelected })))
  }

  const downloadSinglePdf = async (winner) => {
    try {
      const certId = generateCertificateId()
      const qrUrl = await generateQRCodeDataUrl(certId, parseQueryDomain())

      const pdf = await buildWinnerPdf({
        participantName: winner.name,
        teamName: winner.teamName,
        certificateId: certId,
        eventName: 'TECHATHON 1.0',
        eventDate: '01 May 2026',
        prizePosition: winner.prize,
        qrCodeUrl: qrUrl,
        logoSrc: logoImage,
        swamiSrc: swamiImage,
        principalSignSrc: principalSignImage,
      })

      const fileName = `${winner.name.replace(/\s+/g, '_')}_Winner_Prize${winner.prize}.pdf`
      pdf.save(fileName)
      addLog(`Downloaded PDF for ${winner.name}`, 'success')
    } catch (err) {
      addLog(`PDF download failed for ${winner.name}: ${err.message}`, 'error')
    }
  }

  const sendWinnerEmails = async () => {
    const selected = winners.filter(w => w.selected)
    if (selected.length === 0) return
    if (!window.confirm(`Send winner certificates to ${selected.length} recipient(s)? This will also mark them as winners in the database.`)) return

    setSending(true)
    setProgress({ current: 0, total: selected.length, success: 0, failed: 0 })
    setLogs([])

    for (let i = 0; i < selected.length; i++) {
      const w = selected[i]
      setProgress(prev => ({ ...prev, current: i + 1 }))
      addLog(`Processing ${w.name} (Prize ${w.prize})...`)

      try {
        // 1. Generate cert ID and QR
        const certId = generateCertificateId()
        const qrUrl = await generateQRCodeDataUrl(certId, parseQueryDomain())

        // 2. Build winner PDF
        const pdf = await buildWinnerPdf({
          participantName: w.name,
          teamName: w.teamName,
          certificateId: certId,
          eventName: 'TECHATHON 1.0',
          eventDate: '01 May 2026',
          prizePosition: w.prize,
          qrCodeUrl: qrUrl,
          logoSrc: logoImage,
          swamiSrc: swamiImage,
          principalSignSrc: principalSignImage,
        })

        const base64Pdf = pdf.output('datauristring').split(',')[1]

        // 3. Send email
        const fileName = `${w.name.replace(/\s+/g, '_')}_Winner_Certificate.pdf`
        const res = await fetch(EMAIL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantName: w.name,
            participantEmail: w.email,
            certificateId: certId,
            fileName,
            eventName: 'TECHATHON 1.0',
            pdfBase64: base64Pdf,
          })
        })

        if (!res.ok) throw new Error('Email server rejected request')

        // 4. Mark as winner in Firestore
        const safeEventName = 'techathon1.0'
        const docId = `${w.email.trim()}_${safeEventName}`
        const participantDoc = doc(db, 'participants', docId)
        await setDoc(participantDoc, {
          isWinner: true,
          prizePosition: w.prize,
          winnerCertificateId: certId,
          winnerCertificateSentAt: new Date(),
          certificateGenerated: true,
        }, { merge: true })

        setProgress(prev => ({ ...prev, success: prev.success + 1 }))
        addLog(`✓ Sent to ${w.name} (${w.email})`, 'success')

      } catch (err) {
        setProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
        addLog(`✕ Failed for ${w.name}: ${err.message}`, 'error')
      }
    }

    setSending(false)
    addLog('Winner certificate dispatch complete.', 'info')
  }

  if (authLoading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>[ AUTHENTICATING... ]</p>
      </main>
    )
  }

  if (!user) return null

  const selectedCount = winners.filter(w => w.selected).length
  const grouped = { 1: [], 2: [], 3: [] }
  winners.forEach((w, i) => {
    if (grouped[w.prize]) grouped[w.prize].push({ ...w, _index: i })
  })

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="noise-overlay"></div>

      {/* ═══ TICKER ═══ */}
      <div className="brutal-ticker">
        <div className="brutal-ticker-inner">
          {'WINNER CERTIFICATES ░░ TECHATHON 1.0 ░░ GOLD · SILVER · BRONZE ░░ '}
          {'WINNER CERTIFICATES ░░ TECHATHON 1.0 ░░ GOLD · SILVER · BRONZE ░░ '}
        </div>
      </div>

      <div className="page-container">
        <div className="slide-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ═══ HEADER ═══ */}
          <div className="brutal-card" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '4px', height: '28px', background: '#D4AF37', flexShrink: 0 }}></div>
                  <h1 className="brutal-heading" style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#D4AF37' }}>
                    🏆 WINNER CERTIFICATES
                  </h1>
                </div>
                <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  // Upload winner CSV → Preview → Send certificates with medal badges
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to="/admin" className="brutal-btn brutal-btn-cyan" style={{ padding: '6px 12px', fontSize: '11px', boxShadow: '2px 2px 0px #000', textDecoration: 'none' }}>
                  ← ADMIN
                </Link>
                <button onClick={handleLogout} className="brutal-btn" style={{ padding: '6px 12px', fontSize: '11px', boxShadow: '2px 2px 0px #000' }}>
                  LOGOUT ✕
                </button>
              </div>
            </div>
          </div>

          {/* ═══ CSV UPLOAD ═══ */}
          <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'var(--accent-yellow)', flexShrink: 0 }}></div>
              <h2 className="brutal-heading" style={{ fontSize: '15px', color: 'var(--accent-yellow)' }}>
                ▸ UPLOAD WINNER CSV
              </h2>
            </div>

            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              // CSV columns: <strong style={{ color: 'var(--accent-cyan)' }}>name, email, teamName, prize</strong><br />
              // prize = 1 (₹15,000 Gold), 2 (₹10,000 Silver), 3 (₹5,000 Bronze)
            </p>

            <label style={{ display: 'inline-block', cursor: 'pointer' }}>
              <span className="brutal-btn brutal-btn-yellow" style={{ display: 'inline-flex' }}>
                CHOOSE CSV FILE ↑
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={sending}
                style={{ display: 'none' }}
              />
            </label>

            {message && (
              <div
                className={`msg-bar ${message.includes('ERROR') ? 'msg-bar-error' : 'msg-bar-success'}`}
                style={{ marginTop: '16px' }}
              >
                {message}
              </div>
            )}
          </div>

          {/* ═══ WINNERS TABLE ═══ */}
          {winners.length > 0 && (
            <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '4px', height: '24px', background: '#D4AF37', flexShrink: 0 }}></div>
                  <h2 className="brutal-heading" style={{ fontSize: '15px', color: '#D4AF37' }}>
                    ▸ PARSED WINNERS ({winners.length})
                  </h2>
                </div>
                <button onClick={toggleAll} className="brutal-btn" style={{ padding: '4px 12px', fontSize: '11px' }}>
                  {winners.every(w => w.selected) ? 'DESELECT ALL' : 'SELECT ALL'}
                </button>
              </div>

              {/* Grouped by prize */}
              {[1, 2, 3].map(prizeNum => {
                const group = grouped[prizeNum]
                if (group.length === 0) return null
                return (
                  <div key={prizeNum} style={{ marginBottom: '24px' }}>
                    <div style={{
                      padding: '10px 16px',
                      background: `${PRIZE_COLORS[prizeNum]}22`,
                      border: `2px solid ${PRIZE_COLORS[prizeNum]}`,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span className="mono" style={{ fontSize: '14px', fontWeight: 700, color: PRIZE_COLORS[prizeNum] }}>
                        {PRIZE_LABELS[prizeNum]}
                      </span>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ({group.length} winner{group.length > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {group.map(w => (
                        <div key={w._index} className="data-cell" style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '12px 16px',
                          opacity: w.selected ? 1 : 0.5,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
                            <input
                              type="checkbox"
                              checked={w.selected}
                              onChange={() => toggleWinner(w._index)}
                              disabled={sending}
                              style={{ accentColor: PRIZE_COLORS[prizeNum] }}
                            />
                            <div>
                              <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {w.name}
                              </p>
                              <p className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {w.email}{w.teamName ? ` · Team: ${w.teamName}` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadSinglePdf(w)}
                            className="brutal-btn brutal-btn-yellow"
                            style={{ padding: '4px 10px', fontSize: '10px', boxShadow: '2px 2px 0px #000' }}
                          >
                            PDF ↓
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Send button */}
              <div style={{ borderTop: '2px solid var(--border-brutal)', paddingTop: '20px', marginTop: '8px' }}>
                <button
                  onClick={sendWinnerEmails}
                  disabled={sending || selectedCount === 0}
                  className="brutal-btn brutal-btn-lime"
                  style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, letterSpacing: '0.1em' }}
                >
                  {sending
                    ? `[ SENDING ${progress.current}/${progress.total}... ]`
                    : `SEND ${selectedCount} WINNER CERTIFICATE${selectedCount !== 1 ? 'S' : ''} ✉`
                  }
                </button>

                {/* Progress bar */}
                {sending && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ width: '100%', background: 'var(--bg-input)', height: '8px', border: '1px solid var(--border-brutal)' }}>
                      <div style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                        background: '#D4AF37',
                        height: '100%',
                        transition: 'width 0.3s'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                      <span className="mono" style={{ color: 'var(--accent-lime)' }}>SUCCESS: {progress.success}</span>
                      <span className="mono" style={{ color: 'var(--accent-red)' }}>FAILED: {progress.failed}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ LOGS ═══ */}
          {logs.length > 0 && (
            <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--accent-cyan)', flexShrink: 0 }}></div>
                <h2 className="brutal-heading" style={{ fontSize: '15px', color: 'var(--accent-cyan)' }}>
                  ▸ SYSTEM LOGS
                </h2>
              </div>
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-brutal)',
                padding: '16px',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '12px',
              }}>
                {logs.map((log, i) => (
                  <div key={i} className="mono" style={{
                    marginBottom: '4px',
                    color: log.type === 'error' ? 'var(--accent-red)' : log.type === 'success' ? 'var(--accent-lime)' : 'var(--text-muted)'
                  }}>
                    <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>[{log.time}]</span> {log.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ FOOTER ═══ */}
          <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '2px solid var(--border-brutal)', textAlign: 'center' }}>
            <p className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ░░ WINNER CERTIFICATE CONSOLE ░░ ADMIN ONLY ░░
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}

export default AdminWinners
