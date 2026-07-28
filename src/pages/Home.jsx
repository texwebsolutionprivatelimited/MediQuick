import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Card from '../components/Card';
import Button from '../components/Button';
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
  MdFavoriteBorder
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import MedicineImage from '../components/MedicineImage';
import { useWishlist } from '../context/WishlistContext';

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

const HERO_BANNERS = [
  {
    title: "Genuine Medicines, Delivered Fast",
    description: "Direct from licensed pharmacies to your doorstep. Free delivery on orders above ₹500.",
    highlight: "Delivered Fast",
    badge: "1 HOUR DELIVERY"
  },
  {
    title: "Your Trusted Online Pharmacy",
    description: "Order medicines, healthcare devices, and wellness essentials with priority 1-hour shipping and 24/7 support.",
    highlight: "Online Pharmacy",
    badge: "FLAT 20% OFF"
  },
  {
    title: "Easy Upload Prescription & Order",
    description: "Just upload your doctor's prescription, and our pharmacists will configure your cart in minutes.",
    highlight: "Prescription & Order",
    badge: "EASY UPLOAD"
  }
];

const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Anjali Sharma',
    location: 'Hyderabad, Telangana',
    text: 'MediQuick delivered my mother\'s blood pressure medicines in under 20 minutes! The packaging was secure and billing was completely transparent.',
    rating: 5,
    avatarBg: 'bg-emerald-500'
  },
  {
    id: 't2',
    name: 'Rohan Mehta',
    location: 'Secunderabad, Telangana',
    text: 'Uploading prescription was seamless. The pharmacist called me back within 5 minutes to confirm the dosage, and the delivery was incredibly fast.',
    rating: 5,
    avatarBg: 'bg-primary-dark'
  },
  {
    id: 't3',
    name: 'Dr. Priya Nair',
    location: 'Gachibowli, Hyderabad',
    text: 'I recommend my patients to use MediQuick. Their sourcing is 100% genuine and the 1-hour local shipping is a lifecycle saver for urgent requirements.',
    rating: 5,
    avatarBg: 'bg-secondary-dark'
  }
];

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

function ProductSection({ title, products, addToCart, navigate }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  if (!products || products.length === 0) return null;
  return (
    <section className="py-12 bg-white border-t border-dark/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-dark text-left">{title}</h2>
          <span className="text-xs font-semibold text-dark/45">{products.length} Products</span>
        </div>

        <div className="grid grid-cols-1 min-[375px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 pb-4 select-none">
          {products.map((product) => (
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
                  <MdFavorite className="text-lg text-red-500" />
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, 1);
                  }}
                  disabled={product.stock <= 0}
                  className={`w-full mt-2.5 py-2 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all select-none shadow-sm ${
                    product.stock > 0 
                      ? 'bg-primary/5 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary cursor-pointer' 
                      : 'bg-dark/5 text-dark/30 border border-dark/5 cursor-not-allowed'
                  }`}
                >
                  <MdShoppingCart className="text-xs" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { address, detectLocation, loading: locLoading, userCoords } = useLocation();
  const navigate = useNavigate();
  const { products: productsData } = useProducts();
  const { systemSettings } = useSettings();

  // Search filter
  const [searchVal, setSearchVal] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-slide Hero Banners every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % HERO_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Filter products by category/subcategory dynamically
  const featured = productsData.slice(0, 10);
  const bestSellers = productsData.filter(p => p.category === "Medicines" || p.category === "OTC Medicines").slice(10, 20);
  const diabetes = productsData.filter(p => p.category === "Diabetes Care").slice(0, 10);
  const heart = productsData.filter(p => p.category === "Heart Care").slice(0, 10);
  const baby = productsData.filter(p => p.category === "Baby Care").slice(0, 10);
  const personal = productsData.filter(p => p.category === "Personal Care").slice(0, 10);
  const ayurveda = productsData.filter(p => p.category === "Ayurveda").slice(0, 10);
  const vitamins = productsData.filter(p => p.category === "Vitamins").slice(0, 10);
  const devices = productsData.filter(p => p.category === "Medical Devices").slice(0, 10);
  const otc = productsData.filter(p => p.category === "OTC Medicines").slice(0, 10);
  const painRelief = productsData.filter(p => p.subcategory === "Pain Relief").slice(0, 10);
  const womensHealth = productsData.filter(p => p.category === "Women's Health").slice(0, 10);
  const mensHealth = productsData.filter(p => p.category === "Men's Health").slice(0, 10);
  const skinCare = productsData.filter(p => p.category === "Skin Care").slice(0, 10);
  
  // Custom Location Permission Popup State
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  // Testimonials Carousel auto-slide index
  const [activeTestimonial, setActiveTestimonial] = useState(0);

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

  // Check and query location permission states on load
  useEffect(() => {
    const savedAddress = localStorage.getItem('mediquick_user_address');
    const savedCoords = localStorage.getItem('mediquick_user_coords');
    if (savedAddress && savedCoords) {
      return; // Loaded from cache
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          detectLocation();
        } else {
          setShowLocationPopup(true);
        }
      }).catch(() => {
        setShowLocationPopup(true);
      });
    } else {
      setShowLocationPopup(true);
    }
  }, []);

  // Auto-slide Testimonials Carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
    detectLocation();
  };

  const handleNotNowLocation = () => {
    setShowLocationPopup(false);
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white p-6 rounded-[24px] shadow-premium text-center border border-dark/5"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-3xl mb-4">
                <MdRoom />
              </div>
              <h3 className="text-xl font-bold text-dark">Allow Location Access</h3>
              <p className="text-xs text-dark/65 leading-relaxed font-light mt-2 max-w-sm mx-auto">
                Enable your location to view medicines available near you and receive faster 1-Hour delivery.
              </p>
              
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={handleAllowLocation}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wide rounded-xl transition-all shadow-md"
                >
                  Allow Location
                </button>
                <button
                  onClick={handleNotNowLocation}
                  className="w-full py-3 hover:bg-background text-dark/60 hover:text-dark font-bold text-xs uppercase tracking-wide rounded-xl transition-all"
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* 🚀 3. HERO BANNER */}
      <section className="relative overflow-hidden py-12 md:py-16 text-center md:text-left select-none border-b border-dark/5 bg-white">
        <div className="container mx-auto px-4 lg:px-6 w-full hero-banner-container">
          <div className="bg-gradient-to-r from-[#E2F3F0] to-[#E3F2FD] rounded-[32px] p-6 md:p-12 relative overflow-hidden min-h-[360px] flex flex-col justify-center">
            
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
              <div className="md:col-span-8 space-y-6 flex flex-col items-center md:items-start text-center md:text-left w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBanner}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    <span className="bg-primary/10 text-primary-dark text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider inline-block">
                      {HERO_BANNERS[currentBanner].badge}
                    </span>
                    <h1 className="text-[28px] sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#063B44] leading-tight text-center md:text-left">
                      {HERO_BANNERS[currentBanner].title.split(HERO_BANNERS[currentBanner].highlight)[0]}
                      <span className="text-primary">{HERO_BANNERS[currentBanner].highlight}</span>
                      {HERO_BANNERS[currentBanner].title.split(HERO_BANNERS[currentBanner].highlight)[1]}
                    </h1>
                    {HERO_BANNERS[currentBanner].badge === "1 HOUR DELIVERY" ? (
                      <div className="space-y-1 select-none">
                        <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider block">Current Delivery Zone</span>
                        <p className="text-xs sm:text-sm font-extrabold text-primary flex items-center justify-center md:justify-start gap-1">
                          <MdRoom className="text-base shrink-0" />
                          {address || "Hyderabad, 500001"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-dark/70 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl font-light text-center md:text-left">
                        {HERO_BANNERS[currentBanner].description}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
 
                <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full justify-center md:justify-start">
                  <Link to="/medicines" className="w-full sm:w-auto">
                    <Button variant="primary" icon={MdKeyboardArrowRight} iconPosition="right" className="w-full bg-primary hover:bg-primary-dark shadow-md text-xs py-3 px-6 rounded-xl">
                      Shop Medicines
                    </Button>
                  </Link>
                  <Link to="/upload-prescription" className="w-full sm:w-auto">
                    <Button variant="outline" icon={MdUploadFile} className="w-full border-primary text-primary hover:bg-primary/5 text-xs py-3 px-6 rounded-xl">
                      Upload Prescription
                    </Button>
                  </Link>
                </div>
 
                {/* Banner Dots */}
                <div className="flex gap-1.5 pt-4 justify-center md:justify-start">
                  {HERO_BANNERS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentBanner ? 'bg-primary w-6' : 'bg-dark/15 hover:bg-dark/25'}`}
                    />
                  ))}
                </div>
              </div>
 
              {/* Right Side doctor illustration */}
              <div className="md:col-span-4 flex justify-center md:justify-end pr-0 md:pr-6 mt-8 md:mt-0 select-none">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="w-32 sm:w-40 md:w-48 md:w-full max-w-[200px] md:max-w-none drop-shadow-premium"
                >
                  <svg viewBox="0 0 200 250" fill="none" className="w-full h-auto">
                    <ellipse cx="100" cy="220" rx="60" ry="20" fill="rgba(6, 59, 68, 0.08)" />
                    <circle cx="100" cy="70" r="30" fill="#F3C3A7" />
                    <path d="M70 70 C70 20, 130 20, 130 70 Z" fill="#2E1C0C" />
                    <path d="M75 100 L125 100 L140 220 H60 Z" fill="#ECEFF1" />
                    <path d="M75 100 L100 145 L125 100" stroke="#B0BEC5" strokeWidth="2" fill="none" />
                    <rect x="85" y="100" width="30" height="25" fill="#009688" />
                    <text x="96" y="117" fill="#FFFFFF" fontSize="16" fontWeight="bold">+</text>
                    <circle cx="90" cy="67" r="2.5" fill="#2E1C0C" />
                    <circle cx="110" cy="67" r="2.5" fill="#2E1C0C" />
                    <path d="M92 80 Q100 86 108 80" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 📦 5. MEDICINE CATEGORIES */}
      <section className="py-12 bg-[#F8FCFC] relative z-10 select-none">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-dark text-left">Medicine Categories</h2>
            <Link to="/categories" className="text-primary hover:underline text-xs sm:text-sm font-semibold flex items-center gap-0.5">
              View All Categories <MdKeyboardArrowRight className="text-lg" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 min-[576px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} to={`/medicines?category=${cat.query}`} className="w-full">
                <motion.div whileHover={{ y: -6, scale: 1.02 }} className="cursor-pointer">
                  <Card 
                    hoverable={false}
                    padding="p-4"
                    className="flex flex-col items-center justify-center h-28 border border-dark/5 bg-white shadow-soft text-center animate-fade-in"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center text-2xl mb-3 shadow-sm">
                      {cat.icon}
                    </div>
                    <span className="text-xs font-bold text-dark/80 line-clamp-1 truncate w-full px-1">{cat.name}</span>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 💊 DYNAMIC HOMEPAGE PRODUCT SECTIONS */}
      <ProductSection title="Featured Medicines" products={featured} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Best Selling Medicines" products={bestSellers} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Diabetes Care" products={diabetes} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Heart Care" products={heart} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Baby Care" products={baby} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Personal Care" products={personal} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Ayurvedic Products" products={ayurveda} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Vitamins & Supplements" products={vitamins} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Medical Devices" products={devices} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="OTC Medicines" products={otc} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Pain Relief" products={painRelief} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Women's Health" products={womensHealth} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Men's Health" products={mensHealth} addToCart={addToCart} navigate={navigate} />
      <ProductSection title="Skin Care" products={skinCare} addToCart={addToCart} navigate={navigate} />



      {/* 🛡️ 10. WHY CHOOSE MEDIQUICK */}
      <section className="py-16 bg-white border-t border-dark/5 select-none">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-dark mb-10">Why Choose MediQuick?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="flex flex-col items-center space-y-3 bg-background/30 p-5 rounded-2xl border border-dark/5">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 shadow-soft flex items-center justify-center text-xl">
                ✔️
              </div>
              <h4 className="font-bold text-dark text-sm">Genuine Medicines</h4>
              <p className="text-[11px] text-dark/55 leading-relaxed font-light">100% genuine pharmaceutical stock batches.</p>
            </div>

            <div className="flex flex-col items-center space-y-3 bg-background/30 p-5 rounded-2xl border border-dark/5">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 shadow-soft flex items-center justify-center text-xl">
                🛡️
              </div>
              <h4 className="font-bold text-dark text-sm">Licensed Pharmacy</h4>
              <p className="text-[11px] text-dark/55 leading-relaxed font-light">Operated by registered medical pharmacists.</p>
            </div>

            <div className="flex flex-col items-center space-y-3 bg-background/30 p-5 rounded-2xl border border-dark/5">
              <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 shadow-soft flex items-center justify-center text-xl">
                ⚡
              </div>
              <h4 className="font-bold text-dark text-sm">Fast Delivery</h4>
              <p className="text-[11px] text-dark/55 leading-relaxed font-light">Lightning priority shipping under 1 hour.</p>
            </div>

            <div className="flex flex-col items-center space-y-3 bg-background/30 p-5 rounded-2xl border border-dark/5">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 shadow-soft flex items-center justify-center text-xl">
                🔒
              </div>
              <h4 className="font-bold text-dark text-sm">Secure Payment</h4>
              <p className="text-[11px] text-dark/55 leading-relaxed font-light">Fully encrypted checkouts and UPI options.</p>
            </div>

            <div className="col-span-2 lg:col-span-1 flex flex-col items-center space-y-3 bg-background/30 p-5 rounded-2xl border border-dark/5">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 shadow-soft flex items-center justify-center text-xl">
                📞
              </div>
              <h4 className="font-bold text-dark text-sm">24x7 Support</h4>
              <p className="text-[11px] text-dark/55 leading-relaxed font-light">On-call pharmacists available at any hour.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🗣️ 11. TESTIMONIALS (Carousel Slider Auto-slides every 5s) */}
      <section className="py-16 bg-[#F8FCFC] border-t border-dark/5 select-none">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark">Customer Testimonials</h2>
            <p className="text-xs text-dark/45 font-light mt-1">Check verified patient reviews</p>
          </div>

          <div className="relative min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft text-left flex flex-col justify-between h-52 relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(TESTIMONIALS[activeTestimonial].rating)].map((_, i) => (
                      <MdStar key={i} className="text-base" />
                    ))}
                  </div>
                  <p className="text-xs text-dark/70 italic leading-relaxed font-light line-clamp-4">
                    "{TESTIMONIALS[activeTestimonial].text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-dark/5">
                  <div className={`w-8 h-8 rounded-full ${TESTIMONIALS[activeTestimonial].avatarBg} text-white flex items-center justify-center font-bold text-xs uppercase`}>
                    {TESTIMONIALS[activeTestimonial].name[0]}
                  </div>
                  <div className="overflow-hidden leading-tight">
                    <span className="text-xs font-bold text-dark block truncate">{TESTIMONIALS[activeTestimonial].name}</span>
                    <span className="text-[10px] text-dark/40 font-medium block truncate">{TESTIMONIALS[activeTestimonial].location}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all outline-none ${activeTestimonial === i ? 'bg-primary w-5' : 'bg-dark/20'}`}
              />
            ))}
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
