import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
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

async function seed() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Reading products from medicines.json...");
    const medicinesPath = path.resolve('src/data/medicines.json');
    const rawData = fs.readFileSync(medicinesPath, 'utf8');
    const products = JSON.parse(rawData);
    
    console.log(`Loaded ${products.length} products. Clearing existing products in Firestore...`);
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    
    let deleteCount = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
      deleteCount++;
    }
    console.log(`Deleted ${deleteCount} existing products.`);
    
    console.log("Seeding new products...");
    let seedCount = 0;
    for (const product of products) {
      const productRef = doc(db, 'products', product.id);
      await setDoc(productRef, product);
      seedCount++;
      if (seedCount % 10 === 0 || seedCount === products.length) {
        console.log(`Seeded ${seedCount}/${products.length} products...`);
      }
    }
    
    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding products:", error);
  }
}

seed();
