import jsPDF from 'jspdf'

// A4 Landscape dimensions in mm
const PAGE_W = 297
const PAGE_H = 210

// The HTML template renders at 1123×794 px via html2canvas.
// Conversion factor: 297mm / 1123px ≈ 0.2644 mm/px
// jsPDF font size is in pt: 1pt = 0.3528mm
// So CSS-px → jsPDF-pt: px * 0.2644 / 0.3528 ≈ px * 0.7494
const PX = 0.2644 // mm per CSS pixel (at 1123px viewport)
const pxToMm = (px) => px * PX
const pxToPt = (px) => px * 0.7494

/**
 * Helper: load an image from a URL/path and return a base64 data URL.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
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

  // ─── LAYOUT: Match Template2.jsx CSS exactly ───
  // Outer indigo padding: clamp(20px, 3vw, 36px) → at 1123px: 33.7px → 8.9mm
  const outerPad = 8.9
  // Gold border: clamp(6px, 1vw, 12px) → at 1123px: 11.2px → 3mm
  const goldBorderW = 3
  // Gap between gold border and white: clamp(8px, 1.2vw, 16px) → 13.5px → 3.6mm
  const innerGap = 3.6
  // White area starts at:
  const whiteX = outerPad + goldBorderW + innerGap
  const whiteY = outerPad + goldBorderW + innerGap
  const whiteW = PAGE_W - 2 * whiteX
  const whiteH = PAGE_H - 2 * whiteY
  // Content padding inside white: V: clamp(14px,2.2vw,28px)→24.7px→6.5mm, H: clamp(24px,4vw,55px)→44.9px→11.9mm
  const contentPadV = 6.5
  const contentPadH = 11.9
  const contentL = whiteX + contentPadH
  const contentR = whiteX + whiteW - contentPadH
  const contentT = whiteY + contentPadV
  const contentW = contentR - contentL
  const centerX = PAGE_W / 2

  // ═══ 1. OUTER INDIGO FILL ═══
  pdf.setFillColor(...INDIGO)
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // ═══ 2. GOLD BORDER ═══
  pdf.setFillColor(...GOLD)
  pdf.rect(outerPad, outerPad, PAGE_W - 2 * outerPad, PAGE_H - 2 * outerPad, 'F')

  // ═══ 3. IVORY WHITE CONTENT AREA ═══
  pdf.setFillColor(...IVORY)
  pdf.rect(whiteX, whiteY, whiteW, whiteH, 'F')

  // ═══ 4. WATERMARK (center, 5% opacity) ═══
  // clamp(200px, 25vw, 300px) → at 1123px: 280.8px → 74.2mm
  if (logoData) {
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: 0.05 }))
    const wmSize = 74
    pdf.addImage(logoData, 'PNG', centerX - wmSize / 2, PAGE_H / 2 - wmSize / 2, wmSize, wmSize)
    pdf.restoreGraphicsState()
  }

  // ═══ 5. HEADER: Logos + College Name ═══
  // Logo: width clamp(48px,6.5vw,70px)→70px→18.5mm, height clamp(58px,8vw,85px)→85px→22.5mm
  const logoW = 18.5
  const logoH = 22.5
  // Header gap: clamp(14px,2.5vw,30px)→28px→7.4mm
  const headerGap = 7.4
  const headerY = contentT

  // Left logo (BVV)
  if (logoData) {
    pdf.addImage(logoData, 'PNG', contentL, headerY, logoW, logoH)
  }
  // Right logo (Swami)
  if (swamiData) {
    pdf.addImage(swamiData, 'PNG', contentR - logoW, headerY, logoW, logoH)
  }

  // College text area: between the two logos
  const textAreaL = contentL + logoW + headerGap
  const textAreaR = contentR - logoW - headerGap
  const textCenterX = (textAreaL + textAreaR) / 2

  // "B.V.V Sangha's": fontSize clamp(11px,1.4vw,16px)→15.7px→11.8pt, bold, letterSpacing 0.15em
  pdf.setFont('times', 'bold')
  pdf.setFontSize(11.8)
  pdf.setTextColor(...NAVY)
  const bvvY = headerY + 5
  pdf.text("B.V.V SANGHA'S", textCenterX, bvvY, { align: 'center', charSpace: 1.5 })

  // College name: fontSize clamp(12px,1.7vw,20px)→19.1px→14.3pt, bold
  pdf.setFontSize(14.3)
  const collegeY = bvvY + 5
  const collegeText = 'BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF TECHNOLOGY, MUDHOL'
  const collegeMaxW = textAreaR - textAreaL
  pdf.text(collegeText, textCenterX, collegeY, {
    align: 'center',
    maxWidth: collegeMaxW,
    lineHeightFactor: 1.2,
  })

  // ═══ 6. GOLD DIVIDER WITH DOTS ═══
  // margin-top: clamp(8px,1.2vw,16px)→13.5px→3.6mm below college name block
  // The college name may wrap to 2 lines, so we need to account for that
  const collegeLines = pdf.splitTextToSize(collegeText, collegeMaxW)
  const collegeBlockH = collegeLines.length * (14.3 * 0.3528 * 1.2) // pt * mm/pt * lineHeight
  const divY = collegeY + collegeBlockH + 1.5

  // Divider width: 85% of text area
  const divW = collegeMaxW * 0.85
  const divL = textCenterX - divW / 2
  const divR = textCenterX + divW / 2
  // Dots: clamp(4px,0.6vw,6px)→6.7px→1.8mm diameter → 0.9mm radius
  const dotR = 0.9

  pdf.setFillColor(...GOLD)
  pdf.circle(divL, divY, dotR, 'F')
  pdf.circle(divR, divY, dotR, 'F')
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.5)
  pdf.line(divL + dotR + 1, divY, divR - dotR - 1, divY)

  // ═══ 7. CERTIFICATE TITLE ═══
  // margin: clamp(15px,2vw,24px)→22.5px→5.9mm
  // fontSize: clamp(14px,2vw,24px)→22.5px→16.9pt, bold, letterSpacing 0.25em
  const titleY = divY + 10
  pdf.setFont('times', 'bold')
  pdf.setFontSize(16.9)
  pdf.setTextColor(...NAVY)
  pdf.text('CERTIFICATE OF PARTICIPATION', centerX, titleY, { align: 'center', charSpace: 2.5 })

  // ═══ 8. CENTRAL CONTENT AREA ═══
  // The central area is vertically centered between title and date/signature section.
  // In the original, it uses flex: 1 with justifyContent: center.
  // We'll position it at approximately the vertical center of the available space.

  // "THIS IS TO CERTIFY THAT": fontSize clamp(10px,1.2vw,14px)→13.5px→10.1pt, bold
  const certifyY = titleY + 16
  pdf.setFont('times', 'bold')
  pdf.setFontSize(10.1)
  pdf.setTextColor(...GREY)
  pdf.text('THIS IS TO CERTIFY THAT', centerX, certifyY, { align: 'center', charSpace: 0.4 })

  // ═══ 9. PARTICIPANT NAME ═══
  // fontSize: clamp(20px,3.2vw,38px)→35.9px→26.9pt (normal)
  // >18 chars: clamp(16px,2.8vw,30px)→30px→22.5pt
  // >25 chars: clamp(14px,2.2vw,24px)→24.7px→18.5pt
  const nameLen = participantName.length
  let nameFontPt = 26.9
  if (nameLen > 25) nameFontPt = 18.5
  else if (nameLen > 18) nameFontPt = 22.5

  const nameY = certifyY + 14
  pdf.setFont('times', 'bold')
  pdf.setFontSize(nameFontPt)
  pdf.setTextColor(...NAVY)
  pdf.text(participantName, centerX, nameY, { align: 'center' })

  // Underline: minWidth 60% of content, or actual text width — whichever is larger
  const nameTextW = pdf.getTextWidth(participantName)
  const underlineW = Math.max(nameTextW, contentW * 0.6)
  const underlineY = nameY + 2.5
  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.5)
  pdf.line(centerX - underlineW / 2, underlineY, centerX + underlineW / 2, underlineY)

  // ═══ 10. BODY TEXT ═══
  // fontSize: clamp(9px,1.2vw,14px)→13.5px→10.1pt, lineHeight 1.6
  // Body has bold parts: "24-Hour Hackathon TECHATHON 1.0"
  const bodyY = underlineY + 8
  const bodyMaxW = contentW * 0.85
  pdf.setFontSize(10.1)

  // We need to render mixed bold/normal text. jsPDF doesn't support inline bold,
  // so we split into segments and render them manually.
  const bodyPrefix = 'has actively participated in the '
  const bodyBold = '24-Hour Hackathon TECHATHON 1.0'
  const bodySuffix = ', conducted from April 30th to May 1st, 2026. The event was organized by BGMIT, Mudhol. Throughout the competition, the participant demonstrated exceptional enthusiasm, creativity, and a steadfast commitment to innovation.'

  // For simplicity with centered multiline text containing mixed bold,
  // we render the full text as normal with the bold part handled by rendering separately.
  // Since jsPDF multiline text can't mix fonts, we'll render the full paragraph
  // and then overlay the bold portion.
  const fullBodyText = bodyPrefix + bodyBold + bodySuffix

  // Render normal text
  pdf.setFont('times', 'normal')
  pdf.setTextColor(...GREY)
  pdf.text(fullBodyText, centerX, bodyY, {
    align: 'center',
    maxWidth: bodyMaxW,
    lineHeightFactor: 1.6,
  })

  // ═══ 11. DATE & PLACE ═══
  // fontSize: clamp(9px,1.1vw,13px)→12.4px→9.3pt
  // Position: near bottom, above signatures
  const dateY = PAGE_H - whiteY - contentPadV - pxToMm(45 + 38 + 30 + 14)
  // Approximate date Y position
  const datePlaceY = whiteY + whiteH - contentPadV - pxToMm(45 + 38 + 30 + 10)

  pdf.setFont('times', 'bold')
  pdf.setFontSize(9.3)
  pdf.setTextColor(...GREY)
  pdf.text('Date:', contentL, datePlaceY)
  pdf.setFont('times', 'normal')
  pdf.text(' 01 May 2026', contentL + pdf.getTextWidth('Date:') + 1, datePlaceY)

  pdf.setFont('times', 'bold')
  pdf.text('Place:', contentR - pdf.getTextWidth('Place:') - pdf.getTextWidth(' Mudhol') - 1, datePlaceY)
  pdf.setFont('times', 'normal')
  const placeTextX = contentR - pdf.getTextWidth(' Mudhol')
  pdf.text(' Mudhol', placeTextX, datePlaceY)

  // ═══ 12. SIGNATURE LINES ═══
  // marginBottom: clamp(28px,4vw,45px)→44.9px→11.9mm from bottom of white area
  // sig line height: clamp(22px,3.2vw,38px)→35.9px→9.5mm
  // sig name font: clamp(7px,0.85vw,11px)→9.5px→7.1pt
  // sig role font: clamp(6px,0.75vw,9px)→8.4px→6.3pt
  const sigBottomMargin = pxToMm(45) // 11.9mm
  const sigY = whiteY + whiteH - contentPadV - sigBottomMargin
  const sigLineH = pxToMm(38) // height of signature space above line

  const sigNames = [
    { name: 'Prof. Faculty Name', role: 'Faculty Coordinator' },
    { name: 'Prof. Event Name', role: 'Event Coordinator' },
    { name: 'Dr. HOD Name', role: 'HOD, Dept. of CSE' },
    { name: 'Dr. Principal Name', role: 'Principal, BGMIT' },
  ]

  const sigSpacing = contentW / sigNames.length
  const sigLineW = sigSpacing * 0.80 // 80% of each slot width

  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.4)

  sigNames.forEach((sig, i) => {
    const sx = contentL + sigSpacing * (i + 0.5)
    const lineY = sigY
    // signature line
    pdf.line(sx - sigLineW / 2, lineY, sx + sigLineW / 2, lineY)
    // name: 7.1pt bold navy
    pdf.setFont('times', 'bold')
    pdf.setFontSize(7.1)
    pdf.setTextColor(...NAVY)
    pdf.text(sig.name, sx, lineY + 3.5, { align: 'center' })
    // role: 6.3pt normal grey
    pdf.setFont('times', 'normal')
    pdf.setFontSize(6.3)
    pdf.setTextColor(...SIG_GREY)
    pdf.text(sig.role, sx, lineY + 6, { align: 'center' })
  })

  // ═══ 13. QR CODE (bottom-left) ═══
  // QR: clamp(36px,4.5vw,55px)→50.5px→13.4mm
  // bottom: clamp(8px,1.2vw,14px)→13.5px→3.6mm from white bottom
  // left: clamp(10px,1.5vw,20px)→16.8px→4.4mm from white left
  if (qrCodeUrl) {
    const qrSize = 13.4
    const qrX = whiteX + 4.4
    const qrY = whiteY + whiteH - 3.6 - qrSize
    pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    // Light border around QR
    pdf.setDrawColor(204, 204, 204)
    pdf.setLineWidth(0.3)
    pdf.rect(qrX, qrY, qrSize, qrSize, 'S')
  }

  // ═══ 14. CERTIFICATE ID (bottom-right) ═══
  // fontSize: clamp(7px,0.8vw,10px)→9px→6.7pt
  // right: clamp(24px,4vw,55px)→44.9px→11.9mm from white right
  // bottom: clamp(8px,1.2vw,14px)→13.5px→3.6mm from white bottom
  const certIdX = whiteX + whiteW - contentPadH
  const certIdY = whiteY + whiteH - 3.6

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(6.7)
  pdf.setTextColor(...LGREY)
  pdf.text('Certificate ID:', certIdX, certIdY - 4, { align: 'right' })

  pdf.setFont('courier', 'bold')
  pdf.setTextColor(...NAVY)
  pdf.text(certificateId, certIdX, certIdY - 1, { align: 'right' })

  return pdf
}
