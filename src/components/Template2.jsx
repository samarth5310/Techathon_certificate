import React from 'react';
import logoImage from '../../code/logo.png';
import swamiImage from '../../code/swami.png';
import principalSignImage from '../../code/principal_sign.png';

const Template2 = ({ participantName, eventName, certificateDate, certificateId, qrCodeUrl, department }) => {
  const nameLen = (participantName || 'Participant Name').length;
  let nameFontSize = '38px';
  if (nameLen > 25) {
    nameFontSize = '24px';
  } else if (nameLen > 18) {
    nameFontSize = '30px';
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#4338CA',
      padding: '36px',
      boxSizing: 'border-box',
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      {/* Green accent border */}
      <div style={{
        width: '100%',
        height: '100%',
        border: '12px solid #D4AF37',
        boxSizing: 'border-box',
        padding: '16px',
      }}>
        {/* White content area */}
        <div style={{
          width: '100%',
          height: '100%',
          background: '#FAF9F6',
          boxSizing: 'border-box',
          padding: '28px 55px',
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
            <img src={logoImage} alt="" style={{ width: '300px', height: '300px', objectFit: 'contain' }} />
          </div>

          {/* Header with logos and college name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            position: 'relative',
            zIndex: 1,
          }}>
            <img src={logoImage} alt="BVV Sangha Logo" style={{
              width: '70px',
              height: '85px',
              objectFit: 'contain',
            }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#1E3A8A',
                textTransform: 'uppercase',
              }}>
                B.V.V Sangha's
              </p>
              <p style={{
                margin: '3px 0 0',
                fontSize: '20px',
                fontWeight: 700,
                color: '#1E3A8A',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                lineHeight: 1.2,
              }}>
                Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol
              </p>
              {/* Divider Line with Dots */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '16px auto 0',
                width: '85%',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4AF37' }} />
                <div style={{ flex: 1, height: '2px', background: '#D4AF37', margin: '0 8px' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4AF37' }} />
              </div>
            </div>
            <img src={swamiImage} alt="Gurubasava Swamiji" style={{
              width: '70px',
              height: '85px',
              objectFit: 'contain',
            }} />
          </div>

          {/* Certificate Title Banner */}
          <div
            style={{
              margin: '24px auto',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: '#1E3A8A',
                padding: '12px 40px',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Left and right banner tails */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-20px',
                width: 0,
                height: 0,
                borderTop: '24px solid #1E3A8A',
                borderBottom: '24px solid #1E3A8A',
                borderLeft: '20px solid transparent'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                right: '-20px',
                width: 0,
                height: 0,
                borderTop: '24px solid #1E3A8A',
                borderBottom: '24px solid #1E3A8A',
                borderRight: '20px solid transparent'
              }} />
              <p
                style={{
                  margin: 0,
                  color: '#FFFFFF',
                  fontSize: '24px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
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
            marginBottom: '50px', // Pushes text slightly upwards
          }}>
            {/* THIS IS TO CERTIFY THAT */}
            <p style={{
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: '#333',
              letterSpacing: '0.08em',
              margin: '0 0 16px 0',
              position: 'relative',
              zIndex: 1,
            }}>
              THIS IS TO CERTIFY THAT
            </p>

            {/* Participant Name */}
            <div style={{
              textAlign: 'center',
              margin: '0 auto 24px',
              width: '100%',
              position: 'relative',
              zIndex: 1,
            }}>
              <p style={{
                margin: 0,
                fontSize: nameFontSize,
                fontWeight: 700,
                color: '#1E3A8A',
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
              fontSize: '14px',
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

          {/* Date and Place */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'absolute',
            bottom: '85px',
            left: '55px',
            right: '55px',
            zIndex: 1,
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>
              <strong>Date:</strong> 01 May 2026
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>
              <strong>Place:</strong> Mudhol
            </p>
          </div>

          {/* Signature section - 1 signature */}
          <div style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 1,
            width: '240px'
          }}>
            <img src={principalSignImage} alt="Principal Signature" style={{ height: '60px', marginBottom: '0px', objectFit: 'contain' }} />
            <div style={{
              width: '100%',
              margin: '0 auto',
              borderBottom: '1.5px solid #333',
              marginBottom: '8px',
            }} />
            <p style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: '#1E3A8A',
              lineHeight: 1.3,
            }}>
              Dr. Shravankumar B. Kerur
            </p>
            <p style={{
              margin: '2px 0 0',
              fontSize: '12px',
              color: '#555',
              lineHeight: 1.2,
              fontStyle: 'italic'
            }}>
              Principal, BGMIT
            </p>
          </div>

          {/* QR Code - bottom left, below signatures */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '20px',
            zIndex: 2,
          }}>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" style={{
                width: '55px',
                height: '55px',
                border: '1px solid #ccc',
              }} />
            ) : (
              <div style={{
                width: '55px',
                height: '55px',
                border: '1px solid #ccc',
                background: '#f9f9f9',
              }} />
            )}
          </div>

          {/* Certificate ID - bottom right, below signatures */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            right: '55px',
            zIndex: 2,
            textAlign: 'right',
          }}>
            <p style={{
              margin: 0,
              fontSize: '10px',
              color: '#666',
              fontFamily: "'Courier New', monospace",
            }}>
              Certificate ID:
            </p>
            <p style={{
              margin: '2px 0 0',
              fontSize: '10px',
              color: '#1E3A8A',
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

export default Template2;
