import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate('/admin')
    } catch (err) {
      console.error('Login error:', err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('// ERROR: Invalid credentials')
      } else {
        setError(`// ERROR: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="noise-overlay"></div>

      {/* ═══ TICKER ═══ */}
      <div className="brutal-ticker">
        <div className="brutal-ticker-inner">
          {'ADMIN LOGIN ░░ RESTRICTED ACCESS ░░ AUTHORIZED PERSONNEL ONLY ░░ '}
          {'ADMIN LOGIN ░░ RESTRICTED ACCESS ░░ AUTHORIZED PERSONNEL ONLY ░░ '}
        </div>
      </div>

      <div className="page-container">
        <div className="slide-in" style={{ maxWidth: '480px', margin: '60px auto 0' }}>

          {/* ═══ HEADER ═══ */}
          <div className="brutal-card" style={{ padding: '32px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '4px', height: '28px', background: 'var(--accent-magenta)', flexShrink: 0 }}></div>
              <h1 className="brutal-heading" style={{ fontSize: 'clamp(24px, 4vw, 36px)', color: 'var(--accent-magenta)' }}>
                ADMIN LOGIN
              </h1>
            </div>
            <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              // Firebase Authentication Required
            </p>

            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-dot status-dot-red"></span>
              <span className="mono" style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                LOCKED
              </span>
            </div>
          </div>

          {/* ═══ LOGIN FORM ═══ */}
          <div className="brutal-card section-gap" style={{ padding: '28px 24px' }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label className="brutal-label">
                  <span style={{ color: 'var(--accent-red)' }}>→</span> EMAIL
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="brutal-input"
                  placeholder="admin@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="brutal-label">
                  <span style={{ color: 'var(--accent-red)' }}>→</span> PASSWORD
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="brutal-input"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                id="admin-login-btn"
                type="submit"
                disabled={loading}
                className="brutal-btn brutal-btn-magenta"
                style={{ width: '100%' }}
              >
                {loading ? '[ AUTHENTICATING... ]' : 'LOGIN →'}
              </button>
            </form>

            {error && (
              <div className="msg-bar msg-bar-error" style={{ marginTop: '16px' }}>
                {error}
              </div>
            )}
          </div>

          {/* ═══ BACK LINK ═══ */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/')}
              className="mono"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              ← BACK TO CERTIFICATE PORTAL
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}

export default AdminLogin
