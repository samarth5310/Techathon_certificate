# Techathon1.0 Certificate Verification System - Implementation Guide

Complete end-to-end implementation with QR codes, verification, and admin features.

## What's New (v2.0)

✅ **Unique Certificate IDs** - UUID v4 format, stored in Firestore
✅ **QR Code Generation** - Embeds in all 3 templates, clickable verification links
✅ **Verification Page** - Public `/verify/{certificateId}` to display authentic certificates
✅ **Admin Panel** - CSV bulk upload, statistics dashboard
✅ **Firestore Security Rules** - Protected participant data with smart queries
✅ **Deployment Ready** - Firebase Hosting pre-configured

---

## Architecture Overview

```
User Flow:
1. Participant enters name + email → /
2. System validates against Firestore → matches required
3. Participant selects template
4. System generates:
   - Unique certificateId (UUID)
   - QR code data URL
   - PDF with embedded QR
5. On download:
   - certificateId stored in Firestore
   - certificateGenerated = true
6. Share certificate:
   - Scan QR → /verify/{certificateId}
   - Shows verified participant info

Admin Flow:
1. Upload CSV → /admin
2. System auto-generates certificateIds
3. bulk inserts into Firestore
4. View statistics dashboard
```

---

## Step-by-Step Implementation

### Phase 1: Local Development (Already Done ✅)

```bash
# 1. Clone/open project
cd d:\Certi

# 2. Install dependencies
npm install

# 3. Configure Firebase
# Copy .env.example to .env
# Fill in your Firebase credentials

# 4. Create Firestore collection
# Firebase Console → Firestore → Create Collection "participants"

# 5. Seed test data
npm run seed:participant

# 6. Run locally
npm run dev
# Opens http://localhost:5173
```

### Phase 2: Testing Locally

**Test Participant Validation:**
```
Name: Ravi Kumar
Email: ravi.kumar@example.com
```

1. Visit http://localhost:5173
2. Enter name and email
3. Click "Verify & Continue"
4. See template selection unlock
5. Select a template
6. Click "Download" → generates PDF with QR

**Test Verification Page:**
1. After PDF download, a certificateId is stored
2. Visit http://localhost:5173/verify/[CERTIFICATE_ID]
3. See participant data displayed

**Test Admin Panel:**
1. Visit http://localhost:5173/admin
2. Click "Refresh Stats" to see stats
3. Prepare CSV file:
   ```csv
   name,email,teamName,role,problemStatement,teamPhotoUrl,certificateGenerated,certificateId,date
   John Doe,john@example.com,Team Alpha,Lead,AI Solution,https://example.com/photo1.jpg,false,AUTO,2024-04-08
   Jane Smith,jane@example.com,Team Beta,Dev,ML Model,https://example.com/photo2.jpg,false,AUTO,2024-04-08
   ```
4. Upload CSV → system adds participants with auto-generated certificateIds

### Phase 3: Production Deployment

#### Step 1: Build Production Bundle

```bash
npm run build
```

Output: `dist/` folder containing optimized assets

#### Step 2: Deploy to Firebase Hosting

**First time setup:**
```bash
npm install -g firebase-tools
firebase login
cd d:\Certi
firebase init hosting
# Select your Firebase project
# Set public directory to: dist
# Do NOT rewrite URLs (keep as NO)
```

**Deploy:**
```bash
npm run build
firebase deploy
```

Your app is now live at: `https://your-project-id.web.app/`

#### Step 3: Update Firestore Security Rules

1. Open Firebase Console → Firestore Database
2. Go to "Rules" tab
3. Replace with content from `firestore.rules`
4. Click "Publish"

#### Step 4: Enable Optional Firebase Features

**Firebase Storage** (for team photos):
1. Firebase Console → Storage
2. Create bucket in same region as Firestore
3. Add rules:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

**Firebase Authentication** (optional for admin):
1. Firebase Console → Authentication
2. Enable Email/Password provider
3. Add admin users in "Users" tab

---

## File Structure & Key Components

```
d:\Certi/
├── src/
│   ├── components/
│   │   ├── CertificatePreview.jsx      # Dynamic renderer
│   │   ├── Template1.jsx               # Classic template + QR
│   │   ├── Template2.jsx               # Modern template + QR
│   │   └── Template3.jsx               # Dark template + QR
│   │
│   ├── pages/
│   │   ├── GenerateCertificate.jsx     # Main flow (validation + PDF)
│   │   ├── VerifyCertificate.jsx       # Public verification page
│   │   └── AdminPanel.jsx              # CSV upload + stats
│   │
│   ├── firebase/
│   │   └── config.js                   # Firebase init + Firestore
│   │
│   ├── utils/
│   │   └── certificateUtils.js         # UUID, QR generation
│   │
│   ├── App.jsx                         # React Router setup
│   └── index.css                       # Tailwind + theme
│
├── scripts/
│   └── seedParticipant.mjs             # Test data seeding
│
├── firestore.rules                     # Security rules
├── .env.example                        # Firebase config template
├── package.json                        # Dependencies
└── vite.config.js                      # Build config
```

---

## Key Utilities

### certificateUtils.js

```javascript
generateCertificateId()        // → "A1B2C3D4E5F6G7H8"
generateQRCodeDataUrl(id, domain)  // → data URL (PNG)
parseQueryDomain()             // → current domain for QR links
```

---

## Firestore Data Model (Updated)

### Collection: `participants`

```json
{
  "name": "Ravi Kumar",
  "email": "ravi.kumar@example.com",
  "teamName": "CodeSpark",
  "role": "Developer",
  "problemStatement": "Smart Waste Segregation Using AI",
  "teamPhotoUrl": "https://example.com/team-photo.jpg",
  "certificateGenerated": true,
  "certificateId": "A1B2C3D4E5F6G7H8",
  "eventName": "Techathon1.0",
  "date": Timestamp(2024, 4, 8, 12, 30, 45)
}
```

---

## Routes & Endpoints

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | GenerateCertificate | Download certificates |
| `/verify/:certificateId` | VerifyCertificate | View verified certificate |
| `/admin` | AdminPanel | Bulk upload + stats |

---

## Security Considerations

### Firestore Rules (firestore.rules)

```
✅ Public read for /verify page (by certificateId)
✅ Write protection for admin only
✅ certificateId cannot be modified
✅ Email immutable after creation
```

### Deployment Checklist

- [ ] Environment variables in `.env` (never commit)
- [ ] Firestore rules published
- [ ] CORS configured if using external APIs
- [ ] Storage bucket configured for team photos
- [ ] Firebase Authentication enabled (if admin protect)
- [ ] Backup strategy for Firestore
- [ ] Monitor API usage

---

## Monitoring & Maintenance

### Firebase Console Shortcuts

1. **Firestore Dashboard**: View document count, usage
2. **Authentication**: Manage admin users
3. **Storage**: Monitor photo uploads
4. **Hosting**: View traffic, rollback deployments
5. **Billing**: Track costs

### Common Tasks

```bash
# View Firestore usage
firebase firestore:describe

# Download backup
firebase firestore:export gs://my-bucket/backup-date

# Redeploy after changes
npm run build && firebase deploy
```

---

## Testing Checklist

- [ ] Participant validation works
- [ ] Certificate PDF generates with QR code
- [ ] Unique certificateId created per download
- [ ] QR code scans → verification page
- [ ] Verification page shows correct participant
- [ ] CSV upload creates participants
- [ ] Admin stats update correctly
- [ ] Mobile responsive layout
- [ ] Production URLs work

---

## Troubleshooting

### QR Not Displaying in PDF

**Cause**: html2canvas timeout or CORS issue
**Fix**: 
- Increase wait time in downloadCertificate()
- Ensure teamPhotoUrl is publicly accessible
- Check browser console for errors

### Certificate ID Not Storing

**Cause**: Firestore permission denied
**Fix**:
- Verify security rules are published
- Check authentication status
- Ensure participant document exists

### Verification Page 404

**Cause**: Routing not configured
**Fix**:
- Verify React Router setup in App.jsx
- Check deployment includes client-side routing
- Add `firebase.json` rewrites for SPA

### CSV Upload Fails

**Cause**: Invalid CSV format or Firebase error
**Fix**:
- Check CSV headers match exactly
- Verify email column filled
- Check Firestore quota not exceeded

---

## Next Steps / Enhancements

1. **Email Notifications**
   - Send certificate link to participant email
   - Firebase Functions + SendGrid

2. **Digital Signatures**
   - Add organizer digital signature
   - Use Certificate Authority

3. **Blockchain**
   - Store certificateId hash on-chain
   - Immutable verification

4. **Multi-Event**
   - Support multiple hackathons
   - Certificate archive system

5. **Analytics**
   - Track certificate downloads
   - Verify page view tracking
   - Generate reports

---

## Support & Resources

- Firebase Docs: https://firebase.google.com/docs
- React Router: https://reactrouter.com
- Tailwind CSS: https://tailwindcss.com
- QRCode.js: https://davidshimjs.github.io/qrcodejs/

---

## Version History

- **v2.0** (Current) - QR codes, verification, admin panel
- **v1.0** - Basic certificate generation with 3 templates

---

**Last Updated:** April 8, 2026
**Maintained by:** BGMIT Innovation Council
