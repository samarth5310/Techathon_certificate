import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GenerateCertificate from './pages/GenerateCertificate'
import VerifyCertificate from './pages/VerifyCertificate'
import AdminPanel from './pages/AdminPanel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GenerateCertificate />} />
        <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
