import dotenv from 'dotenv'
import fs from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  collection,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

const envPath = fs.existsSync('.env') ? '.env' : '.env.example'
dotenv.config({ path: envPath })

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function updateTeamsFromCSV(csvFilePath) {
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found at: ${csvFilePath}`)
    return
  }

  const csvContent = fs.readFileSync(csvFilePath, 'utf8')
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0)
  
  // Skip header
  const dataLines = lines.slice(1)
  
  const participantsRef = collection(db, 'participants')
  let updatedCount = 0;
  let notFoundCount = 0;

  console.log(`Starting to process ${dataLines.length} rows...`)

  for (let i = 0; i < dataLines.length; i++) {
    const row = dataLines[i]
    // Basic CSV splitting (assuming no commas in the values themselves)
    const [name, email, teamName, role, eventName] = row.split(',')
    
    if (!email) continue;
    
    const q = query(participantsRef, where('email', '==', email.trim()))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      // Update all matching docs (usually just 1)
      for (const docSnapshot of snapshot.docs) {
        await updateDoc(docSnapshot.ref, {
          teamName: teamName ? teamName.trim() : '',
          role: role ? role.trim() : ''
        })
      }
      console.log(`[UPDATED] ${email} -> Team: ${teamName}, Role: ${role}`)
      updatedCount++
    } else {
      console.log(`[NOT FOUND] ${email}`)
      notFoundCount++
    }
  }

  console.log('---')
  console.log(`Update complete!`)
  console.log(`Total Updated: ${updatedCount}`)
  console.log(`Total Not Found: ${notFoundCount}`)
}

const csvPath = 'c:\\Users\\samar\\Downloads\\Processed_Team_Members.csv'
updateTeamsFromCSV(csvPath)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to update teams:', error)
    process.exit(1)
  })
