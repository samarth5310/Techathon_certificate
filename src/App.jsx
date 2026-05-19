import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GenerateCertificate from './pages/GenerateCertificate'
import VerifyCertificate from './pages/VerifyCertificate'
import AdminPanel from './pages/AdminPanel'
import AdminLogin from './pages/AdminLogin'

import AdminBulkEmail from './pages/AdminBulkEmail'
import AdminWinners from './pages/AdminWinners'

import { useState, useEffect } from 'react'

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <button 
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 9999,
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '2px solid var(--border-brutal)',
          boxShadow: '4px 4px 0px #000',
          padding: '8px 12px',
          fontFamily: 'Space Mono, monospace',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '12px',
          textTransform: 'uppercase'
        }}
      >
        {theme === 'dark' ? '☼ LIGHT' : '☾ DARK'}
      </button>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GenerateCertificate />} />
          <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/bulk-email" element={<AdminBulkEmail />} />
          <Route path="/admin/winners" element={<AdminWinners />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
