import React from 'react';
import logoImage from '../../code/logo.png';
import swamiImage from '../../code/swami.png';

const Template2 = ({ participantName, eventName, certificateDate, certificateId, qrCodeUrl, department }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#fff9f9',
        border: 'clamp(8px, 1.2vw, 16px) solid #d4e4bc',
        padding: 'clamp(3px, 0.5vw, 6px)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          border: '2px solid #e91e63',
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          padding: 'clamp(14px, 3vw, 40px) clamp(16px, 4vw, 60px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#fff9f9',
          overflow: 'hidden',
        }}
      >
        {/* Header with logos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 'clamp(8px, 1.5vw, 18px)' }}>
          <img src={logoImage} alt="BVV Sangha Logo" style={{ width: 'clamp(52px, 8vw, 90px)', height: 'clamp(52px, 8vw, 90px)', objectFit: 'contain', flexShrink: 0 }} />

          <div style={{ textAlign: 'center', color: '#8b9d44', flex: 1 }}>
            <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: 'clamp(10px, 1.3vw, 18px)', fontWeight: 800, letterSpacing: '0.1em' }}>
              B.V.V SANGHA'S
            </p>
            <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: 'clamp(10px, 1.5vw, 20px)', fontWeight: 800, letterSpacing: '0.02em', lineHeight: '1.2' }}>
              BILURU GURUBASAV MAHASWAMIJI INSTITUTE OF TECHNOLOGY, MUDHOL
            </p>
            {department && (
              <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: 'clamp(9px, 1.3vw, 16px)', fontWeight: 700, color: '#e91e63' }}>
                DEPARTMENT OF {department.toUpperCase()}
              </p>
            )}
          </div>

          <img src={swamiImage} alt="Swamiji" style={{ width: 'clamp(52px, 8vw, 90px)', height: 'clamp(52px, 8vw, 90px)', objectFit: 'contain', flexShrink: 0 }} />
        </div>

        {/* Decorative divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'clamp(10px, 1.8vw, 20px) 0' }}>
          <div style={{ height: '2px', backgroundColor: '#8b9d44', width: '45%' }}></div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b9d44', margin: '0 10px' }}></div>
          <div style={{ height: '2px', backgroundColor: '#8b9d44', width: '45%' }}></div>
        </div>

        {/* Event title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 auto', fontSize: 'clamp(32px, 5vw, 65px)', color: '#000', textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 900 }}>
            {eventName || 'EVENT'}
          </h1>
          <p style={{ margin: '10px 0 0', color: '#e91e63', fontFamily: 'serif', fontSize: 'clamp(14px, 2.2vw, 28px)', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.1 }}>
            Certificate of Participation
          </p>
          <p style={{ margin: '20px 0 0', fontStyle: 'italic', fontSize: 'clamp(10px, 1.4vw, 18px)', color: '#000' }}>
            This is to certify that
          </p>
        </div>

        {/* Participant name without underline */}
        <div
          style={{
            width: '74%',
            margin: 'clamp(18px, 2.6vw, 25px) auto 0',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(18px, 3.4vw, 42px)',
              textTransform: 'uppercase',
              color: '#000',
              lineHeight: 1,
              letterSpacing: '0.01em',
              fontWeight: 600,
              marginBottom: '2px', // controls gap
            }}
          >
            {participantName || ""}
          </div>
        </div>
        
        {/* Event description */}
        <div style={{ marginTop: 'clamp(18px, 2.8vw, 25px)', textAlign: 'center', fontSize: 'clamp(10px, 1.5vw, 19px)', lineHeight: '1.55', color: '#000', padding: '0 clamp(10px, 3vw, 40px)' }}>
          <p style={{ margin: 0 }}>
            has participated in the <strong>{eventName || 'Event'}</strong>, held {certificateDate ? `on ${certificateDate}` : 'at BGMIT, Mudhol'}.
          </p>
          <p style={{ margin: '15px 0 0', fontWeight: '300' }}>
            The participant demonstrated enthusiasm, creativity, and commitment to innovation throughout the event.
          </p>
        </div>

        {/* Signatories */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', color: '#8b9d44', textAlign: 'center', paddingBottom: 'clamp(18px, 3.2vw, 40px)', gap: '10px' }}>
          <div style={{ width: '30%' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(7px, 1vw, 14px)', lineHeight: 1.15 }}>PROF. VARUN SARVADE</p>
            <p style={{ margin: '2px 0 0', fontSize: 'clamp(6px, 0.8vw, 11px)' }}>(HOD, {department || 'CSE'}, BGMIT)</p>
          </div>
          <div style={{ width: '30%' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(7px, 1vw, 14px)', lineHeight: 1.15 }}>PROF. TBA</p>
            <p style={{ margin: '2px 0 0', fontSize: 'clamp(6px, 0.8vw, 11px)' }}>(EVENT COORDINATOR)</p>
          </div>
          <div style={{ width: '30%' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(7px, 1vw, 14px)', lineHeight: 1.15 }}>DR. SHRAVANKUMAR KERUR</p>
            <p style={{ margin: '2px 0 0', fontSize: 'clamp(6px, 0.8vw, 11px)' }}>(PRINCIPAL, BGMIT)</p>
          </div>
        </div>

        {/* QR Code and Certificate ID - RIGHT CORNER */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(10px, 1.8vw, 20px)',
          right: 'clamp(10px, 2vw, 25px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 'clamp(4px, 0.6vw, 8px)'
        }}>
          <div>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR" style={{ width: 'clamp(34px, 4.5vw, 55px)', height: 'clamp(34px, 4.5vw, 55px)', border: '1px solid #000' }} />
            ) : (
              <div style={{ width: 'clamp(34px, 4.5vw, 55px)', height: 'clamp(34px, 4.5vw, 55px)', border: '1px solid #000', background: '#f0f0f0' }} />
            )}
          </div>
          <p style={{ margin: 0, color: '#e91e63', fontWeight: 700, fontSize: 'clamp(5px, 0.75vw, 9px)', textAlign: 'right', lineHeight: 1.2 }}>
            CERT ID:<br />{certificateId || 'BGMIT-EVT-001'}
          </p>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(6px, 1vw, 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'clamp(120px, 22vw, 250px)',
          height: 'clamp(4px, 0.9vw, 10px)',
          backgroundColor: '#8b9d44'
        }}></div>

      </div>
    </div>
  );
};

export default Template2;
