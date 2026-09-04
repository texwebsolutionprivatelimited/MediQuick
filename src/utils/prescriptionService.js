import { db, storage, auth, isConfigValid } from '../firebase/firebase';
import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { uploadToImageKit } from './imageUpload';

/**
 * Wraps a promise in a timeout to guarantee it resolves or rejects within ms.
 */
function withTimeout(promise, ms, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), ms)
    )
  ]);
}

/**
 * Compresses an image file to a lightweight JPEG Data URL (under 150KB)
 * to safely fit inside Firestore's 1MB document limit if remote storage is unreachable.
 */
async function compressImageToDataUrl(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      // For PDFs or non-images, use standard reader
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(new Error("Failed reading file: " + err.message));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(new Error("Failed reading file: " + err.message));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads prescription file to Firebase Storage (with ImageKit & compressed fallback)
 * @param {File} file 
 * @param {string} userId 
 * @param {function} [onProgress]
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export async function uploadPrescriptionMedia(file, userId = 'guest', onProgress = null) {
  if (!file) {
    throw new Error("No file selected.");
  }

  // 1. Try Firebase Storage first (native to Firebase project) with strict timeout
  if (isConfigValid && storage) {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `prescriptions/${userId}/${Date.now()}_${cleanFileName}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadPromise = uploadBytes(storageRef, file, {
        contentType: file.type || 'application/octet-stream'
      });
      
      const snapshot = await withTimeout(
        uploadPromise,
        10000,
        "Firebase Storage upload timed out."
      );
      
      const downloadUrl = await withTimeout(
        getDownloadURL(snapshot.ref),
        5000,
        "Getting download URL timed out."
      );
      
      if (downloadUrl) {
        return { url: downloadUrl, fileId: storagePath };
      }
    } catch (storageError) {
      console.warn("Firebase Storage upload encountered an error or timeout, trying ImageKit fallback:", storageError);
    }
  }

  // 2. Try ImageKit with timeout
  try {
    const ikPromise = uploadToImageKit(file, `prescriptions/${userId}`, onProgress);
    const result = await withTimeout(ikPromise, 8000, "ImageKit upload timed out.");
    if (result && result.url) {
      return result;
    }
  } catch (ikError) {
    console.warn("ImageKit fallback failed or timed out:", ikError);
  }

  // 3. Fallback to lightweight compressed base64 Data URL
  try {
    const compressedDataUrl = await compressImageToDataUrl(file);
    return { url: compressedDataUrl, fileId: `local-${Date.now()}` };
  } catch (dataUrlErr) {
    console.error("Local file processing failed:", dataUrlErr);
    throw new Error("Failed to process prescription file: " + dataUrlErr.message);
  }
}

/**
 * Submits a new prescription request to Firestore (prescriptions collection)
 * and dispatches submission notification.
 */
export async function submitPrescriptionRequest({
  file,
  currentUser = null,
  product = null,
  onProgress = null
}) {
  if (!file) {
    throw new Error("Please select a prescription file to upload.");
  }

  const userId = currentUser ? (currentUser.uid || currentUser.id) : (auth?.currentUser?.uid || null);
  if (!userId) {
    throw new Error("Please log in to submit your prescription for approval.");
  }

  const rxId = `rx-${Date.now()}`;
  
  // 1. Upload the file
  const { url: downloadUrl, fileId } = await uploadPrescriptionMedia(file, userId, onProgress);

  const formattedSize = file.size / 1024 / 1024 >= 1 
    ? (file.size / 1024 / 1024).toFixed(2) + " MB" 
    : (file.size / 1024).toFixed(1) + " KB";

  const timestampIso = new Date().toISOString();

  // 2. Construct standardized document
  const prescriptionData = {
    prescriptionId: rxId,
    id: rxId,
    userId: userId,
    userName: currentUser?.displayName || currentUser?.fullName || currentUser?.name || 'Customer',
    userEmail: currentUser?.email || '',
    userPhone: currentUser?.phone || currentUser?.mobileNumber || '',
    productId: product?.id || null,
    productName: product?.medicine_name || product?.name || null,
    medicine_name: product?.medicine_name || product?.name || null,
    fileName: file.name,
    fileSize: formattedSize,
    fileType: file.type || 'application/octet-stream',
    prescriptionUrl: downloadUrl,
    downloadUrl: downloadUrl,
    previewUrl: downloadUrl,
    status: 'pending',
    reviewStatus: 'pending',
    rejectionReason: '',
    uploadStatus: 'success',
    uploadTime: timestampIso,
    imagekitFileId: fileId || '',
    createdAt: isConfigValid && db ? serverTimestamp() : timestampIso,
    updatedAt: isConfigValid && db ? serverTimestamp() : timestampIso
  };

  // 3. Write to Firestore `prescriptions/{rxId}`
  if (isConfigValid && db) {
    try {
      const rxDocRef = doc(db, 'prescriptions', rxId);
      const writePromise = setDoc(rxDocRef, prescriptionData);
      await withTimeout(writePromise, 8000, "Firestore save timed out.");
    } catch (dbErr) {
      console.error("Firestore prescription write error:", dbErr);
      throw new Error(`Failed to save prescription request: ${dbErr.message}`);
    }

    // 4. Create user notification (non-blocking)
    if (userId && userId !== 'guest') {
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: userId,
          title: "Prescription Submitted",
          message: `Your prescription (${file.name}) has been uploaded and is pending review by our pharmacists.`,
          type: "prescription_pending",
          isRead: false,
          createdAt: serverTimestamp(),
          actionUrl: "/upload-prescription"
        });
      } catch (notifErr) {
        console.warn("Notification write warning:", notifErr);
      }
    }
  }

  // 5. Sync to local storage for offline resilience
  try {
    const localPrescriptions = JSON.parse(localStorage.getItem('mediquick_local_prescriptions') || '[]');
    const filtered = localPrescriptions.filter(p => p.id !== rxId);
    filtered.unshift({
      ...prescriptionData,
      createdAt: timestampIso,
      updatedAt: timestampIso
    });
    localStorage.setItem('mediquick_local_prescriptions', JSON.stringify(filtered));

    if (userId && userId !== 'guest') {
      const userRxKey = `mediquick_rx_${userId}`;
      localStorage.setItem(userRxKey, JSON.stringify({
        id: rxId,
        prescriptionId: rxId,
        name: file.name,
        fileName: file.name,
        size: formattedSize,
        fileSize: formattedSize,
        type: file.type,
        previewUrl: downloadUrl,
        downloadUrl: downloadUrl,
        prescriptionUrl: downloadUrl,
        reviewStatus: 'pending',
        status: 'pending',
        rejectionReason: ''
      }));

      const localNotifs = JSON.parse(localStorage.getItem('mediquick_local_notifications') || '[]');
      localNotifs.unshift({
        id: `local-${Date.now()}`,
        userId: userId,
        title: "Prescription Submitted",
        message: `Your prescription (${file.name}) has been uploaded and is pending review by our pharmacists.`,
        type: "prescription_pending",
        isRead: false,
        createdAt: timestampIso,
        actionUrl: "/upload-prescription"
      });
      localStorage.setItem('mediquick_local_notifications', JSON.stringify(localNotifs));
    }
  } catch (_e) {}

  return {
    ...prescriptionData,
    name: file.name,
    size: formattedSize,
    type: file.type
  };
}
