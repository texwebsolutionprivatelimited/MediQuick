import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import { 
  MdUploadFile, 
  MdDeleteOutline, 
  MdArrowBack,
  MdHelpOutline
} from 'react-icons/md';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth, isConfigValid } from '../firebase/firebase';
import { submitPrescriptionRequest } from '../utils/prescriptionService';

export default function UploadPrescription() {
  const navigate = useNavigate();
  const { prescriptionFile, setPrescriptionFile } = useCart();
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(""); // "scanning" | "uploading" | "saving"
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Listen to Firestore document updates to update the local status in real-time
  useEffect(() => {
    if (prescriptionFile?.id && isConfigValid && db) {
      const docRef = doc(db, 'prescriptions', prescriptionFile.id);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentStatus = (data.status || data.reviewStatus || 'pending').toLowerCase();
          setPrescriptionFile(prev => {
            if (!prev || prev.id !== prescriptionFile.id) return prev;
            return {
              ...prev,
              reviewStatus: currentStatus,
              status: currentStatus,
              rejectionReason: data.rejectionReason || ''
            };
          });
        }
      }, (err) => {
        console.error("Firestore onSnapshot error in UploadPrescription:", err);
      });
      return unsubscribe;
    }
  }, [prescriptionFile?.id, setPrescriptionFile]);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setSuccessMsg("");
    
    const lowerName = file.name.toLowerCase();
    const fileExtension = '.' + lowerName.split('.').pop();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    
    // 1. Validate File Extension
    if (!allowedExtensions.includes(fileExtension)) {
      setError("Unsupported file type. Please upload a PDF, JPG, JPEG, PNG, or WEBP file.");
      return;
    }
    
    // 2. Validate File Size (5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size exceeds the 5 MB limit. Please upload a smaller file.");
      return;
    }
    
    // Start scanning & uploading animation
    setIsUploading(true);
    setIsScanning(true);
    setUploadStage("scanning");
    setUploadProgress(0);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsScanning(false);
    setUploadStage("uploading");
    
    try {
      const savedRx = await submitPrescriptionRequest({
        file,
        currentUser: auth?.currentUser || null,
        onProgress: setUploadProgress
      });

      setSuccessMsg("Prescription uploaded successfully. Waiting for approval.");
      setPrescriptionFile(savedRx);
    } catch (err) {
      console.error("Prescription upload error:", err);
      setError(`Upload failed: ${err.message}. Please check your connection and try again.`);
      setPrescriptionFile(null);
    } finally {
      setIsUploading(false);
      setUploadStage("");
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Helper to get normalized status state
  const getNormalizedStatus = () => {
    const raw = (prescriptionFile?.status || prescriptionFile?.reviewStatus || 'pending').toLowerCase();
    if (raw === 'approved') return 'approved';
    if (raw === 'rejected') return 'rejected';
    return 'pending';
  };

  const normStatus = getNormalizedStatus();

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-10 font-sans text-dark/90 text-left">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Back Link */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
          >
            <MdArrowBack className="text-base" /> Go Back
          </button>
        </div>

        <h1 className="text-2xl font-extrabold text-[#063B44] mb-8">Upload Prescription</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload box */}
          <div className="md:col-span-7 space-y-6">
            <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-[24px]">
              
              {isUploading ? (
                uploadStage === "scanning" ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 border-4 border-t-primary border-primary/20 rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-primary animate-pulse uppercase tracking-wider">Analyzing medical prescription...</p>
                    <p className="text-[10px] text-dark/50 font-semibold">Scanning for doctor stamp, patient details, and Rx signature...</p>
                  </div>
                ) : uploadStage === "uploading" ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 border-4 border-t-primary border-primary/20 rounded-full animate-spin mx-auto flex items-center justify-center text-[10px] font-black text-primary">
                      {uploadProgress}%
                    </div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Uploading file... ({uploadProgress}%)</p>
                    <p className="text-[10px] text-dark/50 font-semibold">Transferring prescription to secure storage...</p>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 border-4 border-t-primary border-primary/20 rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-primary uppercase tracking-wider animate-pulse">Saving Information...</p>
                    <p className="text-[10px] text-dark/50 font-semibold">Registering metadata in medical database...</p>
                  </div>
                )
              ) : prescriptionFile ? (
                <div className="text-center py-4 space-y-5">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#063B44] text-base">Prescription Uploaded Successfully</h3>
                    <p className="text-xs text-dark/50">File: <span className="font-bold text-dark">{prescriptionFile.name}</span> ({prescriptionFile.size})</p>
                  </div>
                  
                  {prescriptionFile.type?.startsWith('image/') || prescriptionFile.previewUrl ? (
                    <div className="w-32 h-32 mx-auto rounded-[16px] overflow-hidden border border-dark/10 shadow-inner select-none relative bg-slate-50 flex items-center justify-center">
                      <img src={prescriptionFile.previewUrl || prescriptionFile.downloadUrl} className="w-full h-full object-cover" alt="Prescription Preview" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                      <MdUploadFile />
                    </div>
                  )}

                  <div className="p-5 rounded-2xl bg-slate-50/50 border border-dark/5 space-y-4">
                    {/* Status Indicator */}
                    <div className="flex items-center justify-between text-xs border-b border-dark/5 pb-3">
                      <span className="font-bold text-dark/60 uppercase tracking-wider">Review Status</span>
                      {normStatus === 'approved' && (
                        <span className="bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1 animate-pulse">
                          🟢 Approved
                        </span>
                      )}
                      {normStatus === 'rejected' && (
                        <span className="bg-red-50 text-red-700 font-extrabold px-3 py-1 rounded-full border border-red-100 flex items-center gap-1 animate-pulse">
                          🔴 Rejected
                        </span>
                      )}
                      {normStatus === 'pending' && (
                        <span className="bg-amber-50 text-amber-700 font-extrabold px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse">
                          🟡 Pending Approval
                        </span>
                      )}
                    </div>

                    {/* Date and details */}
                    <div className="space-y-2.5 text-xs text-left">
                      <div className="flex justify-between">
                        <span className="text-dark/50 font-medium">Uploaded:</span>
                        <span className="font-bold text-dark/80">Today</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark/50 font-medium">Review Time:</span>
                        <span className="font-bold text-dark/80">Usually within 10–15 minutes</span>
                      </div>
                    </div>

                    {/* Dynamic Status Content */}
                    {normStatus === 'approved' && (
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/60 text-center space-y-3">
                        <p className="text-xs text-emerald-800 font-bold">Your prescription has been verified.</p>
                        <button 
                          onClick={() => navigate('/')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    )}

                    {normStatus === 'rejected' && (
                      <div className="p-4 bg-red-50/50 rounded-xl border border-red-100/60 text-center space-y-3">
                        <div className="space-y-1 text-left">
                          <p className="text-xs text-red-800 font-bold">Reason for Rejection:</p>
                          <p className="text-[11px] text-red-700/90 font-medium italic">
                            {prescriptionFile.rejectionReason || "Image blurred / Missing doctor signature / Invalid prescription"}
                          </p>
                        </div>
                        <p className="text-[10px] text-red-800 font-semibold">Please upload a new prescription.</p>
                        <button 
                          onClick={() => {
                            setPrescriptionFile(null);
                            setError("");
                            setSuccessMsg("");
                          }}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Upload New Prescription
                        </button>
                      </div>
                    )}

                    {normStatus === 'pending' && (
                      <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-100/40 text-center">
                        <p className="text-[11px] text-amber-800/90 leading-relaxed font-semibold">
                          Our certified pharmacists are currently verifying your prescription. We will notify you once approved.
                        </p>
                      </div>
                    )}
                  </div>

                  {successMsg && (
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold py-2 px-3 rounded-xl border border-emerald-100 max-w-xs mx-auto">
                      {successMsg}
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-700 text-xs font-bold py-2 px-3 rounded-xl border border-red-100 max-w-xs mx-auto text-center">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 justify-center pt-2">
                    {normStatus !== 'approved' && (
                      <button 
                        onClick={() => {
                          setPrescriptionFile(null);
                          setError("");
                          setSuccessMsg("");
                        }}
                        className="px-4 py-2 border border-red-100 hover:bg-red-50 text-red-500 font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1 select-none cursor-pointer"
                      >
                        <MdDeleteOutline className="text-base" /> Remove
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(-1)}
                      className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 select-none cursor-pointer"
                    >
                      Return to Checkout
                    </button>
                  </div>
                </div>
              ) : (
                <form 
                  onDragEnter={handleDrag} 
                  onDragOver={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDrop={handleDrop}
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-4"
                >
                  {error && (
                    <div className="bg-red-50 text-red-700 text-xs font-bold py-2 px-4 rounded-xl border border-red-100 text-center">
                      {error}
                    </div>
                  )}
                  
                  <label 
                    className={`border-2 border-dashed rounded-[20px] p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      dragActive ? 'border-primary bg-primary/5' : 'border-dark/15 hover:border-primary hover:bg-primary/5 bg-background/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <MdUploadFile className="text-4xl text-dark/35 mb-2" />
                    <span className="text-xs font-bold text-dark/70">Drag & Drop prescription here</span>
                    <span className="text-[10px] text-dark/45 mt-1">or click to browse files</span>
                    <span className="text-[9px] text-dark/40 mt-1 uppercase tracking-wider">PDF, JPG, JPEG, PNG up to 5MB</span>
                  </label>
                </form>
              )}

            </Card>
          </div>

          {/* Right Column: Guidelines */}
          <div className="md:col-span-5 space-y-6">
            <Card hoverable={false} padding="p-5" className="bg-white border border-dark/5 shadow-soft rounded-[20px] space-y-4">
              <h3 className="font-bold text-xs text-dark uppercase tracking-wider flex items-center gap-1 border-b border-dark/5 pb-3">
                <MdHelpOutline className="text-primary text-base" /> Rx Guidelines
              </h3>
              
              <ul className="space-y-3 text-xs text-dark/70 font-light leading-relaxed text-left list-none">
                <li className="flex gap-2 items-start">
                  <span className="text-primary text-sm font-bold mt-0.5">▪</span>
                  <span>Prescription should clearly show the **Doctor's Name**, Registration Number, and signature stamp.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-primary text-sm font-bold mt-0.5">▪</span>
                  <span>**Patient's Name** and **Date of Prescription** must be clearly legible.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-primary text-sm font-bold mt-0.5">▪</span>
                  <span>Avoid uploading cropped, blurred, or faded copies. Make sure all medicine details are fully readable.</span>
                </li>
              </ul>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
