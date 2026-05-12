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

app.get('/', (req, res) => {
  res.send('Techathon Email Server is Running! 🚀');
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
    const senderName = process.env.BREVO_SENDER_NAME || 'Techathon 1.0 Team';

    if (!apiKey || !senderEmail) {
      return res.status(500).json({ message: 'Server configuration error (API Key missing).' });
    }

    // Sanitize base64
    const sanitizedBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '');

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
              
              <p style="margin-bottom: 5px;">Best Regards,</p>
              <p style="margin-top: 0; color: #4B5563; font-size: 13px;">
                <strong style="color: #1F2937;">BGMIT Innovation Council</strong><br/>
                Department of CSE & AIML<br/>
                Biluru Gurubasava Mahaswamiji Institute of Technology, Mudhol
              </p>
            </div>
          </div>
        `,
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
