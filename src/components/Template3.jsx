import React from 'react';
import logoImage from '../../code/logo.svg';
import swamiImage from '../../code/swami.png';

const Template3 = ({ participantName, eventName, certificateDate, certificateId, qrCodeUrl }) => {
  const nameLen = (participantName || 'Participant Name').length;
  let nameFontSize = 'clamp(20px, 3.2vw, 38px)';
  if (nameLen > 25) {
    nameFontSize = 'clamp(14px, 2.2vw, 24px)';
  } else if (nameLen > 18) {
    nameFontSize = 'clamp(16px, 2.8vw, 30px)';
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#7F1D1D',
      padding: 'clamp(20px, 3vw, 36px)',
      boxSizing: 'border-box',
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      {/* Green accent border */}
      <div style={{
        width: '100%',
        height: '100%',
        border: 'clamp(6px, 1vw, 12px) solid #D4AF37',
        boxSizing: 'border-box',
        padding: 'clamp(8px, 1.2vw, 16px)',
      }}>
        {/* White content area */}
        <div style={{
          width: '100%',
          height: '100%',
          background: '#FFFDF7',
          boxSizing: 'border-box',
          padding: 'clamp(14px, 2.2vw, 28px) clamp(24px, 4vw, 55px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Watermark logo - slightly bigger */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.05,
            pointerEvents: 'none',
            zIndex: 0,
          }}>
            <img src={logoImage} alt="" style={{ width: 'clamp(200px, 25vw, 300px)', height: 'clamp(200px, 25vw, 300px)', objectFit: 'contain' }} />
          </div>

          {/* Header with logos and college name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(14px, 2.5vw, 30px)',
            position: 'relative',
            zIndex: 1,
          }}>
            <img src={logoImage} alt="BVV Sangha Logo" style={{
              width: 'clamp(48px, 6.5vw, 70px)',
              height: 'clamp(58px, 8vw, 85px)',
              objectFit: 'contain',
            }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{
                margin: 0,
                fontSize: 'clamp(11px, 1.4vw, 16px)',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#7F1D1D',
                textTransform: 'uppercase',
              }}>
                B.V.V Sangha's
              </p>
              <p style={{
                margin: '3px 0 0',
                fontSize: 'clamp(12px, 1.7vw, 20px)',
                fontWeight: 700,
                color: '#7F1D1D',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                lineHeight: 1.2,
              }}>
                Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol
              </p>
            </div>
            <img src={swamiImage} alt="Gurubasava Swamiji" style={{
              width: 'clamp(48px, 6.5vw, 70px)',
              height: 'clamp(58px, 8vw, 85px)',
              objectFit: 'contain',
            }} />
          </div>

          {/* Blue ribbon banner */}
          <div style={{
            margin: 'clamp(10px, 1.5vw, 18px) auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              background: '#991B1B',
              padding: 'clamp(7px, 1vw, 12px) clamp(30px, 5vw, 70px)',
              position: 'relative',
              display: 'inline-block',
            }}>
              <div style={{
                position: 'absolute',
                left: '-14px',
                top: '0',
                bottom: '0',
                width: '0',
                height: '0',
                borderTop: '19px solid #991B1B',
                borderBottom: '19px solid #991B1B',
                borderLeft: '14px solid transparent',
              }} />
              <div style={{
                position: 'absolute',
                right: '-14px',
                top: '0',
                bottom: '0',
                width: '0',
                height: '0',
                borderTop: '19px solid #991B1B',
                borderBottom: '19px solid #991B1B',
                borderRight: '14px solid transparent',
              }} />
              <p style={{
                margin: 0,
                color: '#ffffff',
                fontSize: 'clamp(11px, 1.5vw, 18px)',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
              }}>
                Certificate of Participation
              </p>
            </div>
          </div>

          {/* Central Centered Content Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            position: 'relative',
            zIndex: 1,
            marginBottom: 'clamp(20px, 4vw, 50px)', // Pushes text slightly upwards
          }}>
            {/* THIS IS TO CERTIFY THAT */}
          <p style={{
            textAlign: 'center',
            fontSize: 'clamp(10px, 1.2vw, 14px)',
            fontWeight: 700,
            color: '#333',
            letterSpacing: '0.08em',
            margin: '0 0 clamp(8px, 1.5vw, 16px) 0',
            position: 'relative',
            zIndex: 1,
          }}>
            THIS IS TO CERTIFY THAT
          </p>

          {/* Participant Name */}
          <div style={{
            textAlign: 'center',
            margin: '0 auto clamp(12px, 2vw, 24px)',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}>
            <p style={{
              margin: 0,
              fontSize: nameFontSize,
              fontWeight: 700,
              color: '#7F1D1D',
              borderBottom: '2px solid #333',
              paddingBottom: '3px',
              display: 'inline-block',
              minWidth: '60%',
            }}>
              {participantName || 'Participant Name'}
            </p>
          </div>

          {/* Certificate body text */}
          <div style={{
            textAlign: 'center',
            fontSize: 'clamp(9px, 1.2vw, 14px)',
            lineHeight: 1.6,
            color: '#333',
            margin: '0 auto',
            maxWidth: '85%',
            position: 'relative',
            zIndex: 1,
          }}>
            <p style={{ margin: 0 }}>
              has actively participated in the <strong>24-Hour Hackathon TECHATHON 1.0</strong>, conducted from April 30th to May 1st, 2026.
              The event was organized by BGMIT, Mudhol. Throughout the competition, the participant demonstrated exceptional enthusiasm, creativity, and a steadfast commitment to innovation.
            </p>
          </div>

          </div>

          {/* Date and Place - moved down */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '0 0 clamp(16px, 2.5vw, 30px)',
            position: 'relative',
            zIndex: 1,
          }}>
            <p style={{ margin: 0, fontSize: 'clamp(9px, 1.1vw, 13px)', color: '#333' }}>
              <strong>Date:</strong> 01 May 2026
            </p>
            <p style={{ margin: 0, fontSize: 'clamp(9px, 1.1vw, 13px)', color: '#333' }}>
              <strong>Place:</strong> Mudhol
            </p>
          </div>

          {/* Signature section - 4 signatures */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            textAlign: 'center',
            gap: '8px',
            position: 'relative',
            zIndex: 1,
            marginBottom: 'clamp(28px, 4vw, 45px)',
          }}>
            {[
              { name: 'Prof. Faculty Name', role: 'Faculty Coordinator' },
              { name: 'Prof. Event Name', role: 'Event Coordinator' },
              { name: 'Dr. HOD Name', role: 'HOD, Dept. of CSE' },
              { name: 'Dr. Principal Name', role: 'Principal, BGMIT' },
            ].map((sig, i) => (
              <div key={i} style={{ width: '23%' }}>
                <div style={{
                  width: '80%',
                  margin: '0 auto',
                  borderBottom: '1.5px solid #333',
                  marginBottom: '4px',
                  height: 'clamp(22px, 3.2vw, 38px)',
                }} />
                <p style={{
                  margin: 0,
                  fontSize: 'clamp(7px, 0.85vw, 11px)',
                  fontWeight: 700,
                  color: '#7F1D1D',
                  lineHeight: 1.3,
                }}>
                  {sig.name}
                </p>
                <p style={{
                  margin: '2px 0 0',
                  fontSize: 'clamp(6px, 0.75vw, 9px)',
                  color: '#555',
                  lineHeight: 1.2,
                }}>
                  {sig.role}
                </p>
              </div>
            ))}
          </div>

          {/* QR Code - bottom left, below signatures */}
          <div style={{
            position: 'absolute',
            bottom: 'clamp(8px, 1.2vw, 14px)',
            left: 'clamp(24px, 4vw, 55px)',
            zIndex: 2,
          }}>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" style={{
                width: 'clamp(36px, 4.5vw, 55px)',
                height: 'clamp(36px, 4.5vw, 55px)',
                border: '1px solid #ccc',
              }} />
            ) : (
              <div style={{
                width: 'clamp(36px, 4.5vw, 55px)',
                height: 'clamp(36px, 4.5vw, 55px)',
                border: '1px solid #ccc',
                background: '#f9f9f9',
              }} />
            )}
          </div>

          {/* Certificate ID - bottom right, below signatures */}
          <div style={{
            position: 'absolute',
            bottom: 'clamp(8px, 1.2vw, 14px)',
            right: 'clamp(24px, 4vw, 55px)',
            zIndex: 2,
            textAlign: 'right',
          }}>
            <p style={{
              margin: 0,
              fontSize: 'clamp(7px, 0.8vw, 10px)',
              color: '#666',
              fontFamily: "'Courier New', monospace",
            }}>
              Certificate ID:
            </p>
            <p style={{
              margin: '2px 0 0',
              fontSize: 'clamp(7px, 0.8vw, 10px)',
              color: '#7F1D1D',
              fontWeight: 700,
              fontFamily: "'Courier New', monospace",
            }}>
              {certificateId || 'BGMIT-XXXX-XXXX'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template3;
