import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large PDF payloads

// ─── Email Template Builders ────────────────────────────────────────────────

function buildRoboraceEmail(participantName, certificateId) {
  return {
    senderName: 'Roborace Team – BGMIT',
    subject: '🏁 Your Roborace Participation Certificate | BGMIT Mudhol',
    htmlContent: `
      <div style="background-color: #0D0D0D; padding: 20px 10px; font-family: 'Helvetica', 'Arial', sans-serif; color: #E5E7EB; line-height: 1.6; font-size: 14px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1A1A2E 0%, #16213E 100%); border-top: 4px solid #E63946; border-bottom: 4px solid #FF6B35; padding: 0; box-shadow: 0 8px 30px rgba(230,57,70,0.15);">
          
          <!-- Top Banner -->
          <div style="background: linear-gradient(135deg, #E63946 0%, #FF6B35 100%); padding: 25px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #FFFFFF; letter-spacing: 3px; text-transform: uppercase; font-weight: 900;">🏁 ROBORACE</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.85); letter-spacing: 2px; text-transform: uppercase;">Certificate of Participation</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px 25px;">
            
            <p style="margin-bottom: 18px; color: #E5E7EB;">Dear <strong style="color: #FF6B35;">${participantName}</strong>,</p>
            
            <p style="margin-bottom: 18px; color: #D1D5DB;">Greetings from the Department of CSE & AIML, BGMIT Mudhol! 🤖</p>
            
            <p style="margin-bottom: 18px; color: #D1D5DB;">Congratulations on successfully participating in <strong style="color: #E63946;">Roborace</strong> — our thrilling robotics racing competition! Your engineering skills, teamwork, and competitive spirit on the track were truly impressive. We are delighted to share your official digital Certificate of Participation, attached as a PDF for your records and future reference.</p>

            <!-- Certificate ID Card -->
            <div style="background: rgba(230,57,70,0.08); border: 1px solid rgba(230,57,70,0.3); border-left: 4px solid #E63946; padding: 15px 18px; margin: 25px 0; border-radius: 0 4px 4px 0;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px;">Certificate ID</p>
              <p style="margin: 0; color: #FF6B35; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px;">${certificateId}</p>
            </div>
            
            <p style="margin-bottom: 20px; color: #D1D5DB;">Thank you for being a part of Roborace and showcasing your passion for robotics and innovation. We look forward to seeing you compete in future events!</p>
            
            <p style="margin-bottom: 20px; font-size: 13px; color: #9CA3AF;">Need to download or share your certificate? <a href="https://techathon-certificates.onrender.com/" style="color: #FF6B35; font-weight: bold; text-decoration: underline;">Access it here</a>.</p>

            <!-- Divider -->
            <div style="border-top: 1px solid rgba(255,107,53,0.2); margin: 25px 0;"></div>
            
            <!-- Footer -->
            <p style="margin-bottom: 5px; color: #E5E7EB;">Best Regards,</p>
            <p style="margin-top: 0; color: #9CA3AF; font-size: 13px;">
              <strong style="color: #E5E7EB;">BGMIT Innovation Council</strong><br/>
              Department of CSE & AIML<br/>
              Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol
            </p>
          </div>

          <!-- Bottom Accent Bar -->
          <div style="height: 4px; background: linear-gradient(90deg, #E63946, #FF6B35, #E63946);"></div>
        </div>
      </div>
    `,
  };
}

function buildTechathonEmail(participantName, certificateId) {
  return {
    senderName: 'Techathon 1.0 Team',
    subject: '🎓 Your Techathon 1.0 Participation Certificate | BGMIT Mudhol',
    htmlContent: `
      <div style="background-color: #FAF9F6; padding: 20px 10px; font-family: 'Helvetica', 'Arial', sans-serif; color: #1F2937; line-height: 1.5; font-size: 14px;">
        <div style="max-width: 600px; margin: 0 auto; border-top: 4px solid #3730A3; border-bottom: 4px solid #D4AF37; padding: 25px 20px; background-color: #FFFDF7; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          
          <h2 style="color: #3730A3; margin-top: 0; margin-bottom: 20px; font-size: 18px;">🎓 Techathon 1.0 - Certificate of Participation</h2>
          
          <p style="margin-bottom: 15px;">Dear <strong>${participantName}</strong>,</p>
          
          <p style="margin-bottom: 15px;">Greetings from the Department of CSE & AIML, BGMIT Mudhol. Congratulations on successfully participating in <strong>Techathon 1.0 – 24 Hour Hackathon</strong>. Your enthusiasm, creativity, teamwork, and innovative thinking throughout the event were truly appreciated. We are pleased to share your official digital Certificate of Participation with this email, attached as a PDF for your records and future reference.</p>
          
          <div style="background-color: #F3F4F6; border-left: 3px solid #D4AF37; padding: 12px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Certificate ID:</strong> <span style="color: #3730A3; font-family: monospace; font-size: 15px;">${certificateId}</span></p>
          </div>
          
          <p style="margin-bottom: 20px;">Thank you for being a part of Techathon 1.0 and contributing to the spirit of innovation and technology. We look forward to your participation in many more future events and achievements.</p>
          
          <p style="margin-bottom: 20px; font-size: 13px; color: #4B5563;">If you need to download or share your certificate across platforms, use this link: <a href="https://techathon-certificates.onrender.com/" style="color: #3730A3; font-weight: bold; text-decoration: underline;">click here</a>.</p>
          
          <p style="margin-bottom: 5px;">Best Regards,</p>
          <p style="margin-top: 0; color: #4B5563; font-size: 13px;">
            <strong style="color: #1F2937;">BGMIT Innovation Council</strong><br/>
            Department of CSE & AIML<br/>
            Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol
          </p>
        </div>
      </div>
    `,
  };
}

// ─── Helper: pick the right template by event name ──────────────────────────

function getEmailTemplate(eventName, participantName, certificateId) {
  const normalized = (eventName || '').toUpperCase().trim();

  if (normalized.includes('ROBORACE')) {
    return buildRoboraceEmail(participantName, certificateId);
  }

  // Default — Techathon
  return buildTechathonEmail(participantName, certificateId);
}

// ─── Routes ─────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('Certificate Email Server is Running! 🚀');
});

app.post('/api/send-certificate-email', async (req, res) => {
  try {
    const {
      participantName,
      participantEmail,
      certificateId,
      fileName,
      eventName,
      pdfBase64,
    } = req.body;

    if (!participantEmail || !pdfBase64) {
      return res.status(400).json({ message: 'Missing participant email or PDF data.' });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      return res.status(500).json({ message: 'Server configuration error (API Key missing).' });
    }

    // Sanitize base64
    const sanitizedBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '');

    // Pick the right template based on eventName
    const { senderName, subject, htmlContent } = getEmailTemplate(eventName, participantName, certificateId);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: participantEmail }],
        subject,
        htmlContent,
        attachment: [
          {
            name: fileName || 'Certificate.pdf',
            content: sanitizedBase64,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Brevo Error:', data);
      return res.status(response.status).json({ 
        message: data.message || 'Failed to send email via Brevo.' 
      });
    }

    return res.json({
      success: true,
      message: 'Email sent successfully!',
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
