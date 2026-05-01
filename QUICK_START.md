# Quick Start Guide - Techathon1.0 Certificate System

Get up and running in 5 minutes.

## Prerequisites

- Node.js 16+
- Firebase project (create at https://console.firebase.google.com)
- Git or direct file access to `/d/Certi`

## 1. Firebase Setup (2 min)

### Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Create Project" → Enter name → Accept defaults → Create
3. Go to "Build" → "Firestore Database" → Create Database
   - Region: `asia-south1` (India) or closest to you
   - Start in **Test Mode**
   - Click Create

### Get Firebase Config

1. In Firebase Console, click ⚙ (Settings) → "Project Settings"
2. Scroll to "Your apps" section
3. Copy Web app config (looks like: `apiKey: "ABC123..."`)

## 2. Update Environment (1 min)

Replace `.env` file values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

## 3. Install & Seed (2 min)

```bash
npm install
npm run seed:participant
```

This creates a test participant:
- Name: **Ravi Kumar**
- Email: **ravi.kumar@example.com**

## 4. Run Locally

```bash
npm run dev
```

Opens http://localhost:5173

## 5. Test It

### Test Certificate Generation

1. Enter: `Ravi Kumar` / `ravi.kumar@example.com`
2. Click "Verify & Continue"
3. Select Template 1 → Click "Download"
4. PDF with QR code downloads

### Test Verification

After download:
1. Certificate ID is stored in Firestore
2. Open: http://localhost:5173/verify/[CERTIFICATE_ID]
3. See verified certificate ✅

## 6. Deploy to Firebase Hosting (Optional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # Select your project, dist folder
npm run build
firebase deploy
```

Your app is now live at: `https://your-project.web.app/`

---

## Routes

| URL | Purpose |
|-----|---------|
| `/` | Generate & download certificates |
| `/verify/{certificateId}` | View certificate (public) |
| `/admin` | Upload participants, view stats |

---

## Next: Production Steps

1. **Update Firestore Rules**
   - Firebase Console → Firestore → Rules tab
   - Paste content from `firestore.rules`
   - Publish

2. **Enable Firebase Storage** (optional, for team photos)
   - Firebase Console → Storage → Create bucket

3. **Add Participants**
   - Via `/admin` page → Upload CSV
   - Or manually in firebase Console

4. **Share Verification Links**
   - Scan QR on PDF
   - Or share: `yourdomain.com/verify/{certificateId}`

---

## Troubleshooting

**Can't validate participant?**
- Check `.env` has correct Firebase credentials
- Verify participant name matches exactly

**PDF won't download?**
- Open DevTools (F12) → Console tab
- Try again, check error message
- Close other browser tabs (memory issue)

**Verification page shows error?**
- Check certificateId in URL is correct
- Ensure certificate was downloaded once

---

## File Locations

```
Key Files:
- .env                    → Firebase credentials
- src/pages/GenerateCertificate.jsx  → Main flow
- src/pages/VerifyCertificate.jsx    → Verify page
- firestore.rules               → Security rules
- README.md              → Full documentation
```

---

## Support

- Full docs: See [README.md](README.md)
- Implementation details: See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- Seed data: `npm run seed:participant`

---

**Ready?** → Run `npm run dev` and start generating certificates! 🎓
