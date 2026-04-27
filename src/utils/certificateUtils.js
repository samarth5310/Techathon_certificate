import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

export const generateCertificateId = () => {
  return uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)
}

export const generateQRCodeDataUrl = async (certificateId, domain = 'http://localhost:5173') => {
  try {
    const verificationUrl = `${domain}/verify/${certificateId}`
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    return dataUrl
  } catch (err) {
    console.error('QR Code generation failed:', err)
    return null
  }
}

export const parseQueryDomain = () => {
  if (typeof window !== 'undefined') {
    const baseUrl = `${window.location.protocol}//${window.location.host}`
    return baseUrl
  }
  return 'http://localhost:5173'
}
