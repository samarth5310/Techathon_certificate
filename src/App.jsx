import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GenerateCertificate from './pages/GenerateCertificate'
import VerifyCertificate from './pages/VerifyCertificate'
import AdminPanel from './pages/AdminPanel'
import AdminLogin from './pages/AdminLogin'

import AdminBulkEmail from './pages/AdminBulkEmail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GenerateCertificate />} />
        <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/bulk-email" element={<AdminBulkEmail />} />
      </Routes>
    </BrowserRouter>

  )
}

export default App
