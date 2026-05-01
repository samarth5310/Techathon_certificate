import React from 'react';
import logoImage from '../../code/logo.png';
import swamiImage from '../../code/swami.png';
import techathonFontImage from '../../code/FONT.png';

const Template3 = ({ participantName, eventName, certificateDate, certificateId, qrCodeUrl }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f4e 50%, #0a0e27 100%)',
        padding: 'clamp(6px, 1vw, 12px)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Animated gradient glow corners */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        left: '-100px',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.35) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        right: '-100px',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(255,0,170,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(138,43,226,0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Circuit board pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Main border with neon gradient */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          padding: '3px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #00d4ff 0%, #8a2be2 50%, #ff00aa 100%)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            boxSizing: 'border-box',
            padding: 'clamp(14px, 2.8vw, 38px) clamp(18px, 4vw, 60px)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(10,14,39,0.96) 0%, rgba(26,31,78,0.94) 100%)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Corner brackets - tech style */}
          {[
            { top: 10, left: 10, borderTop: '2px solid #00d4ff', borderLeft: '2px solid #00d4ff' },
            { top: 10, right: 10, borderTop: '2px solid #ff00aa', borderRight: '2px solid #ff00aa' },
            { bottom: 10, left: 10, borderBottom: '2px solid #ff00aa', borderLeft: '2px solid #ff00aa' },
            { bottom: 10, right: 10, borderBottom: '2px solid #00d4ff', borderRight: '2px solid #00d4ff' },
          ].map((style, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              ...style,
            }} />
          ))}

          {/* Header with logos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 'clamp(8px, 1.5vw, 18px)', position: 'relative', zIndex: 2 }}>
            <div style={{
              padding: '4px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d4ff, #8a2be2)',
              flexShrink: 0,
            }}>
              <div style={{
                background: '#fff',
                borderRadius: '50%',
                padding: '4px',
              }}>
                <img src={logoImage} alt="BVV Sangha Logo" style={{ width: 'clamp(46px, 7vw, 78px)', height: 'clamp(46px, 7vw, 78px)', objectFit: 'contain', display: 'block' }} />
              </div>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{
                margin: 0,
                fontFamily: 'sans-serif',
                fontSize: 'clamp(10px, 1.3vw, 17px)',
                fontWeight: 800,
                letterSpacing: '0.2em',
                background: 'linear-gradient(90deg, #00d4ff, #ff00aa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                B.V.V SANGHA'S
              </p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'sans-serif',
                fontSize: 'clamp(10px, 1.5vw, 19px)',
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1.2,
                color: '#ffffff',
                textShadow: '0 0 20px rgba(0,212,255,0.5)',
              }}>
                BILURU GURUBASAV MAHASWAMIJI INSTITUTE OF TECHNOLOGY, MUDHOL
              </p>
            </div>

            <div style={{
              padding: '4px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff00aa, #8a2be2)',
              flexShrink: 0,
            }}>
              <div style={{
                background: '#fff',
                borderRadius: '50%',
                padding: '4px',
              }}>
                <img src={swamiImage} alt="Swamiji" style={{ width: 'clamp(46px, 7vw, 78px)', height: 'clamp(46px, 7vw, 78px)', objectFit: 'contain', display: 'block' }} />
              </div>
            </div>
          </div>

          {/* Decorative neon divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'clamp(10px, 1.6vw, 18px) 0' }}>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #00d4ff)', flex: 1 }} />
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00d4ff',
              margin: '0 8px',
              boxShadow: '0 0 12px #00d4ff, 0 0 20px #00d4ff',
            }} />
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#8a2be2',
              margin: '0 8px',
              boxShadow: '0 0 14px #8a2be2, 0 0 24px #8a2be2',
            }} />
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ff00aa',
              margin: '0 8px',
              boxShadow: '0 0 12px #ff00aa, 0 0 20px #ff00aa',
            }} />
            <div style={{ height: '1px', background: 'linear-gradient(90deg, #ff00aa, transparent)', flex: 1 }} />
          </div>

          {/* Event title - Techathon Logo */}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            {eventName && eventName.toLowerCase() !== 'techathon 1.0' && eventName.toLowerCase() !== 'techathon1.0' ? (
              <h1 style={{
                margin: '0 auto',
                fontSize: 'clamp(32px, 5vw, 65px)',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00d4ff 0%, #8a2be2 50%, #ff00aa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.05em',
              }}>{eventName}</h1>
            ) : (
              <div style={{
                display: 'inline-block',
                position: 'relative',
                padding: '6px 14px',
                filter: 'drop-shadow(0 0 25px rgba(0,212,255,0.6)) drop-shadow(0 0 15px rgba(255,0,170,0.4))',
              }}>
                <img
                  src={techathonFontImage}
                  alt="Techathon 1.0"
                  style={{ height: 'clamp(54px, 8.5vw, 95px)', margin: '0 auto', objectFit: 'contain', display: 'block' }}
                />
              </div>
            )}
            <p style={{
              margin: '12px 0 0',
              fontFamily: 'serif',
              fontSize: 'clamp(14px, 2.2vw, 28px)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #00d4ff, #ff00aa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Certificate of Participation
            </p>
            <p style={{
              margin: '18px 0 0',
              fontStyle: 'italic',
              fontSize: 'clamp(10px, 1.4vw, 18px)',
              color: '#a0c4ff',
              letterSpacing: '0.05em',
            }}>
              This is to certify that
            </p>
          </div>

          {/* Participant name - NO underline, glowing text */}
          <div
            style={{
              width: '85%',
              margin: 'clamp(14px, 2.2vw, 22px) auto 0',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div
              style={{
                fontFamily: '"Great Vibes", "Allura", Georgia, serif',
                fontSize: 'clamp(26px, 4.5vw, 56px)',
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '0.02em',
                fontWeight: 700,
                textShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(255,0,170,0.5), 0 2px 4px rgba(0,0,0,0.5)',
                background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #ff00aa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                padding: '8px 0',
              }}
            >
              {participantName || ""}
            </div>
          </div>

          {/* Event description */}
          <div style={{
            marginTop: 'clamp(14px, 2.2vw, 22px)',
            textAlign: 'center',
            fontSize: 'clamp(10px, 1.5vw, 19px)',
            lineHeight: 1.6,
            color: '#d0d8f0',
            padding: '0 clamp(10px, 3vw, 40px)',
            position: 'relative',
            zIndex: 2,
          }}>
            <p style={{ margin: 0 }}>
              has participated in the{' '}
              <strong style={{
                background: 'linear-gradient(90deg, #00d4ff, #ff00aa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800,
              }}>
                {eventName || 'TECHATHON 1.0 - 24-Hour Hackathon'}
              </strong>
              , held {certificateDate ? `on ${certificateDate}` : 'during 30th April - 1st May 2026'}.
            </p>
            <p style={{ margin: '12px 0 0', fontWeight: 300, color: '#a0b0d0' }}>
              The participant demonstrated <span style={{ color: '#00d4ff' }}>enthusiasm</span>,{' '}
              <span style={{ color: '#8a2be2' }}>creativity</span>, and{' '}
              <span style={{ color: '#ff00aa' }}>commitment to innovation</span> throughout the event.
            </p>
          </div>

          {/* Signatories */}
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            textAlign: 'center',
            paddingBottom: 'clamp(20px, 3.5vw, 45px)',
            gap: '10px',
            position: 'relative',
            zIndex: 2,
          }}>
            {[
              { name: 'PROF. VARUN SARVADE', role: '(HOD, CSE, BGMIT)', color: '#00d4ff' },
              { name: 'PROF. TBA', role: '(EVENT COORDINATOR)', color: '#8a2be2' },
              { name: 'DR. SHRAVANKUMAR KERUR', role: '(PRINCIPAL, BGMIT)', color: '#ff00aa' },
            ].map((sig, i) => (
              <div key={i} style={{ width: '30%' }}>
                <div style={{
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${sig.color}, transparent)`,
                  marginBottom: '6px',
                  boxShadow: `0 0 8px ${sig.color}`,
                }} />
                <p style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 'clamp(7px, 1vw, 14px)',
                  lineHeight: 1.15,
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                }}>{sig.name}</p>
                <p style={{
                  margin: '3px 0 0',
                  fontSize: 'clamp(6px, 0.8vw, 11px)',
                  color: sig.color,
                  letterSpacing: '0.1em',
                }}>{sig.role}</p>
              </div>
            ))}
          </div>

          {/* QR Code and Certificate ID */}
          <div style={{
            position: 'absolute',
            bottom: 'clamp(10px, 1.8vw, 20px)',
            right: 'clamp(10px, 2vw, 25px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 'clamp(4px, 0.6vw, 8px)',
            zIndex: 3,
          }}>
            <div style={{
              padding: '3px',
              background: 'linear-gradient(135deg, #00d4ff, #ff00aa)',
              borderRadius: '4px',
              boxShadow: '0 0 15px rgba(0,212,255,0.5)',
            }}>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR" style={{
                  width: 'clamp(34px, 4.5vw, 55px)',
                  height: 'clamp(34px, 4.5vw, 55px)',
                  display: 'block',
                  background: '#fff',
                }} />
              ) : (
                <div style={{
                  width: 'clamp(34px, 4.5vw, 55px)',
                  height: 'clamp(34px, 4.5vw, 55px)',
                  background: '#f0f0f0',
                }} />
              )}
            </div>
            <p style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 'clamp(5px, 0.75vw, 9px)',
              textAlign: 'right',
              lineHeight: 1.3,
              letterSpacing: '0.1em',
              color: '#00d4ff',
              textShadow: '0 0 8px rgba(0,212,255,0.6)',
            }}>
              CERT ID:<br />
              <span style={{ color: '#ff00aa' }}>{certificateId || 'BGMIT-TECH-001'}</span>
            </p>
          </div>

          {/* Bottom neon bar */}
          <div style={{
            position: 'absolute',
            bottom: 'clamp(8px, 1.2vw, 14px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(140px, 25vw, 280px)',
            height: 'clamp(4px, 0.9vw, 8px)',
            background: 'linear-gradient(90deg, #00d4ff 0%, #8a2be2 50%, #ff00aa 100%)',
            borderRadius: '4px',
            boxShadow: '0 0 15px rgba(0,212,255,0.6), 0 0 25px rgba(255,0,170,0.4)',
          }} />
        </div>
      </div>
    </div>
  );
};

export default Template3;
