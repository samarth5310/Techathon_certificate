import dotenv from 'dotenv'
import fs from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

const envPath = fs.existsSync('.env') ? '.env' : '.env.example'
dotenv.config({ path: envPath })

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error('Missing .env variables:', missing.join(', '))
  process.exit(1)
}

console.log(`Using environment file: ${envPath}`)

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const generateCertificateId = () => {
  return uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)
}

const sampleParticipant = {
  name: 'Ravi Kumar',
  email: 'ravi.kumar@example.com',
  teamName: 'CodeSpark',
  role: 'Developer',
  problemStatement: 'Smart Waste Segregation Using AI',
  teamPhotoUrl: 'https://example.com/team-photo.jpg',
  certificateGenerated: false,
  certificateId: generateCertificateId(),
  eventName: 'Techathon1.0',
  date: serverTimestamp(),
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function seedParticipant() {
  const participantsRef = collection(db, 'participants')
  const q = query(participantsRef, where('email', '==', sampleParticipant.email))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref
    await updateDoc(docRef, {
      ...sampleParticipant,
      date: serverTimestamp(),
    })
    console.log('Updated existing participant:', sampleParticipant.email)
    return
  }

  const created = await addDoc(participantsRef, sampleParticipant)
  console.log('Created participant with ID:', created.id)
}

seedParticipant()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed participant:', error.message)
    process.exit(1)
  })
