import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    config[key] = value.trim();
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID,
  measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
};

console.log("Firebase config loaded. Project ID:", firebaseConfig.projectId);

async function run() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Fetching orders from Firestore...");
    const querySnapshot = await getDocs(collection(db, 'orders'));
    console.log("Orders found count:", querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      console.log(`Order ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log("-----------------------------------------");
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
}

run();
