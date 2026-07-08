import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import { 
  MdUploadFile, 
  MdCheckCircle, 
  MdDeleteOutline, 
  MdArrowBack,
  MdHelpOutline,
  MdLocalPharmacy
} from 'react-icons/md';

export default function UploadPrescription() {
  const navigate = useNavigate();
  const { prescriptionFile, setPrescriptionFile } = useCart();
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setPrescriptionFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      type: file.type
    });
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
              
              {prescriptionFile ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                    <MdCheckCircle />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-dark text-sm uppercase tracking-wider">Prescription Loaded</h3>
                    <p className="text-xs text-dark/60 font-semibold">{prescriptionFile.name}</p>
                    <p className="text-[10px] text-dark/45 font-medium">{prescriptionFile.size}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-4 justify-center">
                    <button 
                      onClick={() => setPrescriptionFile(null)}
                      className="px-4 py-2 border border-red-100 hover:bg-red-50 text-red-500 font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1 select-none"
                    >
                      <MdDeleteOutline className="text-base" /> Remove
                    </button>
                    <button 
                      onClick={() => navigate(-1)}
                      className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 select-none"
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
                  <label 
                    className={`border-2 border-dashed rounded-[20px] p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      dragActive ? 'border-primary bg-primary/5' : 'border-dark/15 hover:border-primary hover:bg-primary/5 bg-background/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <MdUploadFile className="text-4xl text-dark/35 mb-2" />
                    <span className="text-xs font-bold text-dark/70">Drag & Drop prescription here</span>
                    <span className="text-[10px] text-dark/45 mt-1">or click to browse files</span>
                    <span className="text-[9px] text-dark/40 mt-1 uppercase tracking-wider">PDF, JPG, PNG up to 5MB</span>
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
              
              <div className="bg-[#E2F3F0]/40 p-4 rounded-xl border border-primary/10 text-[10px] text-dark/65 flex items-start gap-2.5">
                <MdLocalPharmacy className="text-primary text-base shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Our certified medical pharmacists will review your uploaded prescription file within 10 minutes of placing the order.
                </p>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
