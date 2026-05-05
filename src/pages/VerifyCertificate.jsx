import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

const VerifyCertificate = () => {
  const navigate = useNavigate()
  const { certificateId } = useParams()
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchId, setSearchId] = useState(certificateId || '')

  useEffect(() => {
    const fetchCertificate = async () => {
      const idToSearch = (certificateId || '').trim()
      if (!idToSearch) {
        setError('No certificate ID provided')
        setLoading(false)
        return
      }

      console.log('Searching for ID:', idToSearch)

      try {
        const participantsRef = collection(db, 'participants')
        
        // 1. Search by original case
        const q1 = query(participantsRef, where('certificateId', '==', idToSearch))
        // 2. Search by UPPERCASE (most common)
        const q2 = query(participantsRef, where('certificateId', '==', idToSearch.toUpperCase()))
        // 3. Search by lowercase (fallback)
        const q3 = query(participantsRef, where('certificateId', '==', idToSearch.toLowerCase()))
        
        const [s1, s2, s3] = await Promise.all([
          getDocs(q1),
          getDocs(q2),
          getDocs(q3)
        ])

        const snapshot = !s1.empty ? s1 : !s2.empty ? s2 : s3;

        if (snapshot.empty) {
          setError(`Certificate [${idToSearch}] not found in database`)
          setCertificate(null)
        } else {
          const docData = snapshot.docs[0]
          setCertificate({ id: docData.id, ...docData.data() })
          setError('')
        }
      } catch (fetchError) {
        console.error('Error fetching certificate:', fetchError)
        setError('Verification service temporarily unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchCertificate()
  }, [certificateId])

  const formatDate = (value) => {
    if (!value) return 'N/A'
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleDateString('en-IN', { dateStyle: 'long' })
    }
    if (value?.seconds) {
      return new Date(value.seconds * 1000).toLocaleDateString('en-IN', { dateStyle: 'long' })
    }
    return new Date(value).toLocaleDateString('en-IN', { dateStyle: 'long' })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const cleanId = searchId.trim().toUpperCase()
    if (!cleanId) {
      setError('Please enter a certificate ID')
      return
    }
    navigate(`/verify/${cleanId}`)
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="noise-overlay"></div>

      {/* ═══ TICKER ═══ */}
      <div className="brutal-ticker">
        <div className="brutal-ticker-inner">
          {'CERTIFICATE VERIFICATION ░░ TECHATHON 1.0 ░░ BGMIT MUDHOL ░░ AUTHENTICATE YOUR CERT ░░ '}
          {'CERTIFICATE VERIFICATION ░░ TECHATHON 1.0 ░░ BGMIT MUDHOL ░░ AUTHENTICATE YOUR CERT ░░ '}
        </div>
      </div>

      <div className="page-container">
        <div className="slide-in" style={{ maxWidth: '720px', margin: '0 auto' }}>

          {/* ═══ HEADER ═══ */}
          <div className="brutal-card" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '4px', height: '28px', background: 'var(--accent-yellow)', flexShrink: 0 }}></div>
              <h1 className="brutal-heading" style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: 'var(--accent-yellow)' }}>
                VERIFICATION
              </h1>
            </div>
            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              // Techathon1.0 — BGMIT Innovation Council
            </p>
            <button
              id="back-btn"
              onClick={() => navigate('/')}
              className="brutal-btn brutal-btn-lime"
              style={{ fontSize: '12px' }}
            >
              ← BACK TO PORTAL
            </button>
          </div>

          {/* ═══ SEARCH ═══ */}
          <div className="brutal-card section-gap" style={{ padding: '24px' }}>
            <h2 className="brutal-heading" style={{ fontSize: '14px', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
              ▸ SEARCH BY CERT ID
            </h2>
            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              // Paste the certificate ID from QR code or document
            </p>
            <form onSubmit={handleSearch} id="search-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                id="search-input"
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="ENTER_CERT_ID"
                className="brutal-input"
              />
              <button id="search-btn" type="submit" className="brutal-btn brutal-btn-yellow" style={{ alignSelf: 'flex-start' }}>
                VERIFY →
              </button>
            </form>
          </div>

          {/* ═══ RESULTS ═══ */}
          <div className="section-gap">
            {loading ? (
              <div className="brutal-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span className="status-dot status-dot-green"></span>
                  <p className="mono" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    [ VERIFYING... ]
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="brutal-card" style={{ padding: '28px 24px', borderColor: 'var(--accent-red)' }}>
                {/* Error icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '36px', height: '36px', background: 'var(--accent-red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: '#000', fontSize: '20px', flexShrink: 0
                  }}>
                    ✕
                  </div>
                  <h2 className="brutal-heading" style={{ fontSize: 'clamp(18px, 3vw, 26px)', color: 'var(--accent-red)' }}>
                    NOT FOUND
                  </h2>
                </div>
                <div className="msg-bar msg-bar-error">
                  {error}
                </div>
                <p className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                  // If this is an error, contact the event organizers
                </p>
              </div>
            ) : certificate ? (
              <div className="brutal-card" style={{ padding: '28px 24px', borderColor: '#00ff88' }}>
                {/* Verified banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid var(--border-brutal)' }}>
                  <div style={{
                    width: '36px', height: '36px', background: '#00ff88',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: '#000', fontSize: '20px', flexShrink: 0
                  }}>
                    ✓
                  </div>
                  <h2 className="brutal-heading" style={{ fontSize: 'clamp(18px, 3vw, 26px)', color: '#00ff88' }}>
                    CERTIFICATE VERIFIED
                  </h2>
                </div>

                {/* Team photo */}
                {certificate.teamPhotoUrl && (
                  <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <img
                      src={certificate.teamPhotoUrl}
                      alt="Team"
                      style={{ maxWidth: '320px', width: '100%', margin: '0 auto', border: '2px solid var(--border-brutal)', boxShadow: '4px 4px 0 #000' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  </div>
                )}

                {/* Data Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px',
                }}>
                  <div className="data-cell">
                    <p className="brutal-label">PARTICIPANT</p>
                    <p className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-red)' }}>
                      {certificate.name}
                    </p>
                  </div>

                  <div className="data-cell">
                    <p className="brutal-label">EMAIL</p>
                    <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                      {certificate.email}
                    </p>
                  </div>

                  <div className="data-cell">
                    <p className="brutal-label">TEAM</p>
                    <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-yellow)' }}>
                      {certificate.teamName || 'N/A'}
                    </p>
                  </div>

                  <div className="data-cell">
                    <p className="brutal-label">ROLE</p>
                    <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {certificate.role || 'N/A'}
                    </p>
                  </div>

                  <div className="data-cell" style={{ gridColumn: '1 / -1' }}>
                    <p className="brutal-label">PROBLEM STATEMENT</p>
                    <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {certificate.problemStatement || 'N/A'}
                    </p>
                  </div>

                  <div className="data-cell">
                    <p className="brutal-label" style={{ color: 'var(--accent-magenta)' }}>EVENT</p>
                    <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-magenta)' }}>
                      {certificate.eventName}
                    </p>
                  </div>

                  <div className="data-cell">
                    <p className="brutal-label">DATE</p>
                    <p className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {formatDate(certificate.date)}
                    </p>
                  </div>

                  <div className="data-cell" style={{ gridColumn: '1 / -1', borderColor: 'var(--accent-cyan)' }}>
                    <p className="brutal-label">CERTIFICATE ID</p>
                    <p className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                      {certificate.certificateId}
                    </p>
                  </div>
                </div>

                {/* Authentic stamp */}
                <div className="msg-bar msg-bar-success" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="status-dot status-dot-green"></span>
                    <span style={{ fontWeight: 700 }}>✓ THIS CERTIFICATE IS AUTHENTIC AND VERIFIED</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* ═══ FOOTER ═══ */}
          <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '2px solid var(--border-brutal)', textAlign: 'center' }}>
            <p className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ░░ BGMIT INNOVATION COUNCIL © 2026 ░░ VERIFICATION SYSTEM ░░
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}

export default VerifyCertificate
