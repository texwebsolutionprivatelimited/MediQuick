import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

const baseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID,
  measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
};

const fileBuffer = Buffer.from('test authenticated prescription content');

async function testBucket(bucketName, appName) {
  console.log(`\nTesting bucket: ${bucketName}...`);
  let app;
  try {
    app = initializeApp({ ...baseConfig, storageBucket: bucketName }, appName);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, config.VITE_ADMIN_EMAIL, config.VITE_ADMIN_PASSWORD);
    console.log("Signed in successfully as:", auth.currentUser.email);
    
    const storageRef = ref(storage, `test_uploads/auth_test_${Date.now()}.txt`);
    console.log("Uploading test file bytes...");
    const snapshot = await uploadBytes(storageRef, fileBuffer);
    console.log("Upload snapshot completed successfully.");
    const url = await getDownloadURL(snapshot.ref);
    console.log(`Download URL: ${url}`);
    return true;
  } catch (error) {
    console.error(`Bucket ${bucketName} failed:`, error.message);
    if (error.customData?.serverResponseBody) {
      console.error("Server Response:", error.customData.serverResponseBody);
    }
    return false;
  } finally {
    if (app) {
      await deleteApp(app).catch(() => {});
    }
  }
}

async function run() {
  const result1 = await testBucket("mediquick-b110b.firebasestorage.app", "app1");
  const result2 = await testBucket("mediquick-b110b.appspot.com", "app2");
  console.log("\nResults Summary:");
  console.log(`mediquick-b110b.firebasestorage.app: ${result1 ? "SUCCESS" : "FAILED"}`);
  console.log(`mediquick-b110b.appspot.com: ${result2 ? "SUCCESS" : "FAILED"}`);
}

run();
