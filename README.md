# Techathon1.0 Certificate Generation System

React + Tailwind app for validating hackathon participants from Firebase Firestore and generating downloadable certificate PDFs with QR code verification.

## Stack

- Frontend: React + Vite + Tailwind CSS + React Router
- Backend: Firebase Firestore
- PDF generation: html2canvas + jsPDF
- QR Codes: qrcode library
- CSV Upload: papaparse

## Features

- ✅ Participant validation with name + email
- ✅ 3 beautiful certificate templates (Classic, Modern, Dark Tech)
- ✅ Unique certificate ID generation (UUID)
- ✅ QR code embedding in certificates
- ✅ Live template preview with instant switching
- ✅ A4 landscape PDF export (high resolution)
- ✅ Certificate verification page (/verify/:certificateId)
- ✅ Admin panel for CSV upload and statistics
- ✅ Firestore integration with security rules
- ✅ Team photo display on verification page

## Project Structure

```
src/
  components/
    Template1.jsx
    Template2.jsx
    Template3.jsx
    CertificatePreview.jsx
  pages/
    GenerateCertificate.jsx
    VerifyCertificate.jsx
    AdminPanel.jsx
  firebase/
    config.js
  utils/
    certificateUtils.js
scripts/
  seedParticipant.mjs
firestore.rules
```

## Quick Start

### 1. Install & Setup

```bash
npm install
```

### 2. Configure Firebase

Create `.env` file from `.env.example`:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Create Firestore Collection

In Firebase Console:
- Create collection: `participants`
- Set security rules from `firestore.rules`

### 4. Seed Test Data (One-Click)

```bash
npm run seed:participant
```

Creates a test participant:
- Name: `Ravi Kumar`
- Email: `ravi.kumar@example.com`

### 5. Run Locally

```bash
npm run dev
```

Navigate to `http://localhost:5173`

## Usage

### Certificate Generation (/):

1. Enter participant name and email
2. Click "Verify & Continue"
3. Select a template and click Preview
4. Click Download to generate PDF
5. Certificate ID and QR code are auto-generated

### Verification (/verify/:certificateId):

1. Share QR code link with participants
2. Click link or visit directly:
   `http://localhost:5173/verify/ABC123XYZ789`
3. System displays verified participant info

### Admin Panel (/admin):

1. View certificate generation statistics
2. Upload participants via CSV
3. Manage bulk certificate creation

## Firestore Data Model

### Collection: `participants`

```json
{
  "name": "Ravi Kumar",
  "email": "ravi.kumar@example.com",
  "teamName": "CodeSpark",
  "role": "Developer",
  "problemStatement": "Smart Waste Segregation Using AI",
  "teamPhotoUrl": "https://example.com/team-photo.jpg",
  "certificateGenerated": false,
  "certificateId": "ABCD1234EFGH5678",
  "eventName": "Techathon1.0",
  "date": "<Firestore Timestamp>"
}
```

## CSV Upload Format

```csv
name,email,teamName,role,problemStatement,teamPhotoUrl,certificateGenerated,certificateId,date
Ravi Kumar,ravi@example.com,CodeSpark,Developer,Smart Waste,https://example.com/photo.jpg,false,AUTO,2024-01-15
```

**Notes:**
- `certificateId` can be "AUTO" to generate automatically
- `date` format: YYYY-MM-DD or ISO 8601
- All other fields are optional

## Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

2. Initialize hosting:
```bash
firebase init hosting
```

3. Build and deploy:
```bash
npm run build
firebase deploy
```

Your certificate system is now live at: `https://your-project.web.app/`

### Important: Update QR Code Links

After deployment, QR codes will point to your deployed domain. Update environment or re-deploy after domain is set.

### Verify Deployment

1. Generate a certificate
2. Scan QR code - should redirect to: `https://your-project.web.app/verify/{certificateId}`

## Security

### Firestore Rules

The `firestore.rules` file includes:
- Public read access for verification queries
- Write protected (authenticated only)
- Prevents manual certificateId edits
- Email field immutable after creation

Deploy rules:
1. Go to Firebase Console → Firestore → Rules
2. Paste content from `firestore.rules`
3. Click Publish

### Best Practices

- Enable Firebase Authentication for admin access
- Use environment variables for sensitive data
- Restrict Storage bucket rules for team photos
- Regular backups of participant data
- Monitor API usage via Firebase Console

## Optional: Firebase Storage

For team photo hosting:

1. Enable Firebase Storage
2. Upload photos via admin panel or Firebase Console
3. Update participant documents with `teamPhotoUrl`

## Building for Production

```bash
npm run build
npm run preview
```

Creates optimized bundle in `dist/` folder.

## Troubleshooting

### Certificate PDF generation fails

- Check Browser DevTools (F12) for errors
- Ensure external images (teamPhotoUrl) are accessible
- Clear browser cache and retry

### QR code links not working

- Verify domain in environment variables
- Check if QR code image data is valid
- Test manual verification URL: `/verify/{certificateId}`

### Firestore queries failing

- Check Firebase authentication status
- Verify collection name is exactly `participants`
- Ensure security rules allow your domain

## Future Enhancements

- Email notifications on certificate download
- Digital signature support
- Blockchain certificate storage
- Multi-event certificate management
- Advanced analytics dashboard

## Support

For issues or questions:
1. Check Firestore rules and console
2. Verify environment variables
3. Check browser console errors
4. Review Firebase quota usage

