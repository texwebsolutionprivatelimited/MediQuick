import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MedicineImage from '../components/MedicineImage';
import Card from '../components/Card';
import QuantityStepper from '../components/QuantityStepper';
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
  MdEmail,
  MdStar,
  MdStarHalf,
  MdStarBorder,
  MdDelete,
  MdEdit,
  MdRateReview,
  MdPercent
} from 'react-icons/md';
import { FaWhatsapp, FaTelegramPlane, FaFacebookF } from 'react-icons/fa';
import { useProducts } from '../context/ProductsContext';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getCouponForProduct } from '../utils/couponMatcher';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { cartItems, addToCart, updateQuantity, prescriptionUploaded, setPrescriptionFile, availableCoupons } = useCart();
  const { products: productsData, updateProductStats } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(true);

  // Find product in dataset
  const product = productsData.find(p => p.id === id);

  // Find matching coupon for this product's discount percentage
  const matchingCoupon = useMemo(() => {
    if (!product) return null;
    const discountVal = product.discountPercentage !== undefined ? product.discountPercentage : product.discount_percentage;
    return getCouponForProduct(discountVal, availableCoupons);
  }, [product, availableCoupons]);

  // Check purchase status of the current product
  useEffect(() => {
    if (!currentUser) {
      setHasPurchased(false);
      setPurchaseLoading(false);
      return;
    }

    setPurchaseLoading(true);
    if (isConfigValid && db) {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', currentUser.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let purchased = false;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'Delivered' && Array.isArray(data.items)) {
            const hasItem = data.items.some(item => String(item.id) === String(id));
            if (hasItem) {
              purchased = true;
            }
          }
        });
        setHasPurchased(purchased);
        setPurchaseLoading(false);
      }, (error) => {
        console.error("Error checking user purchases from Firestore:", error);
        setHasPurchased(false);
        setPurchaseLoading(false);
      });
      return () => unsubscribe();
    } else {
      const checkLocalPurchases = () => {
        try {
          const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
          const userOrders = stored.filter(o => o.userId === currentUser.uid);
          const purchased = userOrders.some(order => 
            order.status === 'Delivered' && 
            Array.isArray(order.items) && 
            order.items.some(item => String(item.id) === String(id))
          );
          setHasPurchased(purchased);
        } catch (e) {
          console.error("Error checking local purchases:", e);
          setHasPurchased(false);
        }
        setPurchaseLoading(false);
      };

      checkLocalPurchases();

      const handleStorageChange = (e) => {
        if (e.key === 'mediquick_local_orders') {
          checkLocalPurchases();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      
      const interval = setInterval(checkLocalPurchases, 1000);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [currentUser, id]);

  // Load reviews from Firestore or LocalStorage
  useEffect(() => {
    if (!id) return;

    if (isConfigValid && db) {
      const reviewsRef = collection(db, 'products', id, 'reviews');
      const unsubscribe = onSnapshot(reviewsRef, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Sort newest first
        list.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        setReviews(list);
      }, (error) => {
        console.error("Error fetching reviews from Firestore:", error);
      });
      return unsubscribe;
    } else {
      const local = localStorage.getItem(`mediquick_reviews_${id}`);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setReviews(parsed);
        } catch (e) {
          console.error("Error parsing local reviews:", e);
        }
      }
    }
  }, [id]);

  const recalculateStatsAndSave = async (updatedList) => {
    const visibleList = updatedList.filter(r => r.status !== 'hidden');
    const count = visibleList.length;
    let avg = 0;
    if (count > 0) {
      const sum = visibleList.reduce((acc, r) => acc + Number(r.rating), 0);
      avg = Math.round((sum / count) * 10) / 10;
    }
    await updateProductStats(id, avg, count);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (reviewRating < 1 || !reviewText.trim()) return;

    // Double check purchase permission directly on submit to prevent API/Firestore bypass
    let isPurchased = false;
    if (isConfigValid && db) {
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'Delivered' && Array.isArray(data.items)) {
            const hasItem = data.items.some(item => String(item.id) === String(id));
            if (hasItem) {
              isPurchased = true;
            }
          }
        });
      } catch (err) {
        console.error("Error verifying purchase on submit:", err);
      }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const userOrders = stored.filter(o => o.userId === currentUser.uid);
        isPurchased = userOrders.some(order => 
          order.status === 'Delivered' && 
          Array.isArray(order.items) && 
          order.items.some(item => String(item.id) === String(id))
        );
      } catch (e) {
        console.error("Error verifying local purchase on submit:", e);
      }
    }

    if (!isPurchased) {
      alert("You can only write or edit reviews for products you have purchased and had delivered.");
      return;
    }

    const existing = reviews.find(r => r.id === editingReviewId);
    const reviewData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.fullName || 'Verified Customer',
      rating: Number(reviewRating),
      title: reviewTitle.trim(),
      review: reviewText.trim(),
      status: existing ? (existing.status || 'visible') : 'visible',
      createdAt: isConfigValid && db ? new Date() : new Date().toISOString()
    };

    let newReviewsList = [];

    if (editingReviewId) {
      if (isConfigValid && db) {
        const reviewDocRef = doc(db, 'products', id, 'reviews', editingReviewId);
        await updateDoc(reviewDocRef, {
          rating: Number(reviewRating),
          title: reviewTitle.trim(),
          review: reviewText.trim(),
          createdAt: new Date()
        });
        newReviewsList = reviews.map(r => r.id === editingReviewId ? { ...r, ...reviewData } : r);
      } else {
        newReviewsList = reviews.map(r => r.id === editingReviewId ? { ...r, ...reviewData } : r);
        localStorage.setItem(`mediquick_reviews_${id}`, JSON.stringify(newReviewsList));
        setReviews(newReviewsList);
      }
    } else {
      if (isConfigValid && db) {
        const reviewsRef = collection(db, 'products', id, 'reviews');
        const docRef = await addDoc(reviewsRef, reviewData);
        newReviewsList = [{ id: docRef.id, ...reviewData }, ...reviews];
      } else {
        const newId = `rev-${Date.now()}`;
        const newReview = { id: newId, ...reviewData };
        newReviewsList = [newReview, ...reviews];
        localStorage.setItem(`mediquick_reviews_${id}`, JSON.stringify(newReviewsList));
        setReviews(newReviewsList);
      }
    }

    await recalculateStatsAndSave(newReviewsList);

    setReviewRating(0);
    setReviewTitle('');
    setReviewText('');
    setEditingReviewId(null);
    setShowReviewModal(false);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    let newReviewsList = [];

    if (isConfigValid && db) {
      try {
        const reviewDocRef = doc(db, 'products', id, 'reviews', reviewId);
        await deleteDoc(reviewDocRef);
        newReviewsList = reviews.filter(r => r.id !== reviewId);
      } catch (err) {
        console.error("Failed to delete review from Firestore:", err);
        return;
      }
    } else {
      newReviewsList = reviews.filter(r => r.id !== reviewId);
      localStorage.setItem(`mediquick_reviews_${id}`, JSON.stringify(newReviewsList));
      setReviews(newReviewsList);
    }

    await recalculateStatsAndSave(newReviewsList);
  };

  const userExistingReview = useMemo(() => {
    if (!currentUser) return null;
    return reviews.find(r => r.userId === currentUser.uid);
  }, [reviews, currentUser]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const adjustFull = rating % 1 >= 0.75 ? 1 : 0;
    const totalFull = fullStars + adjustFull;

    for (let i = 1; i <= 5; i++) {
      if (i <= totalFull) {
        stars.push(<MdStar key={i} className="text-amber-400 text-sm sm:text-base shrink-0" />);
      } else if (i === totalFull + 1 && hasHalf) {
        stars.push(<MdStarHalf key={i} className="text-amber-400 text-sm sm:text-base shrink-0" />);
      } else {
        stars.push(<MdStarBorder key={i} className="text-amber-400 text-sm sm:text-base shrink-0" />);
      }
    }
    return <div className="flex items-center">{stars}</div>;
  };

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

  // Handle automatic action recovery for guest users after login
  useEffect(() => {
    if (currentUser && product) {
      const pendingStr = localStorage.getItem('mediquick_pending_action');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending.type === 'BUY_NOW' && pending.payload.product?.id === product.id) {
            localStorage.removeItem('mediquick_pending_action');
            const targetQty = pending.payload.quantity || quantity;
            if (product.prescription_required && !prescriptionUploaded) {
              setShowPrescriptionModal(true);
            } else {
              addToCart(product, targetQty);
              navigate('/checkout', { state: { buyNowProduct: product } });
            }
          } else if (pending.type === 'ADD_TO_CART' && pending.payload.item?.id === product.id) {
            localStorage.removeItem('mediquick_pending_action');
            const targetQty = pending.payload.qty || quantity;
            addToCart(product, targetQty);
          }
        } catch (e) {
          console.error("Error executing pending action in ProductDetails:", e);
        }
      }
    }
  }, [currentUser, product, prescriptionUploaded, addToCart, navigate, quantity]);

  const handleBuyNow = () => {
    if (!currentUser) {
      localStorage.setItem('mediquick_pending_action', JSON.stringify({
        type: 'BUY_NOW',
        payload: { product, quantity }
      }));
      navigate('/login', { state: { from: location } });
      return;
    }
    if (product.prescription_required && !prescriptionUploaded) {
      setShowPrescriptionModal(true);
    } else {
      addToCart(product, quantity);
      navigate('/checkout', { state: { buyNowProduct: product } }); // Proceed straight to checkout with state
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
      navigate('/checkout', { state: { buyNowProduct: product } });
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
          <div className="product-detail-image-frame md:col-span-5 flex items-center justify-center bg-white border border-dark/5 p-4 rounded-2xl min-h-[300px] overflow-hidden select-none">
            <div className="product-image-container product-detail-image-container drop-shadow-premium">
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

              {/* Dynamic Ratings Summary */}
              <div className="flex items-center gap-2 mt-1 select-none">
                {renderStars(product.averageRating || 0)}
                <span className="text-xs font-bold text-dark/70 mt-0.5">
                  {product.averageRating ? Number(product.averageRating).toFixed(1) : "0.0"}
                </span>
                <span className="text-xs text-dark/45 font-medium mt-0.5">•</span>
                <span 
                  className="text-xs text-primary font-bold hover:underline cursor-pointer mt-0.5" 
                  onClick={() => {
                    const el = document.getElementById('reviews-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {product.reviewCount || 0} {product.reviewCount === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>
              
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

            {matchingCoupon && (
              <div className="bg-emerald-50/50 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <MdPercent />
                </div>
                <p className="text-xs font-bold text-emerald-800 leading-tight">
                  Coupon Available: <span className="font-extrabold select-all">{matchingCoupon.couponCode || matchingCoupon.code}</span> – Apply to get {matchingCoupon.discountPercentage !== undefined ? matchingCoupon.discountPercentage : matchingCoupon.discount}% OFF.
                </p>
              </div>
            )}

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
                {(() => {
                  const cartItem = cartItems.find((item) => item.id === product?.id);
                  const cartQty = cartItem ? cartItem.quantity : 0;
                  if (cartQty > 0) {
                    return (
                      <QuantityStepper
                        quantity={cartQty}
                        onIncrease={() => updateQuantity(product.id, cartQty + 1)}
                        onDecrease={() => updateQuantity(product.id, cartQty - 1)}
                        className="flex-1"
                        isLarge={true}
                      />
                    );
                  }
                  return (
                    <button
                      onClick={() => addToCart(product, quantity)}
                      disabled={product.stock <= 0}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all select-none border ${product.stock > 0 ? 'bg-white hover:bg-background border-primary/20 text-primary cursor-pointer active:scale-95' : 'bg-dark/5 text-dark/30 border-dark/5 cursor-not-allowed shadow-none'}`}
                    >
                      <MdShoppingCart className="text-base" />
                      Add to Cart
                    </button>
                  );
                })()}
                
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

      {/* 📊 REVIEWS SECTION */}
      <div id="reviews-section" className="container mx-auto px-4 mt-8">
        <div className="bg-white p-6 md:p-10 rounded-[28px] border border-dark/5 shadow-soft space-y-8">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark/5 pb-5">
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-black text-dark tracking-tight">Customer Reviews</h2>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(product.averageRating || 0)}
                <span className="text-sm font-bold text-dark/70">
                  {product.averageRating ? Number(product.averageRating).toFixed(1) : "0.0"} out of 5
                </span>
                <span className="text-xs text-dark/45">({product.reviewCount || 0} reviews)</span>
              </div>
            </div>

            {currentUser && hasPurchased && (
              <button
                onClick={() => {
                  if (userExistingReview) {
                    setReviewRating(userExistingReview.rating);
                    setReviewTitle(userExistingReview.title || '');
                    setReviewText(userExistingReview.review);
                    setEditingReviewId(userExistingReview.id);
                  } else {
                    setReviewRating(0);
                    setReviewTitle('');
                    setReviewText('');
                    setEditingReviewId(null);
                  }
                  setShowReviewModal(true);
                }}
                className="px-5 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <MdRateReview className="text-base" />
                {userExistingReview ? "Edit My Review" : "Write a Review"}
              </button>
            )}
          </div>

          {/* Reviews list */}
          <div className="space-y-4 text-left">
            {reviews.filter(rev => rev.status !== 'hidden').length === 0 ? (
              <div className="py-12 text-center text-dark/40 italic text-xs">
                No reviews yet for this product. Be the first to write a review!
              </div>
            ) : (
              reviews.filter(rev => rev.status !== 'hidden').map((rev) => {
                const isOwner = currentUser && rev.userId === currentUser.uid;
                const isAdmin = currentUser && currentUser.role === 'admin';
                
                // Format Date
                let formattedDate = 'Recent';
                if (rev.createdAt) {
                  const dateObj = rev.createdAt.toDate ? rev.createdAt.toDate() : new Date(rev.createdAt);
                  if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                  }
                }

                return (
                  <div key={rev.id} className="p-5 border border-dark/5 rounded-2xl bg-[#F8FCFC]/40 hover:bg-white transition-all shadow-sm space-y-2 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center font-bold text-xs">
                          {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-dark block leading-tight">{rev.userName}</span>
                          <span className="text-[10px] text-dark/45 font-medium">{formattedDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(rev.rating)}
                        <span className="text-xs font-bold text-dark/60">{rev.rating}/5</span>
                      </div>
                    </div>

                    {rev.title && (
                      <h4 className="font-extrabold text-dark text-xs sm:text-sm pt-1">{rev.title}</h4>
                    )}

                    <p className="text-xs text-dark/70 font-light leading-relaxed whitespace-pre-line">{rev.review}</p>

                    {(isOwner || isAdmin) && (
                      <div className="flex items-center gap-3 justify-end pt-2 border-t border-dark/5 mt-2">
                        {isOwner && hasPurchased && (
                          <button
                            onClick={() => {
                              setReviewRating(rev.rating);
                              setReviewTitle(rev.title || '');
                              setReviewText(rev.review);
                              setEditingReviewId(rev.id);
                              setShowReviewModal(true);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer bg-transparent border-none outline-none"
                          >
                            <MdEdit className="text-xs" /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:underline uppercase tracking-wider cursor-pointer bg-transparent border-none outline-none"
                        >
                          <MdDelete className="text-xs" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 🚀 REVIEW FORM MODAL POPUP */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white p-6 rounded-[28px] shadow-premium border border-dark/5 space-y-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-dark/5 pb-3">
                <h3 className="font-bold text-dark flex items-center gap-1.5 text-sm uppercase tracking-wider">
                  <MdRateReview className="text-primary text-xl" /> 
                  {editingReviewId ? "Edit My Review" : "Write a Review"}
                </h3>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="text-dark/50 hover:text-red-500 rounded-full hover:bg-background p-1.5 transition-colors cursor-pointer"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark/65 uppercase tracking-wider block">Your Rating *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHighlighted = hoveredRating >= star || (!hoveredRating && reviewRating >= star);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="text-2xl transition-all duration-150 transform hover:scale-110 cursor-pointer text-amber-400 p-0.5 bg-transparent border-0"
                        >
                          {isHighlighted ? <MdStar /> : <MdStarBorder />}
                        </button>
                      );
                    })}
                    {reviewRating > 0 && (
                      <span className="text-xs font-bold text-dark/50 ml-2">
                        {reviewRating === 5 ? "Excellent" : reviewRating === 4 ? "Good" : reviewRating === 3 ? "Average" : reviewRating === 2 ? "Below Average" : "Poor"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark/65 uppercase tracking-wider block">Review Title (Optional)</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Excellent medicine, highly recommend"
                    className="w-full px-3 py-2 bg-background border border-dark/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark/65 uppercase tracking-wider block">Review Text *</label>
                  <textarea
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review here. What did you like or dislike?"
                    className="w-full px-3 py-2 bg-background border border-dark/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark font-medium resize-none leading-relaxed"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-dark/5">
                  <button 
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="w-1/2 py-3 border border-dark/10 hover:bg-background text-dark/60 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={reviewRating < 1 || !reviewText.trim()}
                    className={`w-1/2 py-3 font-bold text-xs uppercase rounded-xl transition-all shadow-md ${reviewRating >= 1 && reviewText.trim() ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-95' : 'bg-dark/10 text-dark/35 cursor-not-allowed shadow-none'}`}
                  >
                    {editingReviewId ? "Update Review" : "Submit Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
