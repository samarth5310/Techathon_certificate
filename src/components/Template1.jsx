import React from 'react';
import logoImage from '../../code/logo.png';
import swamiImage from '../../code/swami.png';
import techathonFontImage from '../../code/FONT.png';
import sanghaLogo from '../../assets/Sangha-Logo-237x300.jpg';

const Template1 = ({ participantName, eventName, certificateDate, certificateId, qrCodeUrl }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#c0dfac',
        padding: '14px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ backgroundColor: '#969e46', padding: '4px', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#e6eecd', padding: '14px', height: '100%', boxSizing: 'border-box' }}>
          <div
            style={{
              backgroundColor: '#fbfdf8',
              height: '100%',
              width: '100%',
              boxSizing: 'border-box',
              padding: '28px 50px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top bracket (10%) */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              height: '10%',
              borderTop: '3px solid #c81b7e',
              borderLeft: '3px solid #c81b7e',
              borderRight: '3px solid #c81b7e',
              pointerEvents: 'none',
              zIndex: 0,
            }} />

            {/* Left split line */}
            <div style={{
              position: 'absolute',
              top: 'calc(10% + 20px)',
              bottom: 'calc(10% + 20px)',
              left: '8px',
              width: '3px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              pointerEvents: 'none',
              zIndex: 0,
            }}>
              <div style={{ flex: '1', backgroundColor: '#8fa747' }}></div>
              <div style={{ flex: '1', backgroundColor: '#c81b7e' }}></div>
              <div style={{ flex: '1', backgroundColor: '#8fa747' }}></div>
            </div>

            {/* Right split line */}
            <div style={{
              position: 'absolute',
              top: 'calc(10% + 20px)',
              bottom: 'calc(10% + 20px)',
              right: '8px',
              width: '3px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              pointerEvents: 'none',
              zIndex: 0,
            }}>
              <div style={{ flex: '1', backgroundColor: '#8fa747' }}></div>
              <div style={{ flex: '1', backgroundColor: '#c81b7e' }}></div>
              <div style={{ flex: '1', backgroundColor: '#8fa747' }}></div>
            </div>
            
            {/* Bottom bracket (10%) */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              right: '8px',
              height: '10%',
              borderBottom: '3px solid #8fa747',
              borderLeft: '3px solid #8fa747',
              borderRight: '3px solid #8fa747',
              pointerEvents: 'none',
              zIndex: 0,
            }} />

        {/* Background Watermark - Sangha Logo */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '45%',
          height: '50%',
          backgroundImage: `url(${sanghaLogo})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.08,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Header with logos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '18px', position: 'relative', zIndex: 1 }}>
          <div style={{ height: '95px', width: '95px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={logoImage} alt="BVV Sangha Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ textAlign: 'center', color: '#8b9d44', flex: 1 }}>
            <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '18px', fontWeight: 800, letterSpacing: '0.1em' }}>
              B.V.V SANGHA'S
            </p>
            <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '0.02em', lineHeight: '1.2' }}>
              BILURU GURUBASAV MAHASWAMIJI INSTITUTE OF TECHNOLOGY, MUDHOL
            </p>
          </div>

          <div style={{ height: '95px', width: '95px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={swamiImage} alt="Swamiji" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Decorative divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0', position: 'relative', zIndex: 1, gap: '4px' }}>
          {/* Left dots */}
          <div style={{ width: '2px', height: '2px', borderRadius: '50%', backgroundColor: '#8b9d44' }}></div>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#8b9d44' }}></div>
          
          {/* Double lines */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '75%', gap: '2px', margin: '0 2px' }}>
            <div style={{ height: '2px', backgroundColor: '#e91e63', width: '100%' }}></div>
            <div style={{ height: '2px', backgroundColor: '#8b9d44', width: '100%' }}></div>
          </div>

          {/* Right dots */}
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#8b9d44' }}></div>
          <div style={{ width: '2px', height: '2px', borderRadius: '50%', backgroundColor: '#8b9d44' }}></div>
        </div>

        {/* Event title */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {eventName && eventName.toLowerCase() !== 'techathon 1.0' && eventName.toLowerCase() !== 'techathon1.0' ? (
            <h1 style={{ margin: '0 auto', fontSize: '65px', color: '#000', textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 900 }}>{eventName}</h1>
          ) : (
            <img
              src={techathonFontImage}
              alt="Techathon 1.0"
              style={{ height: '75px', margin: '0 auto', objectFit: 'contain' }}
            />
          )}
          <p style={{ margin: '6px 0 0', color: '#e91e63', fontFamily: 'serif', fontSize: '24px', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.1 }}>
            Certificate of Participation
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '16px', color: '#000', fontFamily: '"Canva Sans", "Open Sans", sans-serif' }}>
            This is to certify that
          </p>
        </div>

        {/* Participant name */}
        <div
          style={{
            width: '74%',
            margin: '14px auto 0',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: '"KrinahFont"',
              fontSize: '40px',
              textTransform: 'capitalize',
              color: '#000',
              lineHeight: 1,
              letterSpacing: '0.02em',
              fontWeight: 350,
              marginBottom: '2px',
            }}
          >
            {participantName || ""}
          </div>
        </div>

        {/* Event description */}
        <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '16px', lineHeight: '1.5', color: '#000', padding: '0 40px', position: 'relative', zIndex: 1, fontFamily: '"Canva Sans", "Open Sans", sans-serif' }}>
          <p style={{ margin: 0 }}>
            has participated in the <strong>24-Hour hackathon</strong>, held {certificateDate ? `on ${certificateDate}` : 'on 30th April 2026'}.
          </p>
          <p style={{ margin: '8px 0 0', fontWeight: '400' }}>
            The participant demonstrated enthusiasm, creativity, and commitment to innovation throughout the event.
          </p>
        </div>

        {/* Signatories */}
        <div style={{ marginTop: 'auto', marginBottom: '50px', display: 'flex', justifyContent: 'space-between', color: '#8b9d44', textAlign: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '30%' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', lineHeight: 1.15 }}>PROF. VARUN SARVADE</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px' }}>(HOD, CSE, BGMIT)</p>
          </div>
          <div style={{ width: '30%' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', lineHeight: 1.15 }}>PROF. TBA</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px' }}>(EVENT COORDINATOR)</p>
          </div>
          <div style={{ width: '30%' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', lineHeight: 1.15 }}>DR. SHRAVANKUMAR KERUR</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px' }}>(PRINCIPAL, BGMIT)</p>
          </div>
        </div>

        {/* QR Code - BOTTOM LEFT */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '25px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          zIndex: 1,
        }}>
          <div>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR" style={{ width: '55px', height: '55px', border: '1px solid #000' }} />
            ) : (
              <div style={{ width: '55px', height: '55px', border: '1px solid #000', background: '#f0f0f0' }} />
            )}
          </div>
        </div>

        {/* Certificate ID - BOTTOM RIGHT */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '25px',
          zIndex: 1,
        }}>
          <p style={{ margin: 0, color: '#e91e63', fontWeight: 700, fontSize: '9px', textAlign: 'right', lineHeight: 1.2 }}>
            CERT ID: {certificateId || 'BGMIT-TECH-001'}
          </p>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '250px',
          height: '6px',
          backgroundColor: '#8b9d44'
        }}></div>

      </div>
      </div>
      </div>
    </div>
  );
};

export default Template1;