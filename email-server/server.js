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
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Congratulations ${participantName}!</h2>
            <p>You have successfully participated in <strong>${eventName || 'Techathon 1.0'}</strong>.</p>
            <p>Your official certificate is attached to this email.</p>
            <p><strong>Certificate ID:</strong> ${certificateId}</p>
            <br />
            <p>Best regards,</p>
            <p><strong>The Event Team</strong></p>
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
