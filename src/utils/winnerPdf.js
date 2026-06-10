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

      const MAX_DIM = 800
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) { h = (MAX_DIM / w) * h; w = MAX_DIM }
        else { w = (MAX_DIM / h) * w; h = MAX_DIM }
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

/** Prize tier config */
const PRIZE_CONFIG = {
  1: {
    label: 'FIRST PRIZE',
    ordinal: '1st',
    amount: 'Rs. 15,000/-',
    badge: [212, 175, 55],     // Gold #D4AF37
    badgeDark: [170, 140, 44], // Darker gold
    badgeLight: [240, 220, 130], // Lighter gold
    ribbonColor: [180, 30, 30],
    positionTitle: 'First Place',
  },
  2: {
    label: 'SECOND PRIZE',
    ordinal: '2nd',
    amount: 'Rs. 10,000/-',
    badge: [192, 192, 192],     // Silver
    badgeDark: [140, 140, 140],
    badgeLight: [230, 230, 235],
    ribbonColor: [180, 30, 30],
    positionTitle: 'Second Place',
  },
  3: {
    label: 'THIRD PRIZE',
    ordinal: '3rd',
    amount: 'Rs. 5,000/-',
    badge: [205, 127, 50],     // Bronze #CD7F32
    badgeDark: [160, 100, 40],
    badgeLight: [230, 180, 100],
    ribbonColor: [180, 30, 30],
    positionTitle: 'Third Place',
  },
}

/**
 * Draw a medal badge at the given center position.
 */
function drawMedal(pdf, cx, cy, prizeNum) {
  const cfg = PRIZE_CONFIG[prizeNum] || PRIZE_CONFIG[1]
  const radius = 12

  // Ribbon tie (red) behind the medal
  const tieW = 16
  const tieH = 30
  pdf.setFillColor(...cfg.ribbonColor) // Red tie
  // Draw the tie as a single polygon path to avoid rendering artifacts (thin lines)
  pdf.lines([
    [tieW, 0],
    [0, tieH],
    [-tieW / 2, -8],
    [-tieW / 2, 8]
  ], cx - tieW / 2, cy, [1, 1], 'F', true)

  // Outer ring (darker)
  pdf.setFillColor(...cfg.badgeDark)
  pdf.circle(cx, cy, radius + 1.5, 'F')

  // Main medal disc
  pdf.setFillColor(...cfg.badge)
  pdf.circle(cx, cy, radius, 'F')

  // Inner highlight ring
  pdf.setDrawColor(...cfg.badgeLight)
  pdf.setLineWidth(0.6)
  pdf.circle(cx, cy, radius - 2.5, 'S')

  // Star in center
  pdf.setFillColor(...cfg.badgeLight)
  const starR = 4
  const starPts = 5
  const innerR = starR * 0.4
  const points = []
  for (let i = 0; i < starPts * 2; i++) {
    const angle = (Math.PI / starPts) * i - Math.PI / 2
    const r = i % 2 === 0 ? starR : innerR
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  // Draw star as filled polygon using triangles from center
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length]
    pdf.triangle(cx, cy, points[i][0], points[i][1], next[0], next[1], 'F')
  }

  // Ordinal text inside or below the badge tie
  pdf.setFont('times', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255) // White text on the red tie
  pdf.text(cfg.ordinal, cx, cy + radius + 7, { align: 'center' })
}

/**
 * Build a winner certificate PDF.
 */
export async function buildWinnerPdf({
  participantName = 'Winner Name',
  teamName = '',
  certificateId = 'BGMIT-XXXX-XXXX',
  eventName = 'TECHATHON 1.0',
  eventDate = '01 May 2026',
  prizePosition = 1,
  qrCodeUrl,
  logoSrc,
  swamiSrc,
  principalSignSrc,
}) {
  const prizeNum = Math.max(1, Math.min(3, Number(prizePosition) || 1))
  const prize = PRIZE_CONFIG[prizeNum]

  const [logoData, swamiData, principalSignData] = await Promise.all([
    logoSrc ? loadImage(logoSrc) : Promise.resolve(null),
    swamiSrc ? loadImage(swamiSrc) : Promise.resolve(null),
    principalSignSrc ? loadImage(principalSignSrc) : Promise.resolve(null),
  ])

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })

  // ─── COLORS ───
  const INDIGO = [67, 56, 202]
  const GOLD = [212, 175, 55]
  const NAVY = [30, 58, 138]
  const IVORY = [250, 249, 246]
  const BLACK = [0, 0, 0]
  const GREY = [51, 51, 51]
  const LGREY = [102, 102, 102]
  const SIG_GREY = [85, 85, 85]

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

  // ═══ 2. GOLD BORDER ═══
  const goldBorderCenter = outerPad + goldBorderW / 2
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(goldBorderW)
  pdf.rect(goldBorderCenter, goldBorderCenter, PAGE_W - 2 * goldBorderCenter, PAGE_H - 2 * goldBorderCenter, 'S')

  // ═══ 3. IVORY CONTENT AREA ═══
  pdf.setFillColor(...IVORY)
  pdf.rect(whiteX, whiteY, whiteW, whiteH, 'F')

  // ═══ 4. WATERMARK ═══
  if (logoData) {
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: 0.05 }))
    const wmH = 100, wmW = 68
    pdf.addImage(logoData, 'PNG', centerX - wmW / 2, PAGE_H / 2 - wmH / 2, wmW, wmH)
    pdf.restoreGraphicsState()
  }

  // ═══ 4b. CORNER ACCENTS ═══
  const cornerLen = 18
  const cornerInset = 4
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.8)

  const cTLx = whiteX + cornerInset, cTLy = whiteY + cornerInset
  pdf.line(cTLx, cTLy, cTLx + cornerLen, cTLy); pdf.line(cTLx, cTLy, cTLx, cTLy + cornerLen)
  const cTRx = whiteX + whiteW - cornerInset, cTRy = whiteY + cornerInset
  pdf.line(cTRx, cTRy, cTRx - cornerLen, cTRy); pdf.line(cTRx, cTRy, cTRx, cTRy + cornerLen)
  const cBLx = whiteX + cornerInset, cBLy = whiteY + whiteH - cornerInset
  pdf.line(cBLx, cBLy, cBLx + cornerLen, cBLy); pdf.line(cBLx, cBLy, cBLx, cBLy - cornerLen)
  const cBRx = whiteX + whiteW - cornerInset, cBRy = whiteY + whiteH - cornerInset
  pdf.line(cBRx, cBRy, cBRx - cornerLen, cBRy); pdf.line(cBRx, cBRy, cBRx, cBRy - cornerLen)

  // Diamond ornaments
  const dSize = 1.5
  pdf.setFillColor(...GOLD)
    ;[[cTLx, cTLy], [cTRx, cTRy], [cBLx, cBLy], [cBRx, cBRy]].forEach(([cx, cy]) => {
      pdf.triangle(cx, cy - dSize, cx + dSize, cy, cx, cy + dSize, 'F')
      pdf.triangle(cx, cy - dSize, cx - dSize, cy, cx, cy + dSize, 'F')
    })

  // ═══ 5. HEADER: Logos + College Name ═══
  const logoH = 22
  const leftLogoW = logoH * (214 / 278)
  const rightLogoW = logoH * (195 / 226)
  const logoY = whiteY + contentPadV

  if (logoData) pdf.addImage(logoData, 'PNG', contentL, logoY, leftLogoW, logoH)
  if (swamiData) pdf.addImage(swamiData, 'PNG', contentR - rightLogoW, logoY, rightLogoW, logoH)

  // Embossed college text
  pdf.setFont('times', 'bold')
  pdf.setFontSize(13)
  const bvvY = logoY + 6
  const embossOff = 0.4

  pdf.setTextColor(180, 190, 220)
  pdf.text("B.V.V SANGHA'S", centerX + embossOff, bvvY + embossOff, { align: 'center' })
  pdf.setTextColor(...NAVY)
  pdf.text("B.V.V SANGHA'S", centerX, bvvY, { align: 'center' })

  pdf.setFontSize(16)
  const collegeY1 = bvvY + 6.5
  pdf.setTextColor(180, 190, 220)
  pdf.text('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF', centerX + embossOff, collegeY1 + embossOff, { align: 'center' })
  pdf.setTextColor(...NAVY)
  pdf.text('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF', centerX, collegeY1, { align: 'center' })

  const collegeY2 = collegeY1 + 6.5
  pdf.setTextColor(180, 190, 220)
  pdf.text('TECHNOLOGY, MUDHOL', centerX + embossOff, collegeY2 + embossOff, { align: 'center' })
  pdf.setTextColor(...NAVY)
  pdf.text('TECHNOLOGY, MUDHOL', centerX, collegeY2, { align: 'center' })

  // ═══ 6. GOLD DIVIDER ═══
  const divY = collegeY2 + 5
  const collegeMaxW = pdf.getTextWidth('BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF')
  const divW = collegeMaxW * 0.95
  const divL = centerX - divW / 2
  const divR = centerX + divW / 2
  const dotR = 0.9

  pdf.setFillColor(...GOLD)
  pdf.circle(divL, divY, dotR, 'F'); pdf.circle(divR, divY, dotR, 'F')
  pdf.setDrawColor(...GOLD)
  pdf.setLineWidth(0.5)
  pdf.line(divL + dotR + 1, divY, divR - dotR - 1, divY)

  // ═══ 7. CERTIFICATE TITLE (ACHIEVEMENT banner) ═══
  const titleY = divY + 14
  pdf.setFont('times', 'bold')
  pdf.setFontSize(18)

  const titleText = 'C E R T I F I C A T E   O F   A C H I E V E M E N T'
  const titleTextW = pdf.getTextWidth(titleText)
  const bannerPadH = 16
  const bannerH = 11
  const bannerW = titleTextW + bannerPadH * 2
  const bannerX = centerX - bannerW / 2
  const bannerY = titleY - bannerH + 2.5

  pdf.setFillColor(...NAVY)
  pdf.rect(bannerX, bannerY, bannerW, bannerH, 'F')

  // Ribbon tails
  const tailW = 5
  pdf.triangle(bannerX, bannerY, bannerX - tailW, bannerY + bannerH / 2, bannerX, bannerY + bannerH, 'F')
  pdf.triangle(bannerX + bannerW, bannerY, bannerX + bannerW + tailW, bannerY + bannerH / 2, bannerX + bannerW, bannerY + bannerH, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.text(titleText, centerX, titleY, { align: 'center' })

  // ═══ 8. "THIS IS TO CERTIFY THAT" ═══
  const certifyY = titleY + 14
  pdf.setFont('times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...GREY)
  pdf.text('THIS IS TO CERTIFY THAT', centerX, certifyY, { align: 'center' })

  // ═══ 9. PARTICIPANT / TEAM NAME ═══
  const displayName = teamName ? `${participantName} (Team: ${teamName})` : participantName
  const nameLen = displayName.length
  let nameFontPt = 28
  if (nameLen > 40) nameFontPt = 18
  const nameY = certifyY + 13
  pdf.setFont('times', 'bold')
  pdf.setFontSize(28)
  pdf.setTextColor(...NAVY)
  pdf.text(participantName, centerX, nameY, { align: 'center' })

  // ═══ 9. TEAM NAME (Optional) ═══
  const teamY = nameY + 6
  if (teamName) {
    pdf.setFontSize(16)
    pdf.text(`(Team: ${teamName})`, centerX, teamY, { align: 'center' })
  }

  // ═══ 9.5 MEDAL BADGE (Left side, below logo & beside title) ═══
  const medalCx = contentL + 10
  const medalCy = 65 // Moved up to avoid collision with names
  drawMedal(pdf, medalCx, medalCy, prizeNum)

  const underlineY = (teamName ? teamY : nameY) + 3
  const underlineW = Math.max(pdf.getTextWidth(participantName), teamName ? pdf.getTextWidth(`(Team: ${teamName})`) : 0) + 20
  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.5)
  pdf.line(centerX - underlineW / 2, underlineY, centerX + underlineW / 2, underlineY)

  // ═══ 10. BODY TEXT (Centered, inverted pyramid) ═══
  const bodyY1 = underlineY + 10
  const lineHeight = 5.5
  const isRoborace = eventName?.toLowerCase().includes('roborace')

  pdf.setFont('times', 'normal')
  pdf.setFontSize(12)

  let bodyY3 // tracks last body line for layout below

  if (isRoborace) {
    // ── ROBORACE: No cash prize, pyramid style (3 lines) ──
    // LINE 1 (longest)
    const l1p1 = 'has secured '
    const l1p1w = pdf.getTextWidth(l1p1)
    pdf.setFont('times', 'bold')
    const l1p2 = prize.label
    const l1p2w = pdf.getTextWidth(l1p2)
    pdf.setFont('times', 'normal')
    const l1p3 = ' in RoboRace, on 29th April 2026, for demonstrating outstanding innovation, technical excellence,'
    const l1p3w = pdf.getTextWidth(l1p3)

    const totalW1 = l1p1w + l1p2w + l1p3w
    let startX1 = centerX - totalW1 / 2

    pdf.setTextColor(...GREY)
    pdf.text(l1p1, startX1, bodyY1)
    pdf.setFont('times', 'bold')
    pdf.setTextColor(...prize.badgeDark)
    pdf.text(l1p2, startX1 + l1p1w, bodyY1)
    pdf.setFont('times', 'normal')
    pdf.setTextColor(...GREY)
    pdf.text(l1p3, startX1 + l1p1w + l1p2w, bodyY1)

    // LINE 2 (medium)
    const bodyY2 = bodyY1 + lineHeight
    const entityText = teamName ? `Team: ${teamName}` : 'The participant'
    pdf.text(`and problem-solving skills throughout the competition. ${entityText} is awarded`, centerX, bodyY2, { align: 'center' })

    // LINE 3 (shortest)
    bodyY3 = bodyY2 + lineHeight
    pdf.text(`the ${prize.positionTitle} badge in recognition of this achievement.`, centerX, bodyY3, { align: 'center' })

  } else {
    // ── TECHATHON: With cash prize ──
    // LINE 1 (longest)
    const l1p1 = 'has secured '
    const l1p1w = pdf.getTextWidth(l1p1)
    pdf.setFont('times', 'bold')
    const l1p2 = prize.label
    const l1p2w = pdf.getTextWidth(l1p2)
    pdf.setFont('times', 'normal')
    const l1p3 = ' in TECHATHON 1.0 for demonstrating outstanding innovation, technical excellence,'
    const l1p3w = pdf.getTextWidth(l1p3)

    const totalW1 = l1p1w + l1p2w + l1p3w
    let startX1 = centerX - totalW1 / 2

    pdf.setTextColor(...GREY)
    pdf.text(l1p1, startX1, bodyY1)
    pdf.setFont('times', 'bold')
    pdf.setTextColor(...prize.badgeDark)
    pdf.text(l1p2, startX1 + l1p1w, bodyY1)
    pdf.setFont('times', 'normal')
    pdf.setTextColor(...GREY)
    pdf.text(l1p3, startX1 + l1p1w + l1p2w, bodyY1)

    // LINE 2 (medium)
    const bodyY2 = bodyY1 + lineHeight
    pdf.text('and problem-solving skills throughout the competition. In recognition of this remarkable achievement,', centerX, bodyY2, { align: 'center' })

    // LINE 3 (shortest)
    bodyY3 = bodyY2 + lineHeight
    const entityText = teamName ? `Team: ${teamName}` : 'the participant'

    const l3p1 = `${entityText} has been awarded a Cash Prize of `
    const l3p1w = pdf.getTextWidth(l3p1)
    pdf.setFont('times', 'bold')
    const l3p2 = prize.amount + '.'
    const l3p2w = pdf.getTextWidth(l3p2)
    const totalW3 = l3p1w + l3p2w
    let startX3 = centerX - totalW3 / 2

    pdf.setFont('times', 'normal')
    pdf.setTextColor(...GREY)
    pdf.text(l3p1, startX3, bodyY3)
    pdf.setFont('times', 'bold')
    pdf.setTextColor(...NAVY)
    pdf.text(l3p2, startX3 + l3p1w, bodyY3)
  }

  // ═══ 11. DEDICATION (Italic) ═══
  pdf.setFont('times', 'italic')
  pdf.setFontSize(10)
  pdf.setTextColor(...LGREY)
  const dedicationY = bodyY3 + lineHeight + 4
  pdf.text(
    'Your dedication, creativity, and performance were truly exceptional and inspiring.',
    centerX, dedicationY, { align: 'center' }
  )

  // ═══ 11. PRINCIPAL SIGNATURE ═══
  const sigBottomMargin = 35
  const sigY = whiteY + whiteH - sigBottomMargin

  if (principalSignData) {
    const signImgH = 22, signImgW = 22
    const signImgX = centerX - signImgW / 2
    const signImgY = sigY - signImgH - 1
    pdf.addImage(principalSignData, 'PNG', signImgX, signImgY, signImgW, signImgH)
  }

  const sigLineW = 55
  pdf.setDrawColor(...GREY)
  pdf.setLineWidth(0.4)
  pdf.line(centerX - sigLineW / 2, sigY, centerX + sigLineW / 2, sigY)

  pdf.setFont('times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...NAVY)
  pdf.text('Dr. Shravankumar B. Kerur', centerX, sigY + 5, { align: 'center' })

  pdf.setFont('times', 'italic')
  pdf.setFontSize(8)
  pdf.setTextColor(...SIG_GREY)
  pdf.text('Principal, BGMIT', centerX, sigY + 9.5, { align: 'center' })

  // ═══ 12. DATE & PLACE ═══
  const datePlaceY = sigY + 5
  // Use actual event date if provided, otherwise fallback to defaults
  const displayDate = (eventDate && eventDate !== 'N/A' && eventDate !== '')
    ? eventDate
    : (isRoborace ? '29 April 2026' : '01 May 2026')

  pdf.setFont('times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...GREY)
  pdf.text('Date:', contentL, datePlaceY)
  pdf.setFont('times', 'normal')
  pdf.text(` ${displayDate}`, contentL + pdf.getTextWidth('Date:') + 1, datePlaceY)

  pdf.setFont('times', 'bold')
  pdf.text('Place:', contentR - pdf.getTextWidth('Place:') - pdf.getTextWidth(' Mudhol') - 1, datePlaceY)
  pdf.setFont('times', 'normal')
  pdf.text(' Mudhol', contentR - pdf.getTextWidth(' Mudhol'), datePlaceY)

  // (Badge was moved to section 9.5)

  // ═══ 14. QR CODE ═══
  if (qrCodeUrl) {
    const qrSize = 14
    const qrX = contentL
    const qrY = sigY + 14
    pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    pdf.setDrawColor(204, 204, 204)
    pdf.setLineWidth(0.3)
    pdf.rect(qrX, qrY, qrSize, qrSize, 'S')
  }

  // ═══ 15. CERTIFICATE ID ═══
  const certIdX = contentR
  const certIdY = sigY + 22

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
