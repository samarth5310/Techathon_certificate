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
      
      let w = img.naturalWidth * scale
      let h = img.naturalHeight * scale
      
      // Cap dimensions to 800px to reduce file size while maintaining print quality
      const MAX_DIM = 800
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = (MAX_DIM / w) * h
          w = MAX_DIM
        } else {
          w = (MAX_DIM / h) * w
          h = MAX_DIM
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/png'))
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
  eventName = 'TECHATHON 1.0',
  eventDate = '01 May 2026',
  qrCodeUrl,
  logoSrc,
  swamiSrc,
  principalSignSrc,
}) {
  const [logoData, swamiData, principalSignData] = await Promise.all([
    logoSrc ? loadImage(logoSrc) : Promise.resolve(null),
    swamiSrc ? loadImage(swamiSrc) : Promise.resolve(null),
    principalSignSrc ? loadImage(principalSignSrc) : Promise.resolve(null),
  ])

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })

  // ─── COLORS ───
  const INDIGO = [67, 56, 202]     // #4338CA
  const GOLD = [212, 175, 55]    // #D4AF37
  const NAVY = [30, 58, 138]     // #1E3A8A
  const IVORY = [250, 249, 246]   // #FAF9F6
  const BLACK = [0, 0, 0]
  const GREY = [51, 51, 51]      // #333
  const LGREY = [102, 102, 102]   // #666
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
    const wmH = 100
    const wmW = 68 // Matches 0.68 ratio roughly (100 * 0.68 = 68)
    pdf.addImage(logoData, 'PNG', centerX - wmW / 2, PAGE_H / 2 - wmH / 2, wmW, wmH)
    pdf.restoreGraphicsState()
  }

  // ═══ 4b. GEOMETRIC CORNER ACCENTS ═══
  const cornerLen = 18  // Length of each L-arm
  const cornerInset = 4 // Inset from white area edge
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.8)

  // Top-left corner
  const cTLx = whiteX + cornerInset
  const cTLy = whiteY + cornerInset
  pdf.line(cTLx, cTLy, cTLx + cornerLen, cTLy)
  pdf.line(cTLx, cTLy, cTLx, cTLy + cornerLen)

  // Top-right corner
  const cTRx = whiteX + whiteW - cornerInset
  const cTRy = whiteY + cornerInset
  pdf.line(cTRx, cTRy, cTRx - cornerLen, cTRy)
  pdf.line(cTRx, cTRy, cTRx, cTRy + cornerLen)

  // Bottom-left corner
  const cBLx = whiteX + cornerInset
  const cBLy = whiteY + whiteH - cornerInset
  pdf.line(cBLx, cBLy, cBLx + cornerLen, cBLy)
  pdf.line(cBLx, cBLy, cBLx, cBLy - cornerLen)

  // Bottom-right corner
  const cBRx = whiteX + whiteW - cornerInset
  const cBRy = whiteY + whiteH - cornerInset
  pdf.line(cBRx, cBRy, cBRx - cornerLen, cBRy)
  pdf.line(cBRx, cBRy, cBRx, cBRy - cornerLen)

  // Small diamond ornaments at each corner
  const dSize = 1.5
  pdf.setFillColor(...GOLD)
    ;[[cTLx, cTLy], [cTRx, cTRy], [cBLx, cBLy], [cBRx, cBRy]].forEach(([cx, cy]) => {
      pdf.triangle(cx, cy - dSize, cx + dSize, cy, cx, cy + dSize, 'F')
      pdf.triangle(cx, cy - dSize, cx - dSize, cy, cx, cy + dSize, 'F')
    })

  // ═══ 5. HEADER: Logos + College Name ═══
  const logoH = 22   // Same height for both logos
  const leftLogoW = logoH * (214 / 278) // logo.png aspect ratio (214x278)
  const rightLogoW = logoH * (195 / 226) // swami.png aspect ratio (195x226)
  const logoY = whiteY + contentPadV

  // Left logo (BVV) - aligned to left content edge
  if (logoData) {
    pdf.addImage(logoData, 'PNG', contentL, logoY, leftLogoW, logoH)
  }
  // Right logo (Swami) - aligned to right content edge
  if (swamiData) {
    pdf.addImage(swamiData, 'PNG', contentR - rightLogoW, logoY, rightLogoW, logoH)
  }

  // "B.V.V SANGHA'S" - Embossed effect (light shadow offset + main text)
  pdf.setFont('times', 'bold')
  pdf.setFontSize(13)
  const bvvY = logoY + 6
  const embossOff = 0.4 // Shadow offset in mm

  // Shadow layer (lighter color, offset down-right)
  pdf.setTextColor(180, 190, 220)
  pdf.text("B.V.V SANGHA'S", centerX + embossOff, bvvY + embossOff, { align: 'center' })
  // Main text layer
  pdf.setTextColor(...NAVY)
  pdf.text("B.V.V SANGHA'S", centerX, bvvY, { align: 'center' })

  // College name - Embossed effect on both lines
  pdf.setFontSize(16)
  const collegeY1 = bvvY + 6.5
  // Shadow
  pdf.setTextColor(180, 190, 220)
  pdf.text('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF', centerX + embossOff, collegeY1 + embossOff, { align: 'center' })
  // Main
  pdf.setTextColor(...NAVY)
  pdf.text('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF', centerX, collegeY1, { align: 'center' })

  const collegeY2 = collegeY1 + 6.5
  // Shadow
  pdf.setTextColor(180, 190, 220)
  pdf.text('TECHNOLOGY, MUDHOL', centerX + embossOff, collegeY2 + embossOff, { align: 'center' })
  // Main
  pdf.setTextColor(...NAVY)
  pdf.text('TECHNOLOGY, MUDHOL', centerX, collegeY2, { align: 'center' })

  // ═══ 6. GOLD DIVIDER WITH DOTS ═══
  const divY = collegeY2 + 5
  const collegeMaxW = pdf.getTextWidth('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF')
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

  // ═══ 7. CERTIFICATE TITLE (with blue ribbon/banner) ═══
  const titleY = divY + 14
  pdf.setFont('times', 'bold')
  pdf.setFontSize(18)

  // Measure the title text width for the banner
  const titleText = 'C E R T I F I C A T E   O F   P A R T I C I P A T I O N'
  const titleTextW = pdf.getTextWidth(titleText)
  const bannerPadH = 16 // Horizontal padding on each side
  const bannerH = 11    // Banner height
  const bannerW = titleTextW + bannerPadH * 2
  const bannerX = centerX - bannerW / 2
  const bannerY = titleY - bannerH + 2.5 // Vertically center text inside banner

  // Draw the blue ribbon/banner
  pdf.setFillColor(...NAVY)
  pdf.rect(bannerX, bannerY, bannerW, bannerH, 'F')

  // Small decorative ribbon tails (angled ends)
  const tailW = 5
  const tailH = bannerH
  // Left tail
  pdf.triangle(
    bannerX, bannerY,
    bannerX - tailW, bannerY + tailH / 2,
    bannerX, bannerY + tailH,
    'F'
  )
  // Right tail
  pdf.triangle(
    bannerX + bannerW, bannerY,
    bannerX + bannerW + tailW, bannerY + tailH / 2,
    bannerX + bannerW, bannerY + tailH,
    'F'
  )

  // Draw white text centered inside the banner
  pdf.setTextColor(255, 255, 255)
  pdf.text(titleText, centerX, titleY, { align: 'center' })

  // ═══ 8. CENTRAL CONTENT AREA ═══
  const certifyY = titleY + 16
  pdf.setFont('times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...GREY)
  pdf.text('THIS IS TO CERTIFY THAT', centerX, certifyY, { align: 'center' })

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

  // ═══ 10. BODY TEXT (Dynamic content) ═══
  pdf.setTextColor(...GREY)
  const bodyY1 = underlineY + 12
  const lineHeight = 7.5

  pdf.setFontSize(13)
  pdf.setFont('times', 'normal')

  const isTechathon1 = eventName?.toLowerCase().includes('techathon')

  // Line 1: Normal + Bold + Normal
  const p1 = 'has actively participated in the '
  const w1 = pdf.getTextWidth(p1)

  const p2 = isTechathon1 ? '24-Hour Hackathon TECHATHON 1.0' : (eventName || 'TECHATHON 1.0')
  pdf.setFont('times', 'bold')
  const w2 = pdf.getTextWidth(p2)

  pdf.setFont('times', 'normal')
  const p3 = isTechathon1 
    ? ', conducted from April 30th to May 1st, 2026. The' 
    : `, on ${eventDate && eventDate !== 'N/A' ? eventDate : 'Date'}. The`
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

  // ═══ 11. PRINCIPAL SIGNATURE (centered) ═══
  const sigBottomMargin = 35 // Room from bottom for QR + cert ID below
  const sigY = whiteY + whiteH - sigBottomMargin
  const sigLineW = 55 // Signature line width

  // Principal signature image (above the line)
  if (principalSignData) {
    const signImgH = 22  // Height of signature image in mm
    const signImgW = 22  // Square image (1024x1024)
    const signImgX = centerX - signImgW / 2
    const signImgY = sigY - signImgH - 1 // Place above the signature line
    pdf.addImage(principalSignData, 'PNG', signImgX, signImgY, signImgW, signImgH)
  }

  // Signature line
  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.4)
  pdf.line(centerX - sigLineW / 2, sigY, centerX + sigLineW / 2, sigY)

  // Principal name
  pdf.setFont('times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...NAVY)
  pdf.text('Dr. Shravankumar B. Kerur', centerX, sigY + 5, { align: 'center' })

  // Designation
  pdf.setFont('times', 'italic')
  pdf.setFontSize(8)
  pdf.setTextColor(...SIG_GREY)
  pdf.text('Principal, BGMIT', centerX, sigY + 9.5, { align: 'center' })

  // ═══ 12. DATE & PLACE ═══
  const datePlaceY = bodyY3 + (sigY - bodyY3) / 2 // Centered between body content and signature lines

  pdf.setFont('times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...GREY)
  pdf.text('Date:', contentL, datePlaceY)
  pdf.setFont('times', 'normal')
  pdf.text(' 01 May 2026', contentL + pdf.getTextWidth('Date:') + 1, datePlaceY)

  pdf.setFont('times', 'bold')
  pdf.text('Place:', contentR - pdf.getTextWidth('Place:') - pdf.getTextWidth(' Mudhol') - 1, datePlaceY)
  pdf.setFont('times', 'normal')
  const placeTextX = contentR - pdf.getTextWidth(' Mudhol')
  pdf.text(' Mudhol', placeTextX, datePlaceY)

  // ═══ 13. QR CODE (bottom-left, below signatures) ═══
  if (qrCodeUrl) {
    const qrSize = 14
    const qrX = contentL
    const qrY = sigY + 14 // Below signature role text
    pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize)

    pdf.setDrawColor(204, 204, 204)
    pdf.setLineWidth(0.3)
    pdf.rect(qrX, qrY, qrSize, qrSize, 'S')
  }

  // ═══ 14. CERTIFICATE ID (bottom-right, below signatures) ═══
  const certIdX = contentR
  const certIdY = sigY + 22 // Aligned with bottom of QR code area

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
