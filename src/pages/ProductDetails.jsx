import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import MedicineImage from '../components/MedicineImage';
import Card from '../components/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdShoppingCart, 
  MdFlashOn, 
  MdArrowBack,
  MdVerified,
  MdLocalPharmacy,
  MdUploadFile,
  MdClose,
  MdInfoOutline,
  MdShare,
  MdContentCopy,
  MdEmail
} from 'react-icons/md';
import { FaWhatsapp, FaTelegramPlane, FaFacebookF } from 'react-icons/fa';
import { useProducts } from '../context/ProductsContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, prescriptionUploaded, setPrescriptionFile } = useCart();
  const { products: productsData } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find product in dataset
  const product = productsData.find(p => p.id === id);

  const getShareContent = () => {
    const title = `Check out ${product?.medicine_name} on MediQuick`;
    const text = `Check out this medicine on MediQuick

Medicine
${product?.medicine_name}

Brand
${product?.brand}

Price
₹${product?.price}

${product?.description ? product.description.substring(0, 100) + '...' : ''}`;
    const url = window.location.href;
    return { title, text, url };
  };

  const handleShare = async () => {
    const { title, text, url } = getShareContent();
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
        console.log("Shared successfully using Web Share API");
      } catch (err) {
        console.warn("Web Share API error or cancelled:", err);
      }
    } else {
      setShowShareDropdown(!showShareDropdown);
    }
  };

  const handleShareOption = (option) => {
    const { title, text, url } = getShareContent();
    const fullText = `${text}\n\n${url}`;

    switch (option) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullText)}`, '_self');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      default:
        break;
    }
  };



  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-dark">Product Not Found</h2>
        <p className="text-dark/50 mt-2">The medicine profile you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/medicines')}
          className="mt-6 px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
        >
          Back to Medicines
        </button>
      </div>
    );
  }

  const handleBuyNow = () => {
    if (product.prescription_required && !prescriptionUploaded) {
      setShowPrescriptionModal(true);
    } else {
      addToCart(product, quantity);
      navigate('/checkout'); // Proceed straight to checkout
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type
      });
    }
  };

  const handleConfirmPrescription = () => {
    if (selectedFile) {
      setPrescriptionFile(selectedFile);
      setShowPrescriptionModal(false);
      addToCart(product, quantity);
      navigate('/checkout');
    }
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen pb-16 font-sans text-dark/90 text-left">
      
      {/* 🚀 BACK NAVIGATION */}
      <div className="container mx-auto px-4 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          <MdArrowBack className="text-base" /> Back to Catalog
        </button>
      </div>

      {/* 📦 DETAILS CARD */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white p-6 md:p-10 rounded-[28px] border border-dark/5 shadow-soft">
          
          {/* Left: Product Image Frame */}
          <div className="md:col-span-5 flex items-center justify-center bg-white border border-dark/5 p-4 rounded-2xl min-h-[300px] overflow-hidden select-none">
            <div className="w-full max-w-[280px] drop-shadow-premium">
              <MedicineImage product={product} />
            </div>
          </div>

          {/* Right: Product Details Information */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
            
            {/* Title, Brand, and Rx Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary-dark">
                  {product.category}
                </span>
                {product.prescription_required && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                    Rx Required
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-dark leading-snug">
                {product.medicine_name}
              </h1>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark/50 font-medium">
                <p>Brand: <span className="font-bold text-dark/80">{product.brand}</span></p>
                <p>Manufacturer: <span className="font-bold text-dark/80">{product.manufacturer}</span></p>
                <p>Pack Size: <span className="font-bold text-dark/80">{product.pack_size}</span></p>
              </div>
            </div>

            {/* Price block */}
            <div className="bg-[#F8FCFC] border border-dark/5 p-5 rounded-2xl space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-dark/45">Best Retail Price</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-black text-dark">₹{product.price}</span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm text-dark/40 line-through">MRP: ₹{product.mrp}</span>
                    <span className="bg-secondary/15 text-secondary-dark px-1.5 py-0.5 text-[10px] font-black rounded-md">
                      SAVE {product.discount_percentage}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-dark/45 font-light">Inclusive of all local pharmacy taxes.</p>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-dark/60">Status:</span>
              <span className={`font-bold ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `In Stock (Only ${product.stock} left)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-dark/60">Quantity:</span>
                <div className="flex items-center border border-dark/10 rounded-lg overflow-hidden bg-white">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1 bg-background hover:bg-dark/5 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-xs font-bold text-dark">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    className="px-3 py-1 bg-background hover:bg-dark/5 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stock <= 0}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all select-none border ${product.stock > 0 ? 'bg-white hover:bg-background border-primary/20 text-primary cursor-pointer active:scale-95' : 'bg-dark/5 text-dark/30 border-dark/5 cursor-not-allowed shadow-none'}`}
                >
                  <MdShoppingCart className="text-base" />
                  Add to Cart
                </button>
                
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all select-none ${product.stock > 0 ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-95' : 'bg-dark/10 text-dark/30 cursor-not-allowed shadow-none'}`}
                >
                  <MdFlashOn className="text-base" />
                  Buy Now
                </button>

                <button
                  onClick={handleShare}
                  className="py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all select-none border border-dark/10 bg-white hover:bg-background text-dark/70 cursor-pointer active:scale-95"
                >
                  <MdShare className="text-base" />
                  Share
                </button>
              </div>

              {/* Desktop Fallback Share Dropdown */}
              <AnimatePresence>
                {showShareDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-white border border-dark/5 shadow-premium rounded-2xl flex flex-wrap gap-2.5 items-center justify-start text-xs font-bold"
                  >
                    <span className="text-[10px] text-dark/45 uppercase tracking-wider mr-2 select-none font-black">Share via:</span>
                    
                    <button
                      onClick={() => handleShareOption('whatsapp')}
                      className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FaWhatsapp className="text-sm" /> WhatsApp
                    </button>

                    <button
                      onClick={() => handleShareOption('telegram')}
                      className="px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FaTelegramPlane className="text-sm" /> Telegram
                    </button>

                    <button
                      onClick={() => handleShareOption('facebook')}
                      className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FaFacebookF className="text-sm" /> Facebook
                    </button>

                    <button
                      onClick={() => handleShareOption('email')}
                      className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MdEmail className="text-sm" /> Email
                    </button>

                    <button
                      onClick={() => handleShareOption('copy')}
                      className="px-3 py-2 rounded-lg bg-dark/5 hover:bg-dark/10 text-dark/80 flex items-center gap-1.5 transition-colors cursor-pointer border border-dark/5"
                    >
                      <MdContentCopy className="text-sm" /> {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Future extension stub area (Strictly hidden or minimal for now) */}
            <div className="border-t border-dark/5 pt-4">
              <details className="group cursor-pointer">
                <summary className="list-none flex items-center justify-between text-xs font-bold text-dark/60 select-none group-open:text-primary">
                  <span>Product Specifications (Description, Composition)</span>
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-3 text-xs text-dark/65 font-light leading-relaxed space-y-2.5">
                  <p><strong className="font-bold text-dark/80">Active Composition:</strong> {product.composition}</p>
                  <p><strong className="font-bold text-dark/80">Product Description:</strong> {product.description}</p>
                  <p><strong className="font-bold text-dark/80">Primary Uses:</strong> {product.uses}</p>
                </div>
              </details>
            </div>

          </div>

        </div>
      {/* 🚀 PRESCRIPTION UPLOAD MODAL POPUP */}
      <AnimatePresence>
        {showPrescriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white p-6 rounded-[28px] shadow-premium border border-dark/5 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-dark/5 pb-3">
                <h3 className="font-bold text-dark flex items-center gap-1.5 text-sm uppercase tracking-wider">
                  <MdLocalPharmacy className="text-primary text-xl" /> Upload Rx Prescription
                </h3>
                <button 
                  onClick={() => setShowPrescriptionModal(false)}
                  className="text-dark/50 hover:text-red-500 rounded-full hover:bg-background p-1.5 transition-colors"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <MdInfoOutline className="text-lg shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  {product.medicine_name} is a prescription drug. A valid medical prescription must be uploaded to continue.
                </p>
              </div>

              {/* Upload Selector */}
              <div className="space-y-3">
                <label className="border-2 border-dashed border-dark/15 hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-primary/5 bg-background/50">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <MdUploadFile className="text-3xl text-dark/35 mb-2" />
                  <span className="text-xs font-bold text-dark/70">Click to upload doctor's slip</span>
                  <span className="text-[10px] text-dark/40 mt-1">PDF, JPG, PNG accepted (Max 5MB)</span>
                </label>

                {selectedFile && (
                  <div className="bg-[#E2F3F0]/40 border border-primary/10 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="truncate text-left pr-2">
                      <span className="font-bold text-dark block truncate">{selectedFile.name}</span>
                      <span className="text-[10px] text-dark/45 font-medium">{selectedFile.size}</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">Ready</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-dark/5">
                <button 
                  onClick={() => setShowPrescriptionModal(false)}
                  className="w-1/2 py-3 border border-dark/10 hover:bg-background text-dark/60 font-bold text-xs uppercase rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmPrescription}
                  disabled={!selectedFile}
                  className={`w-1/2 py-3 font-bold text-xs uppercase rounded-xl transition-all shadow-md ${selectedFile ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-95' : 'bg-dark/10 text-dark/35 cursor-not-allowed shadow-none'}`}
                >
                  Continue Buy
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

    </div>
  );
}
