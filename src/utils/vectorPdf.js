import jsPDF from 'jspdf'

// A4 Landscape dimensions in mm
const PAGE_W = 297
const PAGE_H = 210

/**
 * Helper: load an image from a URL/path and return a base64 data URL.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Use native resolution for sharpness
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png', 1.0))
    }
    img.onerror = reject
    img.src = src
  })
}

/**
 * Build a fully vector certificate PDF using jsPDF drawing primitives.
 *
 * @param {object} opts
 * @param {string} opts.participantName
 * @param {string} opts.certificateId
 * @param {string} opts.qrCodeUrl - data-url for the QR code image
 * @param {string} opts.logoSrc   - URL/import path for the BVV logo
 * @param {string} opts.swamiSrc  - URL/import path for the Swami image
 * @returns {Promise<jsPDF>} the jsPDF instance (call .save() or .output())
 */
export async function buildVectorPdf({
  participantName = 'Participant Name',
  certificateId = 'BGMIT-XXXX-XXXX',
  qrCodeUrl,
  logoSrc,
  swamiSrc,
}) {
  // Pre-load images in parallel
  const [logoData, swamiData] = await Promise.all([
    logoSrc ? loadImage(logoSrc) : Promise.resolve(null),
    swamiSrc ? loadImage(swamiSrc) : Promise.resolve(null),
  ])

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // ─── COLORS ───
  const INDIGO = [67, 56, 202]     // #4338CA  outer border
  const GOLD   = [212, 175, 55]    // #D4AF37  accent
  const NAVY   = [30, 58, 138]     // #1E3A8A  heading text
  const IVORY  = [250, 249, 246]   // #FAF9F6  background
  const BLACK  = [0, 0, 0]
  const GREY   = [51, 51, 51]      // #333
  const LGREY  = [102, 102, 102]   // #666

  // ─── 1. OUTER INDIGO BORDER (full page) ───
  pdf.setFillColor(...INDIGO)
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // ─── 2. GOLD BORDER ───
  const pad1 = 8 // padding from outer edge
  pdf.setFillColor(...GOLD)
  pdf.rect(pad1, pad1, PAGE_W - 2 * pad1, PAGE_H - 2 * pad1, 'F')

  // ─── 3. IVORY CONTENT AREA ───
  const pad2 = pad1 + 3 // gold border width ~3mm
  pdf.setFillColor(...IVORY)
  pdf.rect(pad2, pad2, PAGE_W - 2 * pad2, PAGE_H - 2 * pad2, 'F')

  // Content area boundaries
  const cx = pad2 + 10  // content left
  const cxR = PAGE_W - pad2 - 10  // content right
  const contentW = cxR - cx
  const centerX = PAGE_W / 2

  // ─── 4. WATERMARK (faint logo in center) ───
  if (logoData) {
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: 0.05 }))
    const wmSize = 70
    pdf.addImage(logoData, 'PNG', centerX - wmSize / 2, PAGE_H / 2 - wmSize / 2, wmSize, wmSize)
    pdf.restoreGraphicsState()
  }

  // ─── 5. HEADER: Logos + College Name ───
  let headerY = pad2 + 8
  const logoW = 14
  const logoH = 18

  if (logoData) {
    pdf.addImage(logoData, 'PNG', centerX - contentW / 2 + 15, headerY, logoW, logoH)
  }
  if (swamiData) {
    pdf.addImage(swamiData, 'PNG', centerX + contentW / 2 - 15 - logoW, headerY, logoW, logoH)
  }

  // College text
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...NAVY)
  pdf.text("B.V.V SANGHA'S", centerX, headerY + 3, { align: 'center' })

  pdf.setFontSize(10)
  pdf.text('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF TECHNOLOGY, MUDHOL', centerX, headerY + 9, {
    align: 'center',
    maxWidth: contentW - 80,
  })

  // ─── 6. GOLD DIVIDER WITH DOTS ───
  const divY = headerY + logoH + 4
  const divHalfW = contentW * 0.35
  const dotR = 1

  pdf.setFillColor(...GOLD)
  // left dot
  pdf.circle(centerX - divHalfW, divY, dotR, 'F')
  // right dot
  pdf.circle(centerX + divHalfW, divY, dotR, 'F')
  // line
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.5)
  pdf.line(centerX - divHalfW + dotR + 1, divY, centerX + divHalfW - dotR - 1, divY)

  // ─── 7. CERTIFICATE TITLE ───
  const titleY = divY + 12
  pdf.setFont('times', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(...NAVY)
  pdf.text('CERTIFICATE OF PARTICIPATION', centerX, titleY, { align: 'center', charSpace: 1.5 })

  // ─── 8. "THIS IS TO CERTIFY THAT" ───
  const certifyY = titleY + 14
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...GREY)
  pdf.text('THIS IS TO CERTIFY THAT', centerX, certifyY, { align: 'center', charSpace: 0.5 })

  // ─── 9. PARTICIPANT NAME ───
  const nameY = certifyY + 14
  // Dynamic font size based on name length
  const nameLen = participantName.length
  let nameFontSize = 22
  if (nameLen > 25) nameFontSize = 14
  else if (nameLen > 18) nameFontSize = 18

  pdf.setFont('times', 'bold')
  pdf.setFontSize(nameFontSize)
  pdf.setTextColor(...NAVY)
  pdf.text(participantName, centerX, nameY, { align: 'center' })

  // Underline below name
  const nameWidth = pdf.getTextWidth(participantName)
  const underlineHalfW = Math.max(nameWidth / 2, contentW * 0.3)
  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.4)
  pdf.line(centerX - underlineHalfW, nameY + 2, centerX + underlineHalfW, nameY + 2)

  // ─── 10. BODY TEXT ───
  const bodyY = nameY + 12
  pdf.setFont('times', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...GREY)

  const bodyText =
    'has actively participated in the 24-Hour Hackathon TECHATHON 1.0, conducted from April 30th to May 1st, 2026. ' +
    'The event was organized by BGMIT, Mudhol. Throughout the competition, the participant demonstrated exceptional enthusiasm, ' +
    'creativity, and a steadfast commitment to innovation.'

  pdf.text(bodyText, centerX, bodyY, {
    align: 'center',
    maxWidth: contentW * 0.8,
    lineHeightFactor: 1.6,
  })

  // ─── 11. DATE & PLACE ───
  const dateY = PAGE_H - pad2 - 48
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...GREY)
  pdf.text('Date: 01 May 2026', cx + 5, dateY)
  pdf.text('Place: Mudhol', cxR - 5, dateY, { align: 'right' })

  // ─── 12. SIGNATURE LINES ───
  const sigY = PAGE_H - pad2 - 32
  const sigLineW = 42
  const sigNames = [
    { name: 'Prof. Faculty Name', role: 'Faculty Coordinator' },
    { name: 'Prof. Event Name', role: 'Event Coordinator' },
    { name: 'Dr. HOD Name', role: 'HOD, Dept. of CSE' },
    { name: 'Dr. Principal Name', role: 'Principal, BGMIT' },
  ]
  const sigSpacing = contentW / sigNames.length
  const sigStartX = cx + sigSpacing / 2

  pdf.setDrawColor(...BLACK)
  pdf.setLineWidth(0.3)

  sigNames.forEach((sig, i) => {
    const sx = sigStartX + i * sigSpacing
    // signature line
    pdf.line(sx - sigLineW / 2, sigY, sx + sigLineW / 2, sigY)
    // name
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6)
    pdf.setTextColor(...NAVY)
    pdf.text(sig.name, sx, sigY + 4, { align: 'center' })
    // role
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(5.5)
    pdf.setTextColor(...LGREY)
    pdf.text(sig.role, sx, sigY + 7, { align: 'center' })
  })

  // ─── 13. QR CODE (bottom-left) ───
  if (qrCodeUrl) {
    const qrSize = 16
    pdf.addImage(qrCodeUrl, 'PNG', cx, PAGE_H - pad2 - qrSize - 4, qrSize, qrSize)
  }

  // ─── 14. CERTIFICATE ID (bottom-right) ───
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(...LGREY)
  pdf.text('Certificate ID:', cxR, PAGE_H - pad2 - 10, { align: 'right' })
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(6)
  pdf.setTextColor(...NAVY)
  pdf.text(certificateId, cxR, PAGE_H - pad2 - 6, { align: 'right' })

  return pdf
}
