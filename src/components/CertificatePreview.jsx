import Template1 from './Template1'
import Template2 from './Template2'

const isTechathon = (name) => {
  if (!name) return true
  const lower = name.toLowerCase().replace(/\s+/g, '')
  return lower === 'techathon1.0' || lower === 'techathon1.0' || lower === 'techathon'
}

const CertificatePreview = ({
  showPreview = true,
  participantName,
  eventName,
  certificateDate,
  certificateId,
  qrCodeUrl,
  department,
  previewRef,
}) => {
  const useTechathonTemplate = isTechathon(eventName)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '2px solid var(--border-brutal)',
      boxShadow: '6px 6px 0px #000',
      padding: '12px',
      position: 'relative',
    }}>
      <div
        ref={previewRef}
        style={{
          width: '100%',
          maxWidth: '1123px',
          margin: '0 auto',
          overflow: 'hidden',
          backgroundColor: useTechathonTemplate ? '#fff9f9' : '#fdf8f0',
        }}
      >
        <div style={{
          aspectRatio: '1.414 / 1',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {showPreview ? (
            useTechathonTemplate ? (
              <Template1
                participantName={participantName}
                eventName={eventName}
                certificateDate={certificateDate}
                certificateId={certificateId}
                qrCodeUrl={qrCodeUrl}
              />
            ) : (
              <Template2
                participantName={participantName}
                eventName={eventName}
                certificateDate={certificateDate}
                certificateId={certificateId}
                qrCodeUrl={qrCodeUrl}
                department={department}
              />
            )
          ) : (
            <div style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff9f9',
              textAlign: 'center',
              color: '#333',
            }}>
              <div style={{ maxWidth: '400px', padding: '0 24px' }}>
                <p style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '18px',
                }}>
                  [ AWAITING VALIDATION ]
                </p>
                <p style={{ marginTop: '12px', fontSize: '13px', color: '#888' }}>
                  Verify participant identity to render certificate
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CertificatePreview
