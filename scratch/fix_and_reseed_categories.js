import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, updateDoc, getDocs } from 'firebase/firestore';
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

const STANDARDIZED_CATEGORIES = [
  "Medicines",
  "OTC Medicines",
  "Diabetes Care",
  "Heart Care",
  "Personal Care",
  "Baby Care",
  "Medical Devices",
  "Lab Tests",
  "Healthcare",
  "Ayurveda"
];

async function run() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const medicinesPath = path.resolve('src/data/medicines.json');
    const products = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));

    console.log("Normalizing categories in medicines.json...");
    products.forEach(p => {
      // 1. Remap Skin Care
      if (p.category === "Skin Care") {
        p.category = "Personal Care";
      }
      // 2. Remap Vitamins
      else if (p.category === "Vitamins") {
        if (p.id === "med-115") {
          p.category = "Baby Care";
        } else if (p.id === "med-120") {
          p.category = "Medicines";
        } else {
          p.category = "OTC Medicines";
        }
      }

      // Trim whitespace and capitalize first letters to normalize
      p.category = p.category.trim();
      
      // Safety check
      if (!STANDARDIZED_CATEGORIES.includes(p.category)) {
        console.warn(`[!] WARNING: Product ${p.id} ("${p.medicine_name}") has non-standard category: "${p.category}"`);
      }
    });

    // Write back to medicines.json
    fs.writeFileSync(medicinesPath, JSON.stringify(products, null, 2), 'utf8');
    console.log("Updated local medicines.json successfully.");

    // Update categories in Firestore
    console.log("Fetching existing products in Firestore...");
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    
    let updateCount = 0;
    for (const docSnap of snapshot.docs) {
      const docId = docSnap.id;
      const docData = docSnap.data();
      const localProduct = products.find(p => p.id === docId);

      if (localProduct) {
        if (docData.category !== localProduct.category) {
          console.log(`Updating category for Product ID ${docId} ("${localProduct.medicine_name}"): "${docData.category}" -> "${localProduct.category}"`);
          const docRef = doc(db, 'products', docId);
          await updateDoc(docRef, { category: localProduct.category });
          updateCount++;
        }
      } else {
        console.warn(`[!] WARNING: Firestore product ID ${docId} not found in local medicines.json`);
      }
    }
    console.log(`Firestore categories update complete. Total updated: ${updateCount} products.`);
  } catch (error) {
    console.error("Error in run script:", error);
  }
}

run();
