import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

export const generateCertificateId = () => {
  return uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)
}

export const generateQRCodeDataUrl = async (certificateId, domain = 'https://techathon-certificates.onrender.com') => {
  try {
    const verificationUrl = `${domain}/verify`
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
  return 'https://techathon-certificates.onrender.com'
}
