import React, { useRef, useState, useEffect } from 'react';
import logoImage from '../../code/logo.png';
import swamiImage from '../../code/swami.png';
import principalSignImage from '../../code/principal_sign.png';

const Template2 = ({
  participantName,
  eventName,
  certificateDate,
  certificateId,
  qrCodeUrl,
  department,
  problemStatement,
  primaryColor: propPrimaryColor = '#5A0F2D',
  accentColor: propAccentColor = '#D9B65D'
}) => {
  const isPaperPres = (eventName || '').toLowerCase().includes('paper presentation');
  const primaryColor = isPaperPres ? '#4B2E83' : propPrimaryColor;
  const accentColor = isPaperPres ? '#C9A227' : propAccentColor;
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Base our scale on a theoretical 1000px wide container
        setScale(entries[0].contentRect.width / 1000);
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 1mm = 1000 / 297 base units
  const mm = (val) => `${val * (1000 / 297) * scale}px`;

  const nameLen = (participantName || 'Participant Name').length;
  let nameSizeMm = 11.28; // 32pt
  if (nameLen > 25) {
    nameSizeMm = 7.76; // 22pt
  } else if (nameLen > 18) {
    nameSizeMm = 9.17; // 26pt
  }

  const cleanTitle = (problemStatement || 'Project Title')
    .trim()
    .replace(/^["'“‘]+|["'”’]+$/g, '');
  const titleLen = cleanTitle.length;
  let titleSizeMm = 4.2; // default
  if (titleLen > 90) {
    titleSizeMm = 3.3; // scale down
  } else if (titleLen > 60) {
    titleSizeMm = 3.7;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: primaryColor,
        position: 'relative',
        fontFamily: "'Times New Roman', Times, serif",
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Gold Border */}
      <div style={{
        position: 'absolute',
        top: mm(9),
        left: mm(9),
        width: mm(297 - 18),
        height: mm(210 - 18),
        border: `${mm(3)} solid ${accentColor}`,
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Ivory White Area */}
      <div style={{
        position: 'absolute',
        top: mm(16),
        left: mm(16),
        width: mm(297 - 32),
        height: mm(210 - 32),
        background: '#FAF9F6',
        boxSizing: 'border-box',
        zIndex: 2,
      }}>

        {/* Geometric Corner Accents (4mm inset from Ivory box) */}
        {[
          { top: mm(4), left: mm(4), transform: 'rotate(0deg)' },
          { top: mm(4), right: mm(4), transform: 'rotate(90deg)' },
          { bottom: mm(4), right: mm(4), transform: 'rotate(180deg)' },
          { bottom: mm(4), left: mm(4), transform: 'rotate(270deg)' }
        ].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', ...pos }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: mm(18), height: mm(0.8), background: accentColor }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: mm(0.8), height: mm(18), background: accentColor }} />
            <div style={{ position: 'absolute', top: mm(-0.5), left: mm(-0.5), width: mm(2), height: mm(2), background: accentColor, transform: 'rotate(45deg)' }} />
          </div>
        ))}

        {/* Watermark logo */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: mm(68),
          height: mm(100),
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0,
        }}>
          <img src={logoImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* Header Logos */}
        <img src={logoImage} alt="" style={{ position: 'absolute', top: mm(8), left: mm(12), width: mm(16.9), height: mm(22), objectFit: 'contain', zIndex: 1 }} />
        <img src={swamiImage} alt="" style={{ position: 'absolute', top: mm(8), right: mm(12), width: mm(18.98), height: mm(22), objectFit: 'contain', zIndex: 1 }} />

        {/* College Header (Lines absolutely positioned to match vector baselines) */}
        <p style={{ position: 'absolute', top: mm(10), width: '100%', textAlign: 'center', margin: 0, fontSize: mm(4.58), fontWeight: 700, color: primaryColor, letterSpacing: '0.05em', textShadow: `${mm(0.4)} ${mm(0.4)} 0 #B4BEDC`, lineHeight: 1, zIndex: 1 }}>
          B.V.V SANGHA'S
        </p>
        <p style={{ position: 'absolute', top: mm(16.5), width: '100%', textAlign: 'center', margin: 0, fontSize: mm(5.64), fontWeight: 700, color: primaryColor, letterSpacing: '0.03em', textShadow: `${mm(0.4)} ${mm(0.4)} 0 #B4BEDC`, lineHeight: 1, zIndex: 1 }}>
          BILURU GURUBASAVA MAHASWAMIJI INSTITUTE OF
        </p>
        <p style={{ position: 'absolute', top: mm(23), width: '100%', textAlign: 'center', margin: 0, fontSize: mm(5.64), fontWeight: 700, color: primaryColor, letterSpacing: '0.03em', textShadow: `${mm(0.4)} ${mm(0.4)} 0 #B4BEDC`, lineHeight: 1, zIndex: 1 }}>
          TECHNOLOGY, MUDHOL
        </p>

        {/* Gold Divider with Dots */}
        <div style={{
          position: 'absolute',
          top: mm(32),
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: mm(160),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}>
          <div style={{ width: mm(1.8), height: mm(1.8), borderRadius: '50%', background: accentColor }} />
          <div style={{ flex: 1, height: mm(0.5), background: accentColor, margin: `0 ${mm(2)}` }} />
          <div style={{ width: mm(1.8), height: mm(1.8), borderRadius: '50%', background: accentColor }} />
        </div>

        {/* Certificate Title Banner */}
        <div style={{
          position: 'absolute',
          top: mm(37.5),
          left: '50%',
          transform: 'translateX(-50%)',
          width: mm(150),
          height: mm(11),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}>
          {/* SVG Background for Ribbon to avoid html2canvas CSS border bugs */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} preserveAspectRatio="none" viewBox="0 0 150 11">
            <polygon points="0,0 5,5.5 0,11 150,11 145,5.5 150,0" fill={primaryColor} />
          </svg>
          <p style={{
            margin: 0, color: '#FFFFFF', fontSize: mm(6.35), fontWeight: 700, letterSpacing: '0.1em'
          }}>
            CERTIFICATE OF PARTICIPATION
          </p>
        </div>

        {/* Central Content Area */}
        <div style={{ position: 'absolute', top: mm(58), width: '100%', textAlign: 'center', zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: mm(4.23), fontWeight: 700, color: '#333' }}>
            THIS IS TO CERTIFY THAT
          </p>
        </div>

        <div style={{ position: 'absolute', top: mm(68), width: '100%', textAlign: 'center', zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: mm(nameSizeMm), fontWeight: 700, color: primaryColor }}>
            {participantName || 'Participant Name'}
          </p>
          <div style={{ width: mm(120), height: mm(0.5), background: '#333', margin: `${mm(2)} auto 0` }} />
        </div>

        <div style={{ position: 'absolute', top: mm(82), width: '100%', textAlign: 'center', zIndex: 1 }}>
          {(eventName || '').toLowerCase().includes('paper presentation') ? (
            <>
              <p style={{ margin: '0 auto', fontSize: mm(3.8), color: '#333', lineHeight: 1.35, width: mm(220) }}>
                has successfully presented a paper titled
              </p>
              <p style={{ margin: '4px auto 0', fontSize: mm(titleSizeMm), color: '#000000', fontWeight: 700, lineHeight: 1.35, width: mm(260) }}>
                "{cleanTitle}"
              </p>
              <p style={{ margin: '4px auto 0', fontSize: mm(3.8), color: '#333', lineHeight: 1.35, width: mm(260) }}>
                during the <strong>VISTARA : Paper Presentation Competition</strong> organized by the Department of CSE, BGMIT Mudhol.
              </p>
              <p style={{ margin: '10px auto 0', fontSize: mm(3.5), color: '#555', fontStyle: 'italic', lineHeight: 1.35, width: mm(240) }}>
                This certificate is awarded in appreciation of their enthusiastic participation and academic contribution.
              </p>
            </>
          ) : (eventName || '').toLowerCase().includes('roborace') ? (
            <>
              <p style={{ margin: '0 auto', fontSize: mm(4.58), color: '#333', lineHeight: 1.6, width: mm(260) }}>
                has actively participated in the <strong>RoboRace</strong>, on 29th April 2026. The event was organized by BGMIT, Mudhol.
              </p>
              <p style={{ margin: '0 auto', fontSize: mm(4.58), color: '#333', lineHeight: 1.6, width: mm(220) }}>
                Throughout the competition, the participant demonstrated exceptional enthusiasm,
              </p>
              <p style={{ margin: '0 auto', fontSize: mm(4.58), color: '#333', lineHeight: 1.6, width: mm(170) }}>
                creativity, and a steadfast commitment to innovation.
              </p>
            </>
          ) : (
            <p style={{ margin: '0 auto', fontSize: mm(4.58), color: '#333', lineHeight: 1.6, width: mm(230) }}>
              has actively participated in the <strong>24-Hour Hackathon TECHATHON 1.0</strong>, conducted from April 30th to May 1st, 2026. The event was organized by BGMIT, Mudhol. Throughout the competition, the participant demonstrated exceptional enthusiasm, creativity, and a steadfast commitment to innovation.
            </p>
          )}
        </div>

        {/* Date and Place */}
        <div style={{ position: 'absolute', top: mm(135), left: mm(12), zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: mm(4.23), color: '#333' }}>
            <strong>Date:</strong> {certificateDate || ((eventName || '').toLowerCase().includes('paper presentation') ? '29th April 2026' : ((eventName || '').toLowerCase().includes('roborace') ? '29 April 2026' : '01 May 2026'))}
          </p>
        </div>
        <div style={{ position: 'absolute', top: mm(135), right: mm(12), zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: mm(4.23), color: '#333' }}>
            <strong>Place:</strong> Mudhol
          </p>
        </div>

        {/* Signature */}
        <div style={{ position: 'absolute', top: mm(145), left: '50%', transform: 'translateX(-50%)', width: mm(60), height: mm(40), zIndex: 1 }}>
          <img src={principalSignImage} alt="Signature" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', height: mm(22) }} />
          <div style={{ position: 'absolute', top: mm(23), left: '50%', transform: 'translateX(-50%)', width: mm(55), height: mm(0.4), background: '#333' }} />
          <p style={{ position: 'absolute', top: mm(28), width: '100%', textAlign: 'center', margin: 0, fontSize: mm(4.23), fontWeight: 700, color: primaryColor, lineHeight: 1 }}>Dr. Shravankumar B. Kerur</p>
          <p style={{ position: 'absolute', top: mm(32.5), width: '100%', textAlign: 'center', margin: 0, fontSize: mm(2.82), color: '#555', fontStyle: 'italic', lineHeight: 1 }}>Principal, BGMIT</p>
        </div>

        {/* QR Code */}
        <div style={{ position: 'absolute', top: mm(158), left: mm(12), zIndex: 2 }}>
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code" style={{ width: mm(14), height: mm(14), border: `${mm(0.3)} solid #ccc` }} />
          ) : (
            <div style={{ width: mm(14), height: mm(14), border: `${mm(0.3)} solid #ccc`, background: '#f9f9f9' }} />
          )}
        </div>

        {/* Certificate ID */}
        <div style={{ position: 'absolute', top: mm(164), right: mm(12), zIndex: 2, textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: mm(2.82), color: '#666', fontFamily: "'Courier New', monospace", lineHeight: 1 }}>Certificate ID:</p>
          <p style={{ margin: `${mm(0.7)} 0 0`, fontSize: mm(2.82), color: primaryColor, fontWeight: 700, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>
            {certificateId || 'BGMIT-XXXX-XXXX'}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Template2;
