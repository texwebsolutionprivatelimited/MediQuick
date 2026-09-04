import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Card from '../components/Card';
import Button from '../components/Button';
import QuantityStepper from '../components/QuantityStepper';
import { useProducts } from '../context/ProductsContext';
import { 
  MdUploadFile, 
  MdKeyboardArrowRight, 
  MdStar, 
  MdShoppingCart,
  MdMailOutline,
  MdArrowUpward,
  MdRoom,
  MdExpandMore,
  MdCall,
  MdCheckCircle,
  MdFavorite,
  MdFavoriteBorder,
  MdVerified,
  MdLocalShipping,
  MdMedicalServices,
  MdLocalOffer,
  MdAssignmentReturn,
  MdPayment
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import MedicineImage from '../components/MedicineImage';
import { useWishlist } from '../context/WishlistContext';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, onSnapshot, collectionGroup } from 'firebase/firestore';

// Data sets matching the requested 10 categories
const CATEGORIES = [
  { id: 'cat1', name: 'Medicines', icon: '💊', query: 'prescription' },
  { id: 'cat3', name: 'Personal Care', icon: '🧼', query: 'personalcare' },
  { id: 'cat4', name: 'Baby Care', icon: '🧸', query: 'babycare' },
  { id: 'cat5', name: 'Diabetes Care', icon: '🩸', query: 'diabetes' },
  { id: 'cat6', name: 'Heart Care', icon: '❤️', query: 'heart' },
  { id: 'cat7', name: 'Ayurveda', icon: '🌿', query: 'ayurvedic' },
  { id: 'cat8', name: 'Lab Tests', icon: '🔬', query: 'labtests' },
  { id: 'cat9', name: 'Devices', icon: '⌚', query: 'devices' },
  { id: 'cat10', name: 'Vitamins', icon: '🥤', query: 'supplements' }
];

// Custom CountUp Component using IntersectionObserver and requestAnimationFrame
function CountUp({ end, duration = 1500, suffix = "" }) {
  const [count, setCount] = useState(0);
  const elementRef = React.useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTimestamp = null;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [end, duration, hasAnimated]);

  return <span ref={elementRef}>{count.toLocaleString()}{suffix}</span>;
}

const fadeUpVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const glassCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};


const FAQS = [
  {
    question: "How can I order medicines?",
    answer: "You can search for the medicine using our search bar, add the desired items to your cart, upload a prescription if required (marked with Rx), enter your delivery address, and proceed to checkout using secure UPI, card, or Cash on Delivery options."
  },
  {
    question: "How does 1 Hour Delivery work?",
    answer: "If your delivery address falls within a 5 KM radius of our pharmacy distribution center, your order is assigned for priority dispatch. The courier delivers it directly to your address in under 60 minutes."
  },
  {
    question: "Can I upload prescriptions?",
    answer: "Yes, you can upload doctor prescriptions by taking a photo on your camera or uploading a PDF/image from your device in the designated prescription upload zones on our homepage or checkout page."
  },
  {
    question: "How do I cancel an order?",
    answer: "Orders can be canceled directly from the Order Tracking page or by contacting our 24x7 support team on WhatsApp before the dispatch process begins."
  },
  {
    question: "How do refunds work?",
    answer: "Upon cancellation or return of unopened strips/bottles within 14 days, refunds are initiated instantly and credited back to your original payment source (UPI, net banking, or cards) within 3-5 business days."
  }
];

function ProductSection({ title, products, addToCart: propAddToCart, navigate, addingProductId, setAddingProductId, viewMoreUrl, alwaysShowViewMore = false, customCount, limitCount, hideCount = false, children }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { cartItems, addToCart, updateQuantity } = useCart();

  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallMobile(window.innerWidth <= 320);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!products || products.length === 0) return null;
  
  const limit = limitCount || (isSmallMobile ? 4 : 10);
  const displayedProducts = products.slice(0, limit);
  
  return (
    <section className="py-12 max-[320px]:py-5 bg-white border-t border-dark/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8 max-[320px]:mb-4 flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-dark text-left">{title}</h2>
          {!hideCount && (
            <span className="text-xs font-semibold text-dark/45">{customCount ? customCount : `${products.length} Products`}</span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 pb-4 select-none">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="w-full relative bg-white border border-dark/5 rounded-xl p-3.5 sm:p-4 shadow-soft premium-card-hover flex flex-col justify-between h-full min-h-[340px]"
            >
              {product.prescription_required && (
                <span className="absolute left-3 top-3 bg-red-50 text-red-600 border border-red-200/50 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider z-10 select-none">
                  Rx Required
                </span>
              )}

              {/* Wishlist Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-dark/5 shadow-sm flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-110 cursor-pointer text-dark/45 hover:text-red-500"
              >
                {isInWishlist(product.id) ? (
                  <MdFavorite className="text-lg text-red-500 animate-heartBeat" />
                ) : (
                  <MdFavoriteBorder className="text-lg" />
                )}
              </button>

              <div 
                onClick={() => navigate(`/product/${product.id}`)}
                className="cursor-pointer flex flex-col flex-grow animate-fadeIn"
              >
                <div className="product-image-container max-[320px]:w-[120px] max-[320px]:h-[120px] max-[320px]:p-2.5 mb-3">
                  <MedicineImage product={product} />
                </div>
                <div className="text-left flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-dark text-xs sm:text-sm line-clamp-2 hover:text-primary transition-colors h-10 overflow-hidden leading-tight text-ellipsis">
                      {product.medicine_name}
                    </h4>
                    <div className="space-y-0.5 mt-1">
                      <p className="text-[10px] text-dark/45 font-semibold truncate leading-none">{product.brand}</p>
                      <p className="text-[9px] text-dark/55 truncate leading-none">{product.pack_size}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 mt-2.5 border-t border-dark/5 text-left shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap h-5">
                  <span className="text-sm font-extrabold text-dark">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <>
                      <span className="text-[10px] text-dark/40 line-through">₹{product.mrp}</span>
                      <span className="bg-secondary/10 text-secondary-dark px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none animate-pulse">
                        {product.discount_percentage}% OFF
                      </span>
                    </>
                  )}
                </div>
                
                <p className={`text-[9px] font-bold mt-1.5 leading-none ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </p>

                {(() => {
                  const cartItem = cartItems.find((item) => item.id === product.id);
                  const cartQty = cartItem ? cartItem.quantity : 0;
                  if (cartQty > 0) {
                    return (
                      <QuantityStepper
                        quantity={cartQty}
                        onIncrease={() => updateQuantity(product.id, cartQty + 1)}
                        onDecrease={() => updateQuantity(product.id, cartQty - 1)}
                        className="w-full mt-2.5"
                      />
                    );
                  }
                  const isAdding = addingProductId === product.id;
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingProductId(product.id);
                        setTimeout(() => {
                          addToCart(product, 1);
                          setAddingProductId(null);
                        }, 400);
                      }}
                      disabled={product.stock <= 0 || isAdding}
                      className={`w-full mt-2.5 py-2 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all select-none shadow-sm ${
                        isAdding
                          ? 'bg-emerald-600 text-white border-emerald-600 scale-[0.98] animate-successPop'
                          : product.stock > 0 
                            ? 'bg-primary/5 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary cursor-pointer' 
                            : 'bg-dark/5 text-dark/30 border border-dark/5 cursor-not-allowed'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <MdCheckCircle className="text-xs animate-successPop" />
                          Added
                        </>
                      ) : (
                        <>
                          <MdShoppingCart className="text-xs" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {viewMoreUrl && (alwaysShowViewMore || products.length > limit) && (
          <div className="flex justify-center mt-8 max-[320px]:mt-4">
            <Link
              to={viewMoreUrl}
              className="text-primary hover:underline text-xs sm:text-sm font-semibold flex items-center gap-0.5 select-none cursor-pointer"
            >
              View More <MdKeyboardArrowRight className="text-lg" />
            </Link>
          </div>
        )}

        {children && (
          <div className="flex justify-center mt-4">
            {children}
          </div>
        )}

      </div>
    </section>
  );
}

export default function Home() {
  const { currentUser } = useAuth();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { 
    detectLocation, 
    loading: locLoading, 
    locationChoice, 
    setLocationChoice,
    isLocationModalOpen,
    setIsLocationModalOpen,
    address
  } = useLocation();
  const navigate = useNavigate();
  const { products: productsData, categories } = useProducts();
  const { systemSettings } = useSettings();

  // Search filter
  const [searchVal, setSearchVal] = useState("");

  // Mouse Parallax coordinates state
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left - width / 2) / (width / 2); // Ranges -1 to 1
    const y = (clientY - top - height / 2) / (height / 2); // Ranges -1 to 1
    setMouseCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseCoords({ x: 0, y: 0 });
  };

  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    if (isConfigValid && db) {
      const ordersRef = collection(db, 'orders');
      const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), orderId: doc.id });
        });
        setAllOrders(list);
      }, (error) => {
        console.error("Error listening to all orders:", error);
      });
      return unsubscribe;
    } else {
      const fetchLocalOrders = () => {
        const stored = localStorage.getItem('mediquick_local_orders');
        if (stored) {
          setAllOrders(JSON.parse(stored));
        } else {
          setAllOrders([]);
        }
      };
      fetchLocalOrders();
      const handleStorage = (e) => {
        if (e.key === 'mediquick_local_orders') {
          fetchLocalOrders();
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  // Filter products by category dynamically
  const activeCategories = (categories || []).filter(cat => cat.status !== 'inactive');
  const firstTwoCategories = activeCategories.slice(0, 2);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Best Selling Products logic based on rolling 30-day sales window
  const bestSellingProducts = useMemo(() => {
    const counts30Days = {};
    const countsAllTime = {};
    const lastOrderDates = {};
    
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - THIRTY_DAYS_MS;

    allOrders.forEach(order => {
      if (order.status === 'Cancelled') return;

      const orderTime = new Date(order.orderDate).getTime();
      const isWithin30Days = orderTime >= cutoffTime;
      const items = order.items || [];
      
      items.forEach(item => {
        if (!item.id) return;
        
        // Cumulative count in rolling 30-day window
        if (isWithin30Days) {
          counts30Days[item.id] = (counts30Days[item.id] || 0) + (item.quantity || 0);
        }
        
        // Cumulative count overall (for tie-breaking/fillers)
        countsAllTime[item.id] = (countsAllTime[item.id] || 0) + (item.quantity || 0);

        if (!lastOrderDates[item.id] || orderTime > lastOrderDates[item.id]) {
          lastOrderDates[item.id] = orderTime;
        }
      });
    });

    const sorted = [...productsData].map(p => {
      const count30 = counts30Days[p.id] || 0;
      const countAll = countsAllTime[p.id] || 0;
      const lastOrderTime = lastOrderDates[p.id] || 0;
      return { product: p, count30, countAll, lastOrderTime };
    });

    sorted.sort((a, b) => {
      // 1. Sort by 30-day sales descending
      if (b.count30 !== a.count30) {
        return b.count30 - a.count30;
      }
      // 2. Tie-break/fill by all-time sales descending
      if (b.countAll !== a.countAll) {
        return b.countAll - a.countAll;
      }
      // 3. Sort by most recent purchase date descending
      if (b.lastOrderTime !== a.lastOrderTime) {
        return b.lastOrderTime - a.lastOrderTime;
      }
      return 0;
    });

    return sorted.map(s => s.product);
  }, [allOrders, productsData, tick]);
  
  // Custom Location Permission Popup State
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  const [allReviews, setAllReviews] = useState([]);

  useEffect(() => {
    if (isConfigValid && db) {
      try {
        const reviewsRef = collectionGroup(db, 'reviews');
        const unsubscribe = onSnapshot(reviewsRef, (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({ id: docSnap.id, productId: docSnap.ref.parent.parent?.id, ...data });
          });
          setAllReviews(list);
        }, (error) => {
          console.error("Error listening to all reviews via collectionGroup:", error);
        });
        return unsubscribe;
      } catch (e) {
        console.error("Error setting up collectionGroup reviews listener:", e);
      }
    } else {
      const fetchLocalReviews = () => {
        const list = [];
        productsData.forEach((prod) => {
          const local = localStorage.getItem(`mediquick_reviews_${prod.id}`);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              parsed.forEach(r => {
                list.push({ ...r, productId: prod.id });
              });
            } catch (e) {
              console.error("Error parsing local reviews in Home page:", e);
            }
          }
        });
        setAllReviews(list);
      };

      fetchLocalReviews();
      const interval = setInterval(fetchLocalReviews, 2000);
      return () => clearInterval(interval);
    }
  }, [productsData]);

  const activeReviews = useMemo(() => {
    const list = allReviews.filter(r => r.status !== 'hidden' && r.review && r.review.trim() !== '');
    list.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    return list;
  }, [allReviews]);



  // Testimonials Carousel auto-slide index
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Stable list of products for testimonials (memoized and changes on activeTestimonial)
  const stableProducts = useMemo(() => {
    if (!productsData || productsData.length === 0) return [];
    return [...productsData].sort((a, b) => a.id.localeCompare(b.id));
  }, [productsData]);

  const selectedTestimonialProducts = useMemo(() => {
    if (stableProducts.length === 0) return [];
    const result = [];
    const offset = activeTestimonial % stableProducts.length;
    for (let i = 0; i < stableProducts.length; i++) {
      const p = stableProducts[(offset + i) % stableProducts.length];
      if (!result.includes(p)) {
        result.push(p);
      }
      if (result.length === 6) break;
    }
    return result;
  }, [stableProducts, activeTestimonial]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Quick Callback Form
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackSuccess, setCallbackSuccess] = useState(false);

  const getWhatsappUrl = () => {
    let targetPhone = "919876543210"; // Default support phone fallback
    const userPhone = currentUser?.phone || currentUser?.mobileNumber;
    if (userPhone) {
      const cleanPhone = userPhone.replace(/[\s\-+]/g, "");
      targetPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
    }

    const baseText = currentUser 
      ? `Hi ${currentUser.displayName || currentUser.fullName || 'Customer'}, welcome to MediQuick! This is your automated prescription assistant.`
      : "Hi, welcome to MediQuick! This is your automated prescription assistant.";
      
    return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(baseText)}`;
  };

  // Check and query location permission states on load (only after login)
  useEffect(() => {
    if (currentUser && !address && !locLoading && !isLocationModalOpen) {
      setShowLocationPopup(true);
    } else {
      setShowLocationPopup(false);
    }
  }, [currentUser, address, locLoading, isLocationModalOpen]);

  // Auto-slide Testimonials Carousel every 5 seconds
  useEffect(() => {
    if (activeReviews.length <= 1) return;
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % activeReviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeReviews.length]);

  // Scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAllowLocation = () => {
    setShowLocationPopup(false);
    detectLocation(
      // On Success
      () => {},
      // On Failure (e.g. denied permission) -> immediately show manual location Modal
      () => {
        setLocationChoice('manual');
        setIsLocationModalOpen(true);
      }
    );
  };

  const handleEnterLocationManually = () => {
    setShowLocationPopup(false);
    setLocationChoice('manual');
    setIsLocationModalOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleCallbackSubmit = (e) => {
    e.preventDefault();
    if (callbackName.trim() && callbackPhone.trim()) {
      setCallbackSuccess(true);
      setTimeout(() => {
        setCallbackName("");
        setCallbackPhone("");
        setCallbackSuccess(false);
      }, 4000);
    }
  };

  return (
    <div className="relative bg-[#F8FCFC] min-h-screen text-dark/95 selection:bg-primary/20">
      
      {/* 🚀 2. LOCATION PERMISSION POPUP (Centered overlay) */}
      <AnimatePresence>
        {showLocationPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/10 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white p-6 rounded-[24px] shadow-premium text-center border border-dark/5 animate-entrance"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-3xl mb-4">
                <MdRoom />
              </div>
              <h3 className="text-xl font-bold text-dark">Allow MediQuick to access your location?</h3>
              <p className="text-xs text-dark/65 leading-relaxed font-light mt-2 max-w-sm mx-auto">
                Enable your location to view medicines available near you and receive faster 1-Hour delivery.
              </p>
              
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={handleAllowLocation}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none"
                >
                  Allow Location
                </button>
                <button
                  onClick={handleEnterLocationManually}
                  className="w-full py-3 hover:bg-background text-dark/60 hover:text-dark font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none bg-transparent"
                >
                  Enter Location Manually
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 3. PREMIUM HERO REDESIGN */}
      <section 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden pt-4 sm:pt-6 md:pt-8 pb-8 md:pb-12 text-center md:text-left select-none border-b border-dark/5 bg-gradient-to-tr from-[#F4FAF9] via-[#EDF8F6] to-[#E2F4F0] max-[320px]:pt-2 max-[320px]:pb-4"
      >
        {/* Abstract Medical Background Shapes */}
        <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-primary/5 blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-primary/5 blur-xl pointer-events-none" />
 
        <div className="container mx-auto px-4 lg:px-6 w-full relative z-10">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-6 md:gap-8 lg:gap-12 items-center justify-between">
            
            {/* Left Column: Heading & CTAs */}
            <div className="w-full md:w-[47%] xl:w-[52%] flex flex-col items-center md:items-start text-center md:text-left space-y-3 sm:space-y-4">
              <motion.h1
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="text-[28px] min-[360px]:text-4xl sm:text-5xl lg:text-6.5xl font-black tracking-tight text-[#063B44] leading-[1.1] text-center md:text-left hero-heading-320"
              >
                Trusted Medicines, <br />
                <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark xl:inline-block xl:whitespace-nowrap">Delivered to Your Doorstep.</span>
              </motion.h1>

              <style>{`
                .hero-desc-short {
                  display: none;
                }
                @keyframes floatSlow {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-8px) rotate(1.5deg); }
                }
                @keyframes floatMedium {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-6px) rotate(-1.5deg); }
                }
                @keyframes floatFast {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-4px) rotate(0.8deg); }
                }
                .animate-float-slow {
                  animation: floatSlow 6s ease-in-out infinite;
                }
                .animate-float-medium {
                  animation: floatMedium 5s ease-in-out infinite;
                }
                .animate-float-fast {
                  animation: floatFast 4s ease-in-out infinite;
                }
                
                .hero-badges-container {
                  position: absolute;
                  inset: 0;
                  z-index: 20;
                  pointer-events: none;
                }
                .hero-badge-wrap {
                  position: absolute;
                  z-index: 20;
                  pointer-events: auto;
                }
                .hb-pos-1 { top: 4%; left: 4%; }
                .hb-pos-2 { top: 4%; right: 4%; }
                .hb-pos-3 { top: 45%; left: 4%; }
                .hb-pos-4 { top: 45%; right: 4%; }
                .hb-pos-5 { bottom: 4%; left: 50%; transform: translateX(-50%); }

                /* Default Styles for Hero Badges */
                .hero-badge-pill {
                  background-color: rgba(255, 255, 255, 0.95);
                  border: 1px solid #E2F3F0;
                  box-shadow: 0 8px 30px rgba(0,150,136,0.08);
                  padding: 7px 10px;
                  border-radius: 9999px;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  transition: transform 300ms ease;
                }
                .hero-badge-pill:hover {
                  transform: scale(1.03);
                }
                .hero-badge-icon-wrap {
                  width: 22px;
                  height: 22px;
                  border-radius: 9999px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
                }
                .hero-badge-icon-svg {
                  width: 11px;
                  height: 11px;
                }
                .hero-badge-title {
                  display: block;
                  font-size: 8.5px;
                  font-weight: 900;
                  color: #063B44;
                  text-transform: uppercase;
                  line-height: 1;
                  letter-spacing: 0.05em;
                }
                .hero-badge-subtitle {
                  display: block;
                  font-size: 6.5px;
                  color: rgba(6, 59, 68, 0.55);
                  font-weight: 500;
                  line-height: 1;
                }

                @media (min-width: 451px) {
                  .hero-badge-wrap {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    transition: opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
                  }
                  .hb-pos-5 {
                    transform: translateX(-50%) scale(1) translateY(0);
                  }
                }

                /* Mobile Sizing: Mobile-S, Mobile-M, Mobile-L viewports */
                @media (max-width: 450px) {
                  .hero-desc-full {
                    display: none !important;
                  }
                  .hero-desc-short {
                    display: inline !important;
                  }
                  .hero-heading-320 {
                    font-size: 21px !important;
                    font-weight: 900 !important;
                    line-height: 1.22 !important;
                    letter-spacing: -0.025em !important;
                  }
                  .hero-description-320 {
                    font-size: 12px !important;
                    line-height: 1.45 !important;
                    letter-spacing: -0.15px !important;
                  }
                  .hero-doctor-card-container {
                    aspect-ratio: 4 / 5 !important;
                    border-width: 2px !important;
                    padding: 0 !important;
                  }
                  .hero-doctor-img {
                    object-fit: contain !important;
                    object-position: center top !important;
                    width: 100% !important;
                    height: 100% !important;
                  }
                  .hero-badges-container {
                    position: absolute !important;
                    inset: 0 !important;
                    display: block !important;
                    transform: none !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 20 !important;
                    pointer-events: none !important;
                  }
                  .hero-badge-wrap {
                    position: absolute !important;
                    pointer-events: auto !important;
                    z-index: 20 !important;
                    opacity: 1 !important;
                    transform: scale(1) translateY(0) !important;
                    transition: opacity 200ms ease, transform 200ms ease !important;
                  }
                  .hb-pos-1 { 
                    top: 4% !important; 
                    left: 4% !important; 
                    right: auto !important; 
                    bottom: auto !important; 
                    transform: none !important; 
                  }
                  .hb-pos-2 { 
                    top: 4% !important; 
                    right: 4% !important; 
                    left: auto !important; 
                    bottom: auto !important; 
                    transform: none !important; 
                  }
                  .hb-pos-3 { 
                    top: 45% !important; 
                    left: 4% !important; 
                    right: auto !important; 
                    bottom: auto !important; 
                    transform: none !important; 
                  }
                  .hb-pos-4 { 
                    top: 45% !important; 
                    right: 4% !important; 
                    left: auto !important; 
                    bottom: auto !important; 
                    transform: none !important; 
                  }
                  .hb-pos-5 { 
                    bottom: 4% !important; 
                    left: 50% !important; 
                    transform: translateX(-50%) scale(1) translateY(0) !important; 
                    top: auto !important; 
                    right: auto !important; 
                  }
                  .hero-badge-pill {
                    padding: 4px 6px !important;
                    gap: 4px !important;
                    border-radius: 9999px !important;
                    max-width: 90px !important;
                  }
                  .hero-badge-icon-wrap {
                    width: 16px !important;
                    height: 16px !important;
                  }
                  .hero-badge-icon-svg {
                    width: 8px !important;
                    height: 8px !important;
                  }
                  .hero-badge-title {
                    font-size: 6px !important;
                    letter-spacing: 0.002em !important;
                  }
                  .hero-badge-subtitle {
                    font-size: 4.5px !important;
                    margin-top: 0px !important;
                  }
                }
              `}</style>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-dark/70 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl xl:max-w-[620px] font-light text-center md:text-left hero-description-320"
              >
                <span className="hero-desc-full">
                  Order genuine medicines, healthcare essentials, and wellness products with priority 1-hour delivery. Licensed pharmacists are standing by.
                </span>
                <span className="hero-desc-short">
                  Genuine medicines and healthcare essentials, delivered to your doorstep in 1 hour.
                </span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 pt-1 w-full sm:w-auto justify-center md:justify-start"
              >
                <Link to="/medicines" className="block w-full sm:inline-block sm:w-auto">
                  <Button 
                    variant="primary" 
                    icon={MdKeyboardArrowRight} 
                    iconPosition="right" 
                    className="w-full bg-primary hover:bg-primary-dark shadow-md hover:shadow-primary/20 text-xs py-3.5 px-8 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                  >
                    Shop Medicines
                  </Button>
                </Link>
                <Link to="/upload-prescription" className="block w-full sm:inline-block sm:w-auto">
                  <Button 
                    variant="outline" 
                    icon={MdUploadFile} 
                    className="w-full border-primary text-primary hover:bg-primary/5 text-xs py-3.5 px-8 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                  >
                    Upload Prescription
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 min-[360px]:gap-x-4 gap-y-2 text-[9px] min-[360px]:text-[10px] font-bold text-dark/45 uppercase tracking-wider select-none pt-1"
              >
                <span className="flex items-center gap-1.5"><MdVerified className="text-primary text-sm" /> 100% Genuine</span>
                <span className="flex items-center gap-1.5"><MdPayment className="text-primary text-sm" /> Secure Payments</span>
                <span className="flex items-center gap-1.5"><MdAssignmentReturn className="text-primary text-sm" /> Easy Returns</span>
                <span className="flex items-center gap-1.5"><MdMedicalServices className="text-primary text-sm" /> Licensed Pharmacists</span>
              </motion.div>
            </div>

            {/* Right Column: Complete Healthcare Visual Section */}
            <div className="w-full md:w-[50%] xl:w-[45%] flex flex-col justify-center items-center md:items-end mt-2 md:mt-0 select-none">
              <div className="w-full max-w-[220px] min-[340px]:max-w-[240px] min-[360px]:max-w-[260px] min-[400px]:max-w-[290px] sm:max-w-[350px] md:max-w-[380px] lg:max-w-[410px] xl:max-w-[440px]">
                
                {/* Doctor Photo Wrapper (Positioning Parent) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full mx-auto"
                >
                  {/* Doctor Image Card */}
                  <div className="relative aspect-[4/5] w-full rounded-[24px] sm:rounded-[32px] overflow-hidden border-[6px] sm:border-[8px] border-white shadow-[0_20px_50px_rgba(0,150,136,0.12)] bg-white z-10 hero-doctor-card-container">
                    <img
                      src="/images/hero-doctor.jpg"
                      alt="Professional Healthcare Doctor"
                      className="w-full h-full object-contain object-[center_top] transition-all duration-500 hover:scale-[1.02] hero-doctor-img"
                      loading="lazy"
                    />

                    {/* Wrapper Container for Responsive Placement */}
                    <div className="hero-badges-container">
                      {/* Floating Card 1: 1 Hour Delivery (Top-Left) */}
                      <div className="hero-badge-wrap hb-pos-1 animate-float-slow">
                        <div className="hero-badge-pill">
                          <div className="hero-badge-icon-wrap bg-orange-50 text-orange-500">
                            <svg className="hero-badge-icon-svg text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11 21h-1l1.5-7h-5l6-12h1l-1.5 7h5z" />
                            </svg>
                          </div>
                          <div className="text-left text-nowrap">
                            <span className="hero-badge-title">1 Hour Delivery</span>
                            <span className="hero-badge-subtitle">Priority dispatch</span>
                          </div>
                        </div>
                      </div>

                      {/* Floating Card 2: 100% Genuine (Top-Right) */}
                      <div className="hero-badge-wrap hb-pos-2 animate-float-fast">
                        <div className="hero-badge-pill">
                          <div className="hero-badge-icon-wrap bg-emerald-50 text-emerald-500">
                            <svg className="hero-badge-icon-svg text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                          <div className="text-left text-nowrap">
                            <span className="hero-badge-title">100% Genuine</span>
                            <span className="hero-badge-subtitle">Original & authentic</span>
                          </div>
                        </div>
                      </div>

                      {/* Floating Card 3: 10K+ Medicines (Middle-Left) */}
                      <div className="hero-badge-wrap hb-pos-3 animate-float-slow">
                        <div className="hero-badge-pill">
                          <div className="hero-badge-icon-wrap bg-amber-50 text-amber-500">
                            <svg className="hero-badge-icon-svg text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 3h12a3 3 0 0 1 3 3v4H3V6a3 3 0 0 1 3-3zm15 9v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6h18z" />
                            </svg>
                          </div>
                          <div className="text-left text-nowrap">
                            <span className="hero-badge-title">10K+ Medicines</span>
                            <span className="hero-badge-subtitle">Everyday essentials</span>
                          </div>
                        </div>
                      </div>

                      {/* Floating Card 4: 500+ Brands (Middle-Right) */}
                      <div className="hero-badge-wrap hb-pos-4 animate-float-medium">
                        <div className="hero-badge-pill">
                          <div className="hero-badge-icon-wrap bg-sky-50 text-sky-500">
                            <svg className="hero-badge-icon-svg text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V8h2v4h4v2z" />
                            </svg>
                          </div>
                          <div className="text-left text-nowrap">
                            <span className="hero-badge-title">500+ Brands</span>
                            <span className="hero-badge-subtitle">Trusted health partners</span>
                          </div>
                        </div>
                      </div>

                      {/* Floating Card 5: Certified Doctors (Bottom-Center) */}
                      <div className="hero-badge-wrap hb-pos-5 animate-float-medium">
                        <div className="hero-badge-pill">
                          <div className="hero-badge-icon-wrap bg-teal-50 text-teal-600">
                            <svg className="hero-badge-icon-svg text-teal-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                            </svg>
                          </div>
                          <div className="text-left text-nowrap">
                            <span className="hero-badge-title">Certified Doctors</span>
                            <span className="hero-badge-subtitle">Expert consultations</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 4. PREMIUM STATISTICS BAR */}
      <div className="border-b border-dark/5 bg-white py-8 select-none">
        <div className="container mx-auto px-4 lg:px-6 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-dark/5">
            <div className="space-y-1">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#063B44]">
                <CountUp end={1000} suffix="+" />
              </span>
              <span className="block text-xs sm:text-sm text-dark/50 font-medium">Medicines Available</span>
            </div>
            <div className="space-y-1">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#063B44]">
                <CountUp end={500} suffix="+" />
              </span>
              <span className="block text-xs sm:text-sm text-dark/50 font-medium">Trusted Brands</span>
            </div>
            <div className="space-y-1">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#063B44]">
                1 Hour
              </span>
              <span className="block text-xs sm:text-sm text-dark/50 font-medium">Average Delivery Time</span>
            </div>
            <div className="space-y-1">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#063B44]">
                <CountUp end={10000} suffix="+" />
              </span>
              <span className="block text-xs sm:text-sm text-dark/50 font-medium">Happy Customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📦 5. MEDICINE CATEGORIES */}
      <section className="py-12 max-[320px]:py-5 bg-[#F8FCFC] relative z-10 select-none">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-between mb-8 max-[320px]:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-dark text-left">Medicine Categories</h2>
            <Link to="/categories" className="text-primary hover:underline text-xs sm:text-sm font-semibold flex items-center gap-0.5">
              View All Categories <MdKeyboardArrowRight className="text-lg" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => {
              const dbCat = categories?.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
              const currentIcon = dbCat?.icon || cat.icon;
              return (
                <Link key={cat.id} to={`/medicines?category=${cat.query}`} className="w-full">
                  <motion.div whileHover={{ y: -6, scale: 1.02 }} className="cursor-pointer">
                    <Card 
                      hoverable={false}
                      padding="p-4"
                      className="flex flex-col items-center justify-center h-28 border border-dark/5 bg-white shadow-soft text-center animate-fade-in"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center text-2xl mb-3 shadow-sm overflow-hidden p-1.5">
                        {currentIcon && (currentIcon.startsWith('http') || currentIcon.startsWith('/')) ? (
                          <img src={currentIcon} alt={cat.name} className="w-full h-full object-contain" />
                        ) : (
                          currentIcon
                        )}
                      </div>
                      <span className="text-xs font-bold text-dark/80 line-clamp-1 truncate w-full px-1">{cat.name}</span>
                    </Card>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      {/* 💊 DYNAMIC HOMEPAGE PRODUCT SECTIONS */}
      {/* Best Selling Products Section */}
      <ProductSection
        title="Best Selling Medicines"
        products={bestSellingProducts}
        addToCart={addToCart}
        navigate={navigate}
        addingProductId={addingProductId}
        setAddingProductId={setAddingProductId}
        viewMoreUrl="/best-sellers"
        limitCount={6}
        hideCount={true}
      />

      {/* Category-wise Product Sections */}
      {firstTwoCategories.map((cat, idx) => {
        let title = cat.name;
        let catProducts = productsData.filter(
          (p) => p.category.toLowerCase() === cat.name.toLowerCase()
        );
        let customCount = undefined;
        let viewMoreUrl = `/medicines?category=${encodeURIComponent(cat.name)}`;
        let children = null;

        if (idx === 0) {
          // Medicines Section
          customCount = "15+ Products";
        } else if (idx === 1) {
          // Replace OTC Medicines showcase with Skincare
          title = "Skincare";
          catProducts = productsData.filter(
            (p) => p.category.toLowerCase() === "personal care"
          );
          viewMoreUrl = "/medicines?category=Personal%20Care";

          // Render ALL CATEGORIES button below the 2nd category section
          children = (
            <Link to="/categories" className="block w-full sm:w-auto">
              <Button
                variant="primary"
                icon={MdKeyboardArrowRight}
                iconPosition="right"
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark shadow-md hover:shadow-primary/20 text-xs py-3.5 px-8 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                All Categories
              </Button>
            </Link>
          );
        }

        return (
          <ProductSection
            key={cat.id || cat.name}
            title={title}
            products={catProducts}
            addToCart={addToCart}
            navigate={navigate}
            addingProductId={addingProductId}
            setAddingProductId={setAddingProductId}
            viewMoreUrl={viewMoreUrl}
            customCount={customCount}
          >
            {children}
          </ProductSection>
        );
      })}



      {/* 🛡️ 10. WHY CHOOSE MEDIQUICK */}
      <section className="py-12 sm:py-16 bg-white border-t border-dark/5 select-none">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-dark mb-8 sm:mb-10">Why Choose MediQuick?</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-6">
            <div className="flex flex-col items-center space-y-2.5 sm:space-y-3 bg-background/30 p-4 sm:p-5 rounded-2xl border border-dark/5 text-center w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-50 text-emerald-600 shadow-soft flex items-center justify-center text-lg sm:text-xl shrink-0">
                ✔️
              </div>
              <h4 className="font-bold text-dark text-xs sm:text-sm">Genuine Medicines</h4>
              <p className="text-[10px] sm:text-[11px] text-dark/55 leading-relaxed font-light">100% genuine pharmaceutical stock batches.</p>
            </div>

            <div className="flex flex-col items-center space-y-2.5 sm:space-y-3 bg-background/30 p-4 sm:p-5 rounded-2xl border border-dark/5 text-center w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 shadow-soft flex items-center justify-center text-lg sm:text-xl shrink-0">
                🛡️
              </div>
              <h4 className="font-bold text-dark text-xs sm:text-sm">Licensed Pharmacy</h4>
              <p className="text-[10px] sm:text-[11px] text-dark/55 leading-relaxed font-light">Operated by registered medical pharmacists.</p>
            </div>

            <div className="flex flex-col items-center space-y-2.5 sm:space-y-3 bg-background/30 p-4 sm:p-5 rounded-2xl border border-dark/5 text-center w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-50 text-cyan-600 shadow-soft flex items-center justify-center text-lg sm:text-xl shrink-0">
                ⚡
              </div>
              <h4 className="font-bold text-dark text-xs sm:text-sm">Fast Delivery</h4>
              <p className="text-[10px] sm:text-[11px] text-dark/55 leading-relaxed font-light">Lightning priority shipping under 1 hour.</p>
            </div>

            <div className="flex flex-col items-center space-y-2.5 sm:space-y-3 bg-background/30 p-4 sm:p-5 rounded-2xl border border-dark/5 text-center w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50 text-amber-600 shadow-soft flex items-center justify-center text-lg sm:text-xl shrink-0">
                🔒
              </div>
              <h4 className="font-bold text-dark text-xs sm:text-sm">Secure Payment</h4>
              <p className="text-[10px] sm:text-[11px] text-dark/55 leading-relaxed font-light">Fully encrypted checkouts and UPI options.</p>
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1 flex flex-col items-center space-y-2.5 sm:space-y-3 bg-background/30 p-4 sm:p-5 rounded-2xl border border-dark/5 text-center w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-50 text-purple-600 shadow-soft flex items-center justify-center text-lg sm:text-xl shrink-0">
                📞
              </div>
              <h4 className="font-bold text-dark text-xs sm:text-sm">24x7 Support</h4>
              <p className="text-[10px] sm:text-[11px] text-dark/55 leading-relaxed font-light">On-call pharmacists available at any hour.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🗣️ 11. TESTIMONIALS (Carousel Slider Auto-slides every 5s) */}
      <section className="pt-12 pb-12 bg-[#F8FCFC] border-t border-dark/5 select-none overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark">Customer Testimonials</h2>
            <p className="text-xs text-dark/45 font-light mt-1">Check verified patient reviews</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative w-full">
            {/* 📦 LEFT SIDE: Staggered Floating Products (Desktop/Laptop only) */}
            <div className="hidden lg:flex lg:col-span-3 h-80 relative w-full select-none">
              <TestimonialProductCard
                initialProduct={selectedTestimonialProducts[0]}
                fallbackProducts={stableProducts}
                className="absolute top-4 left-6 xl:left-12 w-24 h-24 xl:w-28 xl:h-28 bg-white p-3 rounded-2xl border border-primary/10 shadow-[0_8px_30px_rgba(0,150,136,0.06)] hover:scale-105 transition-transform duration-300 flex items-center justify-center"
              />
              <TestimonialProductCard
                initialProduct={selectedTestimonialProducts[1]}
                fallbackProducts={stableProducts}
                className="absolute top-24 right-4 xl:right-10 w-28 h-28 xl:w-32 xl:h-32 bg-white p-4 rounded-2xl border border-primary/10 shadow-[0_8px_30px_rgba(0,150,136,0.06)] hover:scale-105 transition-transform duration-300 flex items-center justify-center"
                badge={(p) => (
                  <div className="absolute -top-2.5 -right-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5 shadow-sm">
                    ⭐ 5.0
                  </div>
                )}
              />
              <TestimonialProductCard
                initialProduct={selectedTestimonialProducts[2]}
                fallbackProducts={stableProducts}
                className="absolute bottom-4 left-8 xl:left-14 w-24 h-24 xl:w-28 xl:h-28 bg-white p-3 rounded-2xl border border-primary/10 shadow-[0_8px_30px_rgba(0,150,136,0.06)] hover:scale-105 transition-transform duration-300 flex items-center justify-center"
              />
            </div>

            {/* CENTER: Main Testimonial Card */}
            <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center">
              {/* 📦 Mobile/Tablet Product Row (Hidden on Desktop) */}
              <div className="flex lg:hidden justify-center items-center gap-4 md:gap-6 mb-8 select-none">
                <TestimonialProductCard
                  initialProduct={selectedTestimonialProducts[0]}
                  fallbackProducts={stableProducts}
                  className="w-16 h-16 md:w-20 md:h-20 bg-white p-2.5 rounded-xl border border-primary/10 shadow-[0_4px_20px_rgba(0,150,136,0.04)] flex items-center justify-center"
                />
                <TestimonialProductCard
                  initialProduct={selectedTestimonialProducts[1]}
                  fallbackProducts={stableProducts}
                  className="w-16 h-16 md:w-20 md:h-20 bg-white p-2.5 rounded-xl border border-primary/10 shadow-[0_4px_20px_rgba(0,150,136,0.04)] flex items-center justify-center"
                />
                <TestimonialProductCard
                  initialProduct={selectedTestimonialProducts[2]}
                  fallbackProducts={stableProducts}
                  className="w-16 h-16 md:w-20 md:h-20 bg-white p-2.5 rounded-xl border border-primary/10 shadow-[0_4px_20px_rgba(0,150,136,0.04)] flex items-center justify-center"
                />
                <TestimonialProductCard
                  initialProduct={selectedTestimonialProducts[3]}
                  fallbackProducts={stableProducts}
                  className="hidden sm:flex w-16 h-16 md:w-20 md:h-20 bg-white p-2.5 rounded-xl border border-primary/10 shadow-[0_4px_20px_rgba(0,150,136,0.04)] items-center justify-center"
                />
              </div>

              <div className="w-full max-w-xl">
                {activeReviews.length === 0 ? (
                  <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft text-center py-12">
                    <p className="text-xs text-dark/50 italic font-light">
                      No verified reviews available at the moment. Be the first to purchase and write a review!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative min-h-[220px]">
                      <AnimatePresence mode="wait">
                        {(() => {
                          const currentActiveIndex = activeReviews.length > 0 ? activeTestimonial % activeReviews.length : 0;
                          const currentReview = activeReviews[currentActiveIndex];
                          if (!currentReview) return null;

                          const getAvatarBg = (idx) => {
                            const bgs = ['bg-emerald-500', 'bg-primary-dark', 'bg-secondary-dark', 'bg-blue-500', 'bg-purple-500'];
                            return bgs[idx % bgs.length];
                          };

                          const reviewImg = currentReview.imageUrl || currentReview.image || (Array.isArray(currentReview.images) && currentReview.images[0]);

                          return (
                            <motion.div
                              key={currentReview.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.35 }}
                              className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft text-left flex flex-col justify-between h-52 relative"
                            >
                              {reviewImg ? (
                                <div className="grid grid-cols-3 gap-4 h-full w-full">
                                  <div className="col-span-2 flex flex-col justify-between h-full">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-0.5 text-amber-500">
                                        {[...Array(Number(currentReview.rating || 5))].map((_, i) => (
                                          <MdStar key={i} className="text-base" />
                                        ))}
                                      </div>
                                      {currentReview.title && (
                                        <h4 className="text-xs font-bold text-dark truncate leading-none">
                                          {currentReview.title}
                                        </h4>
                                      )}
                                      <p className="text-xs text-dark/70 italic leading-relaxed font-light line-clamp-3">
                                        "{currentReview.review}"
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-3 pt-3 border-t border-dark/5">
                                      <div className={`w-8 h-8 rounded-full ${getAvatarBg(currentActiveIndex)} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0`}>
                                        {(currentReview.userName || 'C')[0]}
                                      </div>
                                      <div className="overflow-hidden leading-tight text-left">
                                        <span className="text-xs font-bold text-dark block truncate">
                                          {currentReview.userName || 'Verified Customer'}
                                        </span>
                                        {currentReview.location && (
                                          <span className="text-[10px] text-dark/40 font-medium block truncate">
                                            {currentReview.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-span-1 h-full w-full rounded-2xl overflow-hidden border border-dark/5 bg-background select-none">
                                    <img
                                      src={reviewImg}
                                      alt="Customer review photo"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col justify-between h-full w-full">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-0.5 text-amber-500">
                                      {[...Array(Number(currentReview.rating || 5))].map((_, i) => (
                                        <MdStar key={i} className="text-base" />
                                      ))}
                                    </div>
                                    {currentReview.title && (
                                      <h4 className="text-xs font-bold text-dark truncate leading-none">
                                        {currentReview.title}
                                      </h4>
                                    )}
                                    <p className="text-xs text-dark/70 italic leading-relaxed font-light line-clamp-4">
                                      "{currentReview.review}"
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 pt-3 border-t border-dark/5">
                                    <div className={`w-8 h-8 rounded-full ${getAvatarBg(currentActiveIndex)} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0`}>
                                      {(currentReview.userName || 'C')[0]}
                                    </div>
                                    <div className="overflow-hidden leading-tight text-left">
                                      <span className="text-xs font-bold text-dark block truncate">
                                        {currentReview.userName || 'Verified Customer'}
                                      </span>
                                      {currentReview.location && (
                                        <span className="text-[10px] text-dark/40 font-medium block truncate">
                                          {currentReview.location}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </div>

                    {/* Navigation Dots */}
                    {activeReviews.length > 1 && (
                      <div className="flex justify-center gap-1.5 mt-4">
                        {activeReviews.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTestimonial(i)}
                            className={`w-2 h-2 rounded-full transition-all outline-none cursor-pointer ${
                              (activeTestimonial % activeReviews.length) === i ? 'bg-primary w-5' : 'bg-dark/20'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 📦 RIGHT SIDE: Staggered Floating Products (Desktop/Laptop only) */}
            <div className="hidden lg:flex lg:col-span-3 h-80 relative w-full select-none">
              <TestimonialProductCard
                initialProduct={selectedTestimonialProducts[3]}
                fallbackProducts={stableProducts}
                className="absolute top-4 right-6 xl:right-12 w-24 h-24 xl:w-28 xl:h-28 bg-white p-3 rounded-2xl border border-primary/10 shadow-[0_8px_30px_rgba(0,150,136,0.06)] hover:scale-105 transition-transform duration-300 flex items-center justify-center"
              />
              <TestimonialProductCard
                initialProduct={selectedTestimonialProducts[4]}
                fallbackProducts={stableProducts}
                className="absolute top-24 left-4 xl:left-10 w-28 h-28 xl:w-32 xl:h-32 bg-white p-4 rounded-2xl border border-primary/10 shadow-[0_8px_30px_rgba(0,150,136,0.06)] hover:scale-105 transition-transform duration-300 flex items-center justify-center"
                badge={(p) => (
                  <div className="absolute -bottom-2 -left-2 bg-[#E2F3F0] text-[#009688] text-[9px] font-bold px-2 py-0.5 rounded-full border border-primary/10 flex items-center gap-1 shadow-sm">
                    <span>💬</span> Reviewed
                  </div>
                )}
              />
              <TestimonialProductCard
                initialProduct={selectedTestimonialProducts[5]}
                fallbackProducts={stableProducts}
                className="absolute bottom-4 right-8 xl:right-14 w-24 h-24 xl:w-28 xl:h-28 bg-white p-3 rounded-2xl border border-primary/10 shadow-[0_8px_30px_rgba(0,150,136,0.06)] hover:scale-105 transition-transform duration-300 flex items-center justify-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ❓ 12. FAQ SECTION */}
      <section className="py-16 bg-white border-t border-dark/5 select-none">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-dark">Frequently Asked Questions</h2>
            <p className="text-xs text-dark/45 mt-1 font-light">Find swift answers to common shipping & prescription queries</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="border border-dark/5 rounded-2xl overflow-hidden bg-white hover:border-primary/20 transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-dark/85 outline-none"
                  >
                    <span>{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-dark/40 text-xl"
                    >
                      <MdExpandMore />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-dark/60 leading-relaxed font-light border-t border-dark/5 bg-background/30">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 📞 13. CONTACT SECTION */}
      <section className="py-16 bg-[#F8FCFC] border-t border-dark/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            
            {/* Contact Details & Google Map Iframe */}
            <div className="flex flex-col justify-between text-left space-y-6">
              <div className="space-y-2">
                <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider">Contact Us</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-dark">Get in Touch with MediQuick</h2>
                <p className="text-xs text-dark/50 leading-relaxed font-light">
                  Find our central distribution pharmacy address, telephone details, support emails, and Gachibowli location coordinates.
                </p>
              </div>

              {/* Direct Maps Embed */}
              <div className="w-full h-48 bg-white border border-dark/5 p-2 rounded-2xl shadow-soft">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.757876008696!2d78.34684997596827!3d17.423405783471013!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93f5383f5c71%3A0xd68065b26b38c2ef!2sGachibowli%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, borderRadius: '12px' }} 
                  allowFullScreen="" 
                  loading="lazy"
                  title="Gachibowli Location"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-dark/70 font-medium">
                <div className="flex items-center gap-2">
                  <MdCall className="text-primary text-base" />
                  <span>{systemSettings?.supportPhone || "+1 (555) 019-2834"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdMailOutline className="text-primary text-base" />
                  <span>{systemSettings?.supportEmail || "support@mediquick.com"}</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MdRoom className="text-primary text-base" />
                  <span>Phase 2, Gachibowli, Hyderabad, Telangana, 500032</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <Card hoverable={false} padding="p-6 sm:p-8" className="bg-white border border-dark/5 shadow-premium rounded-[24px] flex flex-col justify-center">
              <div className="text-left space-y-2 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-dark">Request Callback</h3>
                <p className="text-xs text-dark/45 font-light">Enter details and a pharmacist will contact you in 15 minutes</p>
              </div>

              <form onSubmit={handleCallbackSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark/60 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={callbackName}
                    onChange={(e) => setCallbackName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 text-sm bg-[#F8FCFC] border border-dark/5 rounded-xl outline-none focus:border-primary transition-all text-dark placeholder:text-dark/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark/60 block">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-4 py-2.5 text-sm bg-[#F8FCFC] border border-dark/5 rounded-xl outline-none focus:border-primary transition-all text-dark placeholder:text-dark/30"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md select-none mt-2"
                >
                  Request Callback
                </button>
              </form>

              <AnimatePresence>
                {callbackSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-secondary/10 border border-secondary/20 text-secondary-dark rounded-xl text-xs text-left flex items-center gap-2"
                  >
                    <MdCheckCircle className="text-base shrink-0" />
                    <span>Callback Request Sent! A licensed pharmacist will reach out to you within 15 minutes.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

          </div>
        </div>
      </section>

      {/* 💚 Floating Actions Widget */}
      {/* Scroll to Top (Bottom Left) */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 left-6 z-30 p-3 bg-white hover:bg-primary/5 text-primary rounded-full shadow-hover border border-dark/5 transition-all outline-none"
          >
            <MdArrowUpward className="text-2xl" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* WhatsApp Button (Bottom Right) */}
      <button
        onClick={() => window.open(getWhatsappUrl(), '_blank')}
        className="fixed bottom-6 right-6 z-30 p-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-hover hover:scale-105 active:scale-95 transition-all outline-none flex items-center justify-center cursor-pointer border-none"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
      </button>

    </div>
  );
}

// 📦 Dynamic review helper card with self-healing product fallback on error
function TestimonialProductCard({ initialProduct, fallbackProducts, className, badge }) {
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [attemptedIds, setAttemptedIds] = useState(new Set());

  useEffect(() => {
    if (initialProduct) {
      setCurrentProduct(initialProduct);
      setAttemptedIds(new Set([initialProduct.id]));
    } else {
      setCurrentProduct(null);
      setAttemptedIds(new Set());
    }
  }, [initialProduct]);

  if (!currentProduct) return null;

  const handleImageError = () => {
    // Find a fallback product that we haven't tried yet
    const nextProduct = fallbackProducts.find(p => p && p.id && !attemptedIds.has(p.id));
    if (nextProduct) {
      setAttemptedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(nextProduct.id);
        return newSet;
      });
      setCurrentProduct(nextProduct);
    } else {
      // Out of fallbacks, hide slot
      setCurrentProduct(null);
    }
  };

  const getProductImgUrl = (p) => {
    if (p.image_url && p.image_url.trim() !== '' && p.image_url !== '/images/default-medicine.png') {
      return p.image_url;
    }
    // Dynamic fallback to the local SVGs under public/images/medicines/
    const slug = p.medicine_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `/images/medicines/${p.id}-${slug}.svg`;
  };

  const imgUrl = getProductImgUrl(currentProduct);

  return (
    <div className={className}>
      <img
        src={imgUrl}
        alt={currentProduct.medicine_name}
        className="w-full h-full object-contain"
        onError={handleImageError}
      />
      {badge && badge(currentProduct)}
    </div>
  );
}
