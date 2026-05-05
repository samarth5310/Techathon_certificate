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
        subject: `${eventName || 'Techathon 1.0'} Certificate - ${participantName}`,
        htmlContent: `
          <div style="background-color: #050505; padding: 40px 20px; font-family: 'Helvetica', 'Arial', sans-serif; color: #ffffff; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; border: 4px solid #fffb00; padding: 40px; background-color: #000000; box-shadow: 12px 12px 0px #ff0055;">
              
              <!-- Header -->
              <h1 style="color: #fffb00; font-size: 36px; text-transform: uppercase; margin: 0 0 20px 0; letter-spacing: 4px; border-bottom: 2px solid #00f2ff; padding-bottom: 10px;">
                CONGRATULATIONS
              </h1>
              
              <p style="font-size: 18px; line-height: 1.6; color: #e0e0e0; margin-bottom: 30px;">
                Hello <strong style="color: #00f2ff;">${participantName}</strong>,<br />
                You have successfully conquered <strong>${eventName || 'TECHATHON 1.0'}</strong>.
              </p>
              
              <!-- Main Message -->
              <div style="background-color: #111; border: 1px solid #333; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 16px; color: #888; text-transform: uppercase; letter-spacing: 2px;">Your Achievement is Attached</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">// Official Digital Certificate PDF Included</p>
              </div>

              <!-- Certificate ID Box -->
              <div style="border: 2px dashed #ff0055; padding: 15px; display: inline-block; margin-bottom: 30px;">
                <span style="color: #888; font-size: 12px; display: block; margin-bottom: 5px;">CERTIFICATE_ID</span>
                <span style="color: #ff0055; font-size: 20px; font-weight: bold; letter-spacing: 1px;">${certificateId}</span>
              </div>

              <!-- Footer -->
              <div style="margin-top: 20px; border-top: 1px solid #222; padding-top: 20px;">
                <p style="font-size: 12px; color: #444; margin: 0;">
                  BGMIT INNOVATION COUNCIL © 2026<br />
                  DEPARTMENT OF CSE & AIML
                </p>
              </div>

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
