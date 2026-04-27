import { useState } from 'react'
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { generateCertificateId } from '../utils/certificateUtils'
import Papa from 'papaparse'

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    certificatesGenerated: 0,
    certificatesNotGenerated: 0,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

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
        complete: async (results) => {
          const batch = writeBatch(db)
          let count = 0

          for (const row of results.data) {
            if (!row.email || !row.name) continue

            const participantDoc = doc(db, 'participants', row.email)
            const timestamp = new Date(row.date || Date.now())

            batch.set(
              participantDoc,
              {
                name: row.name,
                email: row.email,
                teamName: row.teamName || '',
                role: row.role || '',
                problemStatement: row.problemStatement || '',
                teamPhotoUrl: row.teamPhotoUrl || '',
                certificateGenerated: row.certificateGenerated === 'true' || false,
                certificateId: row.certificateId || generateCertificateId(),
                eventName: 'Techathon1.0',
                date: timestamp,
              },
              { merge: true }
            )
            count++
          }

          await batch.commit()
          setMessage(`>> Successfully uploaded ${count} participants`)
          fetchStats()
        },
        error: (error) => {
          setMessage(`// ERROR: CSV parse - ${error.message}`)
        },
      })
    } catch (error) {
      setMessage(`// ERROR: Upload failed - ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="noise-overlay"></div>

      {/* ═══ TICKER ═══ */}
      <div className="brutal-ticker">
        <div className="brutal-ticker-inner">
          {'ADMIN PANEL ░░ RESTRICTED ACCESS ░░ MANAGE CERTIFICATES ░░ UPLOAD PARTICIPANTS ░░ '}
          {'ADMIN PANEL ░░ RESTRICTED ACCESS ░░ MANAGE CERTIFICATES ░░ UPLOAD PARTICIPANTS ░░ '}
        </div>
      </div>

      <div className="page-container">
        <div className="slide-in" style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* ═══ HEADER ═══ */}
          <div className="brutal-card" style={{ padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '4px', height: '28px', background: 'var(--accent-red)', flexShrink: 0 }}></div>
              <h1 className="brutal-heading" style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: 'var(--accent-red)' }}>
                ADMIN PANEL
              </h1>
            </div>
            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              // Manage Certificates & Participants
            </p>
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
              // teamPhotoUrl, certificateGenerated, certificateId, date
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
