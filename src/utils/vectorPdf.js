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
      const isSvg = src.includes('.svg') || src.startsWith('data:image/svg+xml');
      const scale = isSvg ? 8 : 1;
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth * scale
      canvas.height = img.naturalHeight * scale
      const ctx = canvas.getContext('2d')
      if (isSvg) ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png', 1.0))
    }
    img.onerror = reject
    img.src = src
  })
}

/**
 * Build a fully vector certificate PDF matching Template2.jsx layout exactly.
 */
export async function buildVectorPdf({
  participantName = 'Participant Name',
  certificateId = 'BGMIT-XXXX-XXXX',
  qrCodeUrl,
  logoSrc,
  swamiSrc,
}) {
  const [logoData, swamiData] = await Promise.all([
    logoSrc ? loadImage(logoSrc) : Promise.resolve(null),
    swamiSrc ? loadImage(swamiSrc) : Promise.resolve(null),
  ])

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // ─── COLORS ───
  const INDIGO = [67, 56, 202]     // #4338CA
  const GOLD   = [212, 175, 55]    // #D4AF37
  const NAVY   = [30, 58, 138]     // #1E3A8A
  const IVORY  = [250, 249, 246]   // #FAF9F6
  const BLACK  = [0, 0, 0]
  const GREY   = [51, 51, 51]      // #333
  const LGREY  = [102, 102, 102]   // #666
  const SIG_GREY = [85, 85, 85]    // #555

  // ─── LAYOUT METRICS ───
  const outerPad = 9
  const goldBorderW = 3
  const innerGap = 4
  const whiteX = outerPad + goldBorderW + innerGap
  const whiteY = outerPad + goldBorderW + innerGap
  const whiteW = PAGE_W - 2 * whiteX
  const whiteH = PAGE_H - 2 * whiteY
  
  const contentPadV = 8
  const contentPadH = 12
  const contentL = whiteX + contentPadH
  const contentR = whiteX + whiteW - contentPadH
  const centerX = PAGE_W / 2
  const contentW = contentR - contentL

  // ═══ 1. OUTER INDIGO FILL ═══
  pdf.setFillColor(...INDIGO)
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // ═══ 2. GOLD BORDER (Tri-Border effect: Blue -> Gold -> Blue -> White) ═══
  const goldBorderCenter = outerPad + goldBorderW / 2
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(goldBorderW)
  pdf.rect(goldBorderCenter, goldBorderCenter, PAGE_W - 2 * goldBorderCenter, PAGE_H - 2 * goldBorderCenter, 'S')

  // ═══ 3. IVORY WHITE CONTENT AREA ═══
  pdf.setFillColor(...IVORY)
  pdf.rect(whiteX, whiteY, whiteW, whiteH, 'F')

  // ═══ 4. WATERMARK (center, 5% opacity) ═══
  if (logoData) {
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: 0.05 }))
    const wmSize = 75
    pdf.addImage(logoData, 'PNG', centerX - wmSize / 2, PAGE_H / 2 - wmSize / 2, wmSize, wmSize)
    pdf.restoreGraphicsState()
  }

  // ═══ 5. HEADER: Logos + College Name ═══
  const logoW = 18.5
  const logoH = 22.5
  const logoY = whiteY + contentPadV

  // Left logo (BVV)
  if (logoData) {
    pdf.addImage(logoData, 'PNG', contentL, logoY, logoW, logoH)
  }
  // Right logo (Swami)
  if (swamiData) {
    pdf.addImage(swamiData, 'PNG', contentR - logoW, logoY, logoW, logoH)
  }

  // "B.V.V SANGHA'S" - Perfectly centered
  pdf.setFont('times', 'bold')
  pdf.setFontSize(13)
  pdf.setTextColor(...NAVY)
  const bvvY = logoY + 6
  pdf.text("B.V.V SANGHA'S", centerX, bvvY, { align: 'center', charSpace: 1.5 })

  // College name - Split into two lines as requested, perfectly centered
  pdf.setFontSize(16)
  const collegeY1 = bvvY + 6.5
  pdf.text('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF TECHNOLOGY,', centerX, collegeY1, { align: 'center' })
  const collegeY2 = collegeY1 + 6.5
  pdf.text('MUDHOL', centerX, collegeY2, { align: 'center' })

  // ═══ 6. GOLD DIVIDER WITH DOTS ═══
  const divY = collegeY2 + 5
  const collegeMaxW = pdf.getTextWidth('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF TECHNOLOGY,')
  const divW = collegeMaxW * 0.95
  const divL = centerX - divW / 2
  const divR = centerX + divW / 2
  const dotR = 0.9

  pdf.setFillColor(...GOLD)
  pdf.circle(divL, divY, dotR, 'F')
  pdf.circle(divR, divY, dotR, 'F')
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.5)
  pdf.line(divL + dotR + 1, divY, divR - dotR - 1, divY)

  // ═══ 7. CERTIFICATE TITLE ═══
  const titleY = divY + 14
  pdf.setFont('times', 'bold')
  pdf.setFontSize(18) // Reduced slightly to help it look centered
  pdf.setTextColor(...NAVY)
  pdf.text('CERTIFICATE OF PARTICIPATION', centerX, titleY, { align: 'center', charSpace: 2.5 })

  // ═══ 8. CENTRAL CONTENT AREA ═══
  const certifyY = titleY + 16
  pdf.setFont('times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...GREY)
  pdf.text('THIS IS TO CERTIFY THAT', centerX, certifyY, { align: 'center', charSpace: 0.4 })

  // ═══ 9. PARTICIPANT NAME ═══
  const nameLen = participantName.length
  let nameFontPt = 32
  if (nameLen > 25) nameFontPt = 22
  else if (nameLen > 18) nameFontPt = 26

  const nameY = certifyY + 15
  pdf.setFont('times', 'bold')
  pdf.setFontSize(nameFontPt)
  pdf.setTextColor(...NAVY)
  pdf.text(participantName, centerX, nameY, { align: 'center' })

  // Underline
  const nameTextW = pdf.getTextWidth(participantName)
  const underlineW = Math.max(nameTextW + 10, contentW * 0.6)
  const underlineY = nameY + 3
  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.5)
  pdf.line(centerX - underlineW / 2, underlineY, centerX + underlineW / 2, underlineY)

  // ═══ 10. BODY TEXT (Increased size, bolded event name, perfectly centered) ═══
  pdf.setTextColor(...GREY)
  const bodyY1 = underlineY + 12
  const lineHeight = 7.5

  // Line 1: Normal + Bold + Normal
  pdf.setFontSize(13)
  pdf.setFont('times', 'normal')
  const p1 = 'has actively participated in the '
  const w1 = pdf.getTextWidth(p1)

  pdf.setFont('times', 'bold')
  const p2 = '24-Hour Hackathon TECHATHON 1.0'
  const w2 = pdf.getTextWidth(p2)

  pdf.setFont('times', 'normal')
  const p3 = ', conducted from April 30th to May 1st, 2026. The'
  const w3 = pdf.getTextWidth(p3)

  const totalW1 = w1 + w2 + w3
  let startX1 = centerX - totalW1 / 2

  pdf.text(p1, startX1, bodyY1)
  startX1 += w1
  pdf.setFont('times', 'bold')
  pdf.text(p2, startX1, bodyY1)
  startX1 += w2
  pdf.setFont('times', 'normal')
  pdf.text(p3, startX1, bodyY1)

  // Line 2
  const bodyY2 = bodyY1 + lineHeight
  pdf.text('event was organized by BGMIT, Mudhol. Throughout the competition, the participant demonstrated exceptional enthusiasm,', centerX, bodyY2, { align: 'center' })

  // Line 3
  const bodyY3 = bodyY2 + lineHeight
  pdf.text('creativity, and a steadfast commitment to innovation.', centerX, bodyY3, { align: 'center' })

  // ═══ 11. SIGNATURE LINES (Increased font size, brought up) ═══
  const sigBottomMargin = 22 // Brought up further from bottom
  const sigY = whiteY + whiteH - sigBottomMargin

  const sigNames = [
    { name: 'Prof. Faculty Name', role: 'Faculty Coordinator' },
    { name: 'Prof. Event Name', role: 'Event Coordinator' },
    { name: 'Dr. HOD Name', role: 'HOD, Dept. of CSE' },
    { name: 'Dr. Principal Name', role: 'Principal, BGMIT' },
  ]

  const sigSpacing = contentW / 4
  const sigLineW = sigSpacing * 0.75

  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.4)

  sigNames.forEach((sig, i) => {
    const sx = contentL + sigSpacing * (i + 0.5)
    const lineY = sigY
    
    pdf.line(sx - sigLineW / 2, lineY, sx + sigLineW / 2, lineY)
    
    // Increased faculty name size
    pdf.setFont('times', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(...NAVY)
    pdf.text(sig.name, sx, lineY + 4.5, { align: 'center' })
    
    // Increased role size
    pdf.setFont('times', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...SIG_GREY)
    pdf.text(sig.role, sx, lineY + 8.5, { align: 'center' })
  })

  // ═══ 12. DATE & PLACE ═══
  const datePlaceY = sigY - 14 // Relative to signatures

  pdf.setFont('times', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...GREY)
  pdf.text('Date:', contentL, datePlaceY)
  pdf.setFont('times', 'normal')
  pdf.text(' 01 May 2026', contentL + pdf.getTextWidth('Date:') + 1, datePlaceY)

  pdf.setFont('times', 'bold')
  pdf.text('Place:', contentR - pdf.getTextWidth('Place:') - pdf.getTextWidth(' Mudhol') - 1, datePlaceY)
  pdf.setFont('times', 'normal')
  const placeTextX = contentR - pdf.getTextWidth(' Mudhol')
  pdf.text(' Mudhol', placeTextX, datePlaceY)

  // ═══ 13. QR CODE (bottom-left) ═══
  if (qrCodeUrl) {
    const qrSize = 14
    const qrX = whiteX + 4
    const qrY = whiteY + whiteH - 4 - qrSize
    pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    
    pdf.setDrawColor(204, 204, 204)
    pdf.setLineWidth(0.3)
    pdf.rect(qrX, qrY, qrSize, qrSize, 'S')
  }

  // ═══ 14. CERTIFICATE ID (bottom-right) ═══
  const certIdX = whiteX + whiteW - contentPadH
  const certIdY = whiteY + whiteH - 4

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...LGREY)
  pdf.text('Certificate ID:', certIdX, certIdY - 4.5, { align: 'right' })

  pdf.setFont('courier', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...NAVY)
  pdf.text(certificateId, certIdX, certIdY - 1, { align: 'right' })

  return pdf
}
