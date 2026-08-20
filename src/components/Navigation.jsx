import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { 
  MdRoom, 
  MdSearch, 
  MdShoppingCart, 
  MdAccountCircle, 
  MdUploadFile, 
  MdKeyboardArrowDown,
  MdLogout,
  MdReceipt,
  MdSettings,
  MdMenu,
  MdClose,
  MdFavoriteBorder
} from 'react-icons/md';
import { useProducts } from '../context/ProductsContext';
import { useNotifications } from '../context/NotificationContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navigation() {
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();
  const { currentUser, logout } = useAuth();
  const { cartItems } = useCart();
  const { address, setIsLocationModalOpen, loading: locLoading } = useLocation();
  const { products: productsData, categories, isProductsSynced, productsSyncError } = useProducts();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const { wishlistIds } = useWishlist();
  const wishlistCount = wishlistIds.length;
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileCat, setActiveMobileCat] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);
  const moreMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownOpen) {
        const clickedOutsideDesktop = !desktopProfileRef.current || !desktopProfileRef.current.contains(event.target);
        const clickedOutsideMobile = !mobileProfileRef.current || !mobileProfileRef.current.contains(event.target);
        if (clickedOutsideDesktop && clickedOutsideMobile) {
          setProfileDropdownOpen(false);
        }
      }
    }

    function handleKeyDown(event) {
      if (profileDropdownOpen && event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (moreMenuOpen && event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreMenuOpen]);
 
  // Close Alerts dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (notificationsOpen && event.key === "Escape") {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  // Close Alerts dropdown when navigating to another page
  useEffect(() => {
    setNotificationsOpen(false);
  }, [routeLocation.pathname]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(routeLocation.pathname);

  useEffect(() => {
    if (routeLocation.pathname !== '/medicines') {
      setSearchQuery("");
    } else {
      const params = new URLSearchParams(routeLocation.search);
      const urlQuery = params.get('search') || "";
      if (searchQuery !== urlQuery) {
        setSearchQuery(urlQuery);
      }
    }
  }, [routeLocation.pathname, routeLocation.search]);

  const isHomeActive = routeLocation.pathname === '/';
  const isLabTestsActive = routeLocation.pathname === '/medicines' && 
    (routeLocation.search.toLowerCase().includes('category=lab') ||
     decodeURIComponent(routeLocation.search).toLowerCase().includes('category=lab tests'));
  const isMedicinesActive = routeLocation.pathname === '/medicines' && 
    !isLabTestsActive;
  const isBlogsActive = routeLocation.pathname === '/blogs' || routeLocation.pathname === '/health-blogs';
  const isContactActive = routeLocation.pathname === '/contact';

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val.trim().length > 1) {
      const query = val.toLowerCase();
      const filtered = productsData.filter(p => 
        p.medicine_name.toLowerCase().includes(query) ||
        p.generic_name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/medicines');
    }
  };

  const handleLogoutClick = async () => {
    try {
      navigate('/', { replace: true });
      await logout();
      setProfileDropdownOpen(false);
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col shadow-soft select-none font-sans bg-white">
      {/* Offline/Sync Warning Banner */}
      {!isProductsSynced && productsSyncError && (
        <div className="w-full bg-amber-50 border-b border-amber-200 py-1.5 px-4 text-center text-xs text-amber-800 flex items-center justify-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span>Offline mode: Using cached products database. Real-time updates are temporarily unavailable.</span>
        </div>
      )}
      
      {/* 🚀 DESKTOP/TABLET HEADER (Hidden on small mobile screens below md) */}
      <div className="hidden md:block w-full bg-white/95 backdrop-blur-md border-b border-dark/5 py-4 lg:py-5 relative z-10">
        <div className="container mx-auto px-4 lg:px-6 flex flex-row items-center justify-between gap-4 lg:gap-8">
          
          {/* Left section: Logo + Search */}
          <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 flex-grow w-full lg:w-auto">
            {/* Tablet Hamburger Drawer Trigger */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-dark/75 hover:text-primary transition-colors focus:outline-none p-1.5 -ml-1 cursor-pointer shrink-0"
            >
              <MdMenu className="text-2xl" />
            </button>
 
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm font-bold">
                +
              </div>
              <span className="text-xl font-extrabold tracking-tight text-primary">
                MediQuick
              </span>
            </Link>
 
            {/* Centered Autocomplete Search Bar */}
            {!routeLocation.pathname.startsWith('/admin') && (
              <div className="flex-grow w-[90%] lg:max-w-xl mx-4 lg:mx-8 relative">
                <form 
                  onSubmit={handleSearchSubmit}
                  className="w-full flex items-center bg-background border border-dark/5 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
                >
                  <div className="pl-4 text-dark/45 shrink-0">
                    <MdSearch className="text-xl" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search medicines, brand or category..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length > 1) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 250);
                    }}
                    className="w-full px-3 py-2.5 bg-transparent text-sm outline-none text-dark"
                  />
                </form>
 
                {/* Suggestions Overlay */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-dark/5 rounded-2xl shadow-premium overflow-hidden z-50 text-left">
                    {suggestions.map((p) => (
                      <div
                        key={p.id}
                        onMouseDown={() => {
                          setSearchQuery(p.medicine_name);
                          setShowSuggestions(false);
                          navigate(`/product/${p.id}`);
                        }}
                        className="px-4 py-2.5 hover:bg-background cursor-pointer flex items-center justify-between border-b border-dark/5 last:border-0"
                      >
                        <div>
                          <p className="text-xs font-bold text-dark">{p.medicine_name}</p>
                          <p className="text-[10px] text-dark/45 font-medium leading-none mt-0.5">{p.brand} • {p.category}</p>
                        </div>
                        {p.prescription_required && (
                          <span className="bg-red-50 text-red-600 border border-red-200/50 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Rx Required
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
 
          {/* Right Action Icons (Vertically Stacked Icon + Label) */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 shrink-0 text-dark/75">
            
            {/* Notification Icon */}
            <div ref={notificationsRef} className="hidden lg:block relative">
              <button 
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-1.5 rounded-xl group hover:bg-primary/5 transition-all duration-200 outline-none cursor-pointer relative text-center bg-transparent border-none text-dark/75"
              >
                <div className="relative transition-transform duration-200 ease-out group-hover:scale-108 group-hover:text-primary">
                  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="text-[12px] lg:text-[13px] font-medium tracking-tight text-dark/65 mt-1.5 leading-none group-hover:text-primary transition-colors">Alerts</span>
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    {/* Mobile-only backdrop to avoid blocking/swallowing clicks on desktop */}
                    <div onClick={() => setNotificationsOpen(false)} className="block sm:hidden fixed inset-0 z-30 bg-dark/20" />
                    
                    {/* 1. DESKTOP/TABLET DROPDOWN */}
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="hidden sm:block absolute right-0 top-full mt-2 w-96 bg-white border border-dark/5 shadow-premium rounded-[24px] p-4 z-40 text-sm text-left"
                    >
                    <div className="flex items-center justify-between border-b border-dark/5 pb-2 mb-3 select-none">
                      <h4 className="font-extrabold text-[#063B44] text-xs sm:text-sm flex items-center gap-1.5">
                        🔔 Notifications {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} unread</span>}
                      </h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-primary hover:underline bg-transparent border-none outline-none cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-dark/40 italic text-xs">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              setNotificationsOpen(false);
                              if (notif.actionUrl === 'whatsapp') {
                                window.open("https://wa.me/919876543210", "_blank");
                              } else if (notif.actionUrl) {
                                navigate(notif.actionUrl);
                              }
                            }}
                            className={`p-3 rounded-xl border border-dark/5 transition-all cursor-pointer text-left flex gap-3 hover:bg-background ${!notif.isRead ? 'bg-[#E2F3F0]/20 border-primary/10 shadow-sm' : ''}`}
                          >
                            <span className="text-lg self-start mt-0.5">{getNotifIcon(notif.type)}</span>
                            <div className="space-y-0.5 overflow-hidden flex-grow">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-bold text-xs ${!notif.isRead ? 'text-primary-dark' : 'text-dark'}`}>{notif.title}</span>
                                {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                              </div>
                              <p className="text-[11px] text-dark/70 font-light leading-tight">{notif.message}</p>
                              <span className="text-[9px] text-dark/40 block pt-0.5">{formatTimeAgo(notif.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-dark/5 pt-2 mt-2 flex items-center justify-center select-none">
                      <button 
                        onClick={() => {
                          markAllAsRead();
                          setNotificationsOpen(false);
                        }}
                        className="text-[10px] font-bold text-primary-dark hover:underline bg-transparent border-none outline-none cursor-pointer"
                      >
                        Dismiss All Notifications
                      </button>
                    </div>
                  </motion.div>

                  {/* 2. MOBILE BOTTOM SHEET */}
                  <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "tween", duration: 0.25 }}
                    className="block sm:hidden fixed inset-x-0 bottom-0 max-h-[75vh] bg-white rounded-t-[32px] shadow-premium p-5 z-50 overflow-hidden flex flex-col border-t border-dark/5 text-left"
                  >
                    <div className="w-12 h-1.5 bg-dark/15 rounded-full mx-auto mb-4 shrink-0" />
                    
                    <div className="flex items-center justify-between border-b border-dark/5 pb-3 mb-3 select-none shrink-0">
                      <h4 className="font-extrabold text-[#063B44] text-base flex items-center gap-1.5">
                        🔔 Notifications {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
                      </h4>
                      <div className="flex items-center gap-4">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs font-bold text-primary hover:underline bg-transparent border-none outline-none cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button 
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-bold text-dark/40 hover:text-dark bg-transparent border-none outline-none cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 overflow-y-auto scrollbar-none flex-grow pb-6">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center text-dark/40 italic text-xs">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              setNotificationsOpen(false);
                              if (notif.actionUrl === 'whatsapp') {
                                window.open("https://wa.me/919876543210", "_blank");
                              } else if (notif.actionUrl) {
                                navigate(notif.actionUrl);
                              }
                            }}
                            className={`p-3.5 rounded-xl border border-dark/5 transition-all cursor-pointer flex gap-3 hover:bg-background ${!notif.isRead ? 'bg-[#E2F3F0]/20 border-primary/10' : ''}`}
                          >
                            <span className="text-lg self-start mt-0.5">{getNotifIcon(notif.type)}</span>
                            <div className="space-y-0.5 overflow-hidden flex-grow">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-bold text-xs ${!notif.isRead ? 'text-primary-dark' : 'text-dark'}`}>{notif.title}</span>
                                {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                              </div>
                              <p className="text-[11px] text-dark/70 font-light leading-normal">{notif.message}</p>
                              <span className="text-[9px] text-dark/40 block pt-0.5">{formatTimeAgo(notif.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            </div>


            {/* Login / Register Dropdown */}
            <div className="relative" ref={desktopProfileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-1.5 rounded-xl group hover:bg-primary/5 transition-all duration-200 outline-none cursor-pointer text-center bg-transparent border-none text-dark/75"
              >
                <MdAccountCircle className="text-[22px] transition-transform duration-200 ease-out group-hover:scale-108 group-hover:text-primary" />
                <span className="text-[12px] lg:text-[13px] font-medium tracking-tight text-dark/65 mt-1.5 leading-none group-hover:text-primary transition-colors">
                  {currentUser ? 'Account' : 'Login / Register'}
                </span>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white border border-dark/5 shadow-premium rounded-2xl p-2 z-40 text-sm text-left"
                  >
                    {currentUser ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-dark/5 leading-tight">
                          <p className="font-bold text-dark truncate">{currentUser.displayName || 'Customer'}</p>
                          <p className="text-[11px] text-dark/40 truncate">{currentUser.email}</p>
                        </div>
                        <div className="py-1">
                          <Link 
                            to="/profile" 
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-dark/85 hover:bg-background rounded-lg transition-colors"
                          >
                            <MdAccountCircle className="text-base text-dark/40" />
                            Profile
                          </Link>
                          {currentUser.role !== 'admin' && (
                            <Link 
                              to="/order-tracking" 
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-dark/85 hover:bg-background rounded-lg transition-colors"
                            >
                              <MdReceipt className="text-base text-dark/40" />
                              Track Orders
                            </Link>
                          )}
                          {currentUser.role === 'admin' && (
                            <Link 
                              to="/admin" 
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 text-secondary-dark hover:bg-background px-4 py-2 rounded-lg transition-colors"
                            >
                              <MdSettings className="text-base" />
                              Dashboard
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-dark/5 pt-1 mt-1">
                          <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <MdLogout className="text-base" />
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 space-y-2">
                        <Link 
                          to="/login"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full block text-center py-2 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          Login
                        </Link>
                        <Link 
                          to="/register"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full block text-center py-2 border border-primary/20 hover:bg-primary/5 text-primary font-bold text-xs rounded-xl transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist Link */}
            <Link 
              to="/wishlist"
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-1.5 rounded-xl group hover:bg-primary/5 transition-all duration-200 cursor-pointer relative text-center text-dark/75"
            >
              <div className="relative transition-transform duration-200 ease-out group-hover:scale-108 group-hover:text-primary">
                <MdFavoriteBorder className="text-[22px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[12px] lg:text-[13px] font-medium tracking-tight text-dark/65 mt-1.5 leading-none group-hover:text-primary transition-colors">Wishlist</span>
            </Link>

            {/* Shopping Cart */}
            <Link 
              to="/cart"
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-1.5 rounded-xl group hover:bg-primary/5 transition-all duration-200 cursor-pointer relative text-center text-dark/75"
            >
              <div className="relative transition-transform duration-200 ease-out group-hover:scale-108 group-hover:text-primary">
                <MdShoppingCart className="text-[22px]" />
                {cartItems.length > 0 && (
                  <span key={cartItems.length} className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none animate-badgePop">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <span className="text-[12px] lg:text-[13px] font-medium tracking-tight text-dark/65 mt-1.5 leading-none group-hover:text-primary transition-colors">Cart</span>
            </Link>

            {/* Location Selector (with pointer pin) */}
            {currentUser && (
              <div className="hidden lg:block">
                <button 
                  onClick={() => setIsLocationModalOpen(true)}
                  disabled={locLoading}
                  className="flex items-center gap-2 text-left max-w-[130px] lg:max-w-[180px] group p-1.5 rounded-xl hover:bg-primary/5 transition-all duration-200 outline-none shrink-0 cursor-pointer border-none bg-transparent"
                >
                  <MdRoom className={`text-[22px] text-primary shrink-0 transition-transform duration-200 ease-out group-hover:scale-108 ${locLoading ? 'animate-bounce' : ''}`} />
                  <div className="overflow-hidden leading-tight flex flex-col justify-center">
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider block">
                      Deliver to
                    </span>
                    <p className="text-[12px] lg:text-[13px] font-extrabold text-dark truncate">
                      {address || "Hyderabad, 500001"}
                    </p>
                  </div>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* 📱 MOBILE HEADER (Visible only on mobile below md) */}
      <div className="md:hidden w-full bg-white/95 border-b border-dark/5 flex flex-col relative z-10">
        {/* Top row: Hamburger Menu, Logo, Profile, Cart */}
        <div className="flex items-center justify-between px-4 max-[320px]:px-2 h-[54px] w-full border-b border-dark/5 mobile-header-row">
          <div className="flex items-center gap-3 max-[320px]:gap-1 mobile-header-left">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="text-dark/75 hover:text-primary transition-colors focus:outline-none p-1 max-[320px]:p-0 -ml-1 cursor-pointer mobile-header-menu-btn"
            >
              <MdMenu className="text-2xl" />
            </button>
            <Link to="/" className="flex items-center gap-1.5 max-[320px]:gap-1 shrink-0">
              <div className="w-8 h-8 max-[320px]:w-5.5 max-[320px]:h-5.5 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg max-[320px]:text-xs mobile-header-logo-badge">
                +
              </div>
              <span className="text-lg max-[320px]:text-[12px] font-black tracking-tight text-primary mobile-header-logo-text">
                MediQuick
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4 max-[320px]:gap-3 text-dark/75 shrink-0 mobile-header-right">
            {/* Account/Profile Dropdown Trigger */}
            <div className="relative shrink-0 flex items-center" ref={mobileProfileRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-center p-1 max-[320px]:p-0 max-[320px]:min-w-0 max-[320px]:min-h-0 cursor-pointer mobile-header-icon-btn"
              >
                <MdAccountCircle className="text-2xl" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-dark/5 shadow-premium rounded-xl p-1.5 z-40 text-xs text-left"
                  >
                    {currentUser ? (
                      <>
                        <div className="px-3 py-2 border-b border-dark/5 leading-tight">
                          <p className="font-bold text-dark truncate">{currentUser.displayName || 'Customer'}</p>
                          <p className="text-[10px] text-dark/40 truncate">{currentUser.email}</p>
                        </div>
                        <div className="py-1">
                          <Link 
                            to="/profile" 
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 text-dark/85 hover:bg-background rounded-lg transition-colors"
                          >
                            <MdAccountCircle className="text-sm text-dark/40" />
                            Profile
                          </Link>
                          {currentUser.role !== 'admin' && (
                            <Link 
                              to="/order-tracking" 
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 px-3 py-1.5 text-dark/85 hover:bg-background rounded-lg transition-colors"
                            >
                              <MdReceipt className="text-sm text-dark/40" />
                              Track Orders
                            </Link>
                          )}
                          {currentUser.role === 'admin' && (
                            <Link 
                              to="/admin" 
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 text-secondary-dark hover:bg-background px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <MdSettings className="text-sm" />
                              Dashboard
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-dark/5 pt-1 mt-1">
                          <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left"
                          >
                            <MdLogout className="text-sm" />
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-1.5 space-y-1.5">
                        <Link 
                          to="/login"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full block text-center py-2 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-[10px] uppercase rounded-lg transition-colors shadow-sm"
                        >
                          Login
                        </Link>
                        <Link 
                          to="/register"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full block text-center py-2 border border-primary/20 hover:bg-primary/5 text-primary font-bold text-[10px] uppercase rounded-lg transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative flex items-center justify-center p-1 max-[320px]:p-0 shrink-0 mobile-header-icon-btn">
              <div className="relative">
                <MdFavoriteBorder className="text-2xl" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                    {wishlistCount}
                  </span>
                )}
              </div>
            </Link>

            {/* Shopping Cart */}
            <Link to="/cart" className="relative flex items-center justify-center p-1 max-[320px]:p-0 shrink-0 mobile-header-icon-btn">
              <div className="relative">
                <MdShoppingCart className="text-2xl" />
                {cartItems.length > 0 && (
                  <span key={cartItems.length} className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none animate-badgePop">
                    {cartItems.length}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Second row: Search Bar */}
        {!routeLocation.pathname.startsWith('/admin') && (
          <div className="w-full px-3 py-3 bg-white relative">
            <form 
              onSubmit={handleSearchSubmit} 
              className="w-full h-11 flex items-center bg-background border border-dark/5 rounded-[12px] overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
            >
              <div className="pl-3.5 text-dark/45 shrink-0">
                <MdSearch className="text-xl" />
              </div>
              <input
                type="text"
                placeholder="Search medicines, brand..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 1) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 250);
                }}
                className="w-full px-2 h-full bg-transparent text-[15px] outline-none text-dark"
              />
            </form>
            
            {/* Suggestions Dropdown on Mobile */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-dark/5 rounded-xl shadow-premium overflow-hidden z-50 text-left">
                {suggestions.map((p) => (
                  <div
                    key={p.id}
                    onMouseDown={() => {
                      setSearchQuery(p.medicine_name);
                      setShowSuggestions(false);
                      navigate(`/product/${p.id}`);
                    }}
                    className="px-4 py-2 hover:bg-background cursor-pointer flex items-center justify-between border-b border-dark/5 last:border-0"
                  >
                    <div>
                      <p className="text-xs font-bold text-dark">{p.medicine_name}</p>
                      <p className="text-[9px] text-dark/45 font-medium leading-none mt-0.5">{p.brand} • {p.category}</p>
                    </div>
                    {p.prescription_required && (
                      <span className="bg-red-50 text-red-600 border border-red-200/50 text-[7px] font-bold px-1 py-0.5 rounded-md uppercase tracking-wider">
                        Rx
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📱 MOBILE SIDE DRAWER (Hamburger menu contents) */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-dark/40 backdrop-blur-sm z-50 transition-opacity"
          />
          
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-[280px] bg-white z-50 shadow-premium flex flex-col justify-between overflow-y-auto">
            <div className="p-5 space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-dark/5 pb-4">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
                    +
                  </div>
                  <span className="text-lg font-black tracking-tight text-primary">MediQuick</span>
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-dark/50 hover:text-red-500 rounded-full hover:bg-background p-1.5 cursor-pointer"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              {/* Deliver To (Location) Selector in Drawer */}
              <div className="bg-background/40 border border-dark/5 rounded-2xl p-3.5 space-y-2 text-left">
                {currentUser && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <MdRoom className="text-primary text-lg" />
                      <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider">Deliver to</span>
                    </div>
                    <p className="text-xs font-bold text-dark/75 line-clamp-2">
                      {address || "Hyderabad, 500001"}
                    </p>
                    <button
                      onClick={() => {
                        setIsLocationModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-center py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-colors mt-1 cursor-pointer border-none"
                    >
                      Update Location
                    </button>
                  </>
                )}
                
                {/* Navigation links list */}
                <nav className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] font-bold text-dark/40 uppercase tracking-wider px-3 mb-1">Quick Links</span>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-bold text-dark/75 hover:bg-background hover:text-primary rounded-lg transition-colors">Home</Link>
                  <Link to="/medicines" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-bold text-dark/75 hover:bg-background hover:text-primary rounded-lg transition-colors">Medicines</Link>
                  <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-bold text-dark/75 hover:bg-background hover:text-primary rounded-lg transition-colors">Wishlist</Link>
                  <Link to="/medicines?category=Lab%20Tests" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-bold text-dark/75 hover:bg-background hover:text-primary rounded-lg transition-colors">Lab Tests</Link>
                  <Link to="/blogs" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-bold text-dark/75 hover:bg-background hover:text-primary rounded-lg transition-colors">Health Blogs</Link>
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-bold text-dark/75 hover:bg-background hover:text-primary rounded-lg transition-colors">Contact</Link>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setNotificationsOpen(true);
                    }} 
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-dark/75 hover:bg-background hover:text-primary rounded-lg transition-colors bg-transparent border-0 text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">🔔</span> Notifications
                    </span>
                  </button>
                </nav>
              </div>

              {/* Categories collapsible/accordion list */}
              <div className="space-y-2 text-left border-t border-dark/5 pt-4">
                  <span className="text-[10px] font-bold text-dark/40 uppercase tracking-wider px-3 block mb-1.5">Shop by Category</span>
                  <div className="space-y-2 px-1">
                    <Link 
                      to="/categories" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-2.5 p-3 bg-primary/5 border border-primary/20 hover:bg-primary/10 rounded-xl transition-all text-xs font-extrabold text-primary"
                    >
                      <span className="text-base select-none">🗂️</span>
                      <span>All Categories</span>
                    </Link>

                    {categories && categories.filter(cat => cat.status !== 'inactive').map((cat) => {
                      const isExpanded = activeMobileCat === cat.id;
                      return (
                        <div key={cat.id || cat.name} className="border border-dark/5 rounded-xl bg-background/25 overflow-hidden">
                          {/* Accordion Header Row */}
                          <div className="flex items-center justify-between p-2.5 bg-white">
                            <Link 
                              to={`/medicines?category=${encodeURIComponent(cat.name)}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2 text-xs font-bold text-dark/85 hover:text-primary transition-colors"
                            >
                              <span className="text-sm select-none">{cat.icon || '📦'}</span>
                              <span className="truncate">{cat.name}</span>
                            </Link>
                            
                            <button
                              onClick={() => setActiveMobileCat(isExpanded ? null : cat.id)}
                              className="p-1 text-dark/40 hover:text-primary cursor-pointer"
                            >
                              <MdKeyboardArrowDown className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {/* Accordion Children Panel */}
                          {isExpanded && (
                            <div className="border-t border-dark/5 bg-white/70 p-2 space-y-1.5 text-left pl-3.5">
                              {cat.subcategories && cat.subcategories.length > 0 ? (
                                cat.subcategories.map((subcat) => (
                                  <Link
                                    key={subcat}
                                    to={`/medicines?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(subcat)}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block text-[11px] text-dark/65 hover:text-primary py-0.5"
                                  >
                                    • {subcat}
                                  </Link>
                                ))
                              ) : (
                                <p className="text-[10px] text-dark/30 italic">No subcategories</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* Action buttons inside drawer */}
              {currentUser && (
                <div className="border-t border-dark/5 pt-4">
                  <Link 
                    to="/upload-prescription"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 bg-[#00897B] hover:bg-[#00695C] text-white font-bold text-xs uppercase rounded-xl transition-colors shadow-sm"
                  >
                    <MdUploadFile className="text-base" /> Upload Prescription
                  </Link>
                </div>
              )}

            </div>

            {/* Bottom Account segment */}
            <div className="border-t border-dark/5 p-4 bg-background/25">
              {currentUser ? (
                <div className="space-y-3">
                  <div className="text-left leading-tight">
                    <p className="font-bold text-dark text-xs truncate">{currentUser.displayName || 'Customer'}</p>
                    <p className="text-[10px] text-dark/45 truncate">{currentUser.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      to="/profile" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-grow text-center py-2 bg-primary hover:bg-primary-dark text-white font-bold text-[10px] uppercase rounded-lg transition-colors"
                    >
                      Profile
                    </Link>
                    {currentUser.role !== 'admin' && (
                      <Link 
                        to="/order-tracking" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-grow text-center py-2 bg-[#00897B] hover:bg-[#00695C] text-white font-bold text-[10px] uppercase rounded-lg transition-colors"
                      >
                        Orders
                      </Link>
                    )}
                    {currentUser.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-grow text-center py-2 bg-secondary hover:bg-secondary-dark text-white font-bold text-[10px] uppercase rounded-lg transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogoutClick}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 border border-primary/20 hover:bg-primary/5 text-primary font-bold text-xs rounded-xl transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* 🚀 NAVIGATION BAR (Emerald-Green Strip) (Hidden on mobile) */}
      <div className="hidden md:block w-full bg-[#00897B] text-white relative">
        <div className="container mx-auto px-4 flex items-center gap-4 h-11 text-xs sm:text-sm font-semibold">
          
          {/* Categories dropdown tab (Fixed, no overflow clipping) */}
          <div 
            className="relative h-full shrink-0"
            onMouseEnter={() => setCategoriesDropdownOpen(true)}
            onMouseLeave={() => setCategoriesDropdownOpen(false)}
          >
            <button 
              type="button"
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className="flex items-center gap-1 px-4 bg-[#00695C] hover:bg-[#004D40] h-full text-xs font-bold uppercase transition-colors outline-none cursor-pointer select-none"
            >
              <MdMenu className="text-base" />
              All Categories
              <MdKeyboardArrowDown className="text-base" />
            </button>

            <AnimatePresence>
              {categoriesDropdownOpen && (
                <>
                  <div onClick={() => setCategoriesDropdownOpen(false)} className="fixed inset-0 z-30" />
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-0 mt-0.5 w-[768px] bg-white border border-dark/5 shadow-premium rounded-b-[24px] p-6 z-40 text-sm text-left max-h-[480px] overflow-y-auto scrollbar-thin"
                  >
                  <div className="flex items-center justify-between border-b border-dark/5 pb-3 mb-4 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🗂️</span>
                      <span className="font-extrabold text-dark text-sm sm:text-base">Browse All Categories</span>
                    </div>
                    <Link 
                      to="/categories" 
                      onClick={() => setCategoriesDropdownOpen(false)} 
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      View Catalog Catalog →
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    {categories && categories.filter(cat => cat.status !== 'inactive').length > 0 ? (
                      categories.filter(cat => cat.status !== 'inactive').map((cat) => (
                        <div key={cat.id || cat.name} className="space-y-2 text-left">
                          {/* Category Header Link */}
                          <Link 
                            to={`/medicines?category=${encodeURIComponent(cat.name)}`} 
                            onClick={() => setCategoriesDropdownOpen(false)} 
                            className="flex items-center gap-2 text-dark font-black hover:text-primary transition-colors pb-1 border-b border-dark/5"
                          >
                            <span className="text-sm select-none">{cat.icon || '📦'}</span>
                            <span className="truncate">{cat.name}</span>
                          </Link>
                          
                          {/* Subcategories List */}
                          {cat.subcategories && cat.subcategories.length > 0 ? (
                            <div className="space-y-1.5 pl-1">
                              {cat.subcategories.map((subcat) => (
                                <Link
                                    key={subcat}
                                    to={`/medicines?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(subcat)}`}
                                    onClick={() => setCategoriesDropdownOpen(false)}
                                    className="flex items-center text-xs text-dark/65 hover:text-primary transition-all hover:pl-1"
                                >
                                  <span className="text-[9px] mr-1 text-primary-dark/60">▶</span>
                                  <span className="truncate">{subcat}</span>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-dark/30 italic pl-1">No subcategories</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="col-span-3 text-center py-4 text-xs text-dark/40 italic">No categories loaded</span>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          </div>

          <div className="flex items-center justify-between overflow-visible h-full flex-grow pl-6 lg:pl-12">
            <Link to="/" className={`w-28 h-8.5 inline-flex items-center justify-center text-center rounded-lg transition-colors shrink-0 ${isHomeActive ? "bg-[#00695C] text-white font-bold" : "text-white/85 hover:text-white hover:bg-[#00796B]/50"}`}>Home</Link>
            <Link to="/medicines" className={`w-28 h-8.5 inline-flex items-center justify-center text-center rounded-lg transition-colors shrink-0 ${isMedicinesActive ? "bg-[#00695C] text-white font-bold" : "text-white/85 hover:text-white hover:bg-[#00796B]/50"}`}>Medicines</Link>
            <Link to="/medicines?category=Lab%20Tests" className={`w-28 h-8.5 inline-flex items-center justify-center text-center rounded-lg transition-colors shrink-0 ${isLabTestsActive ? "bg-[#00695C] text-white font-bold" : "text-white/85 hover:text-white hover:bg-[#00796B]/50"}`}>Lab Tests</Link>
            
            <Link to="/blogs" className={`w-28 h-8.5 hidden lg:inline-flex items-center justify-center text-center rounded-lg transition-colors shrink-0 ${isBlogsActive ? "bg-[#00695C] text-white font-bold" : "text-white/85 hover:text-white hover:bg-[#00796B]/50"}`}>Health Blogs</Link>
            <Link to="/contact" className={`w-28 h-8.5 hidden lg:inline-flex items-center justify-center text-center rounded-lg transition-colors shrink-0 ${isContactActive ? "bg-[#00695C] text-white font-bold" : "text-white/85 hover:text-white hover:bg-[#00796B]/50"}`}>Contact</Link>
 
            {/* Tablet "More" Dropdown Menu */}
            <div ref={moreMenuRef} className="lg:hidden relative shrink-0">
              <button 
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="text-white/85 hover:text-white hover:bg-[#00796B]/50 transition-colors rounded-lg px-3 py-1.5 flex items-center gap-1 font-bold cursor-pointer bg-transparent border-none"
              >
                More <span>⋮</span>
              </button>
 
              <AnimatePresence>
                {moreMenuOpen && (
                  <>
                    <div onClick={() => setMoreMenuOpen(false)} className="fixed inset-0 z-30" />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-dark/5 shadow-premium rounded-xl py-2 z-40 text-sm text-left flex flex-col"
                    >
                    <Link 
                      to="/blogs" 
                      onClick={() => setMoreMenuOpen(false)} 
                      className={`px-4 py-2 hover:bg-background transition-colors font-bold ${isBlogsActive ? 'text-primary' : 'text-dark/75'}`}
                    >
                      Health Blogs
                    </Link>
                    <Link 
                      to="/contact" 
                      onClick={() => setMoreMenuOpen(false)} 
                      className={`px-4 py-2 hover:bg-background transition-colors font-bold ${isContactActive ? 'text-primary' : 'text-dark/75'}`}
                    >
                      Contact
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            </div>
          </div>

          
        </div>
      </div>

    </header>
  );
}

const getNotifIcon = (type) => {
  switch (type) {
    case 'order_confirmed': return '✅';
    case 'order_shipped': return '🚚';
    case 'prescription_approved': return '💊';
    case 'prescription_rejected': return '⚠';
    case 'offers': return '🎉';
    case 'order_delivered': return '📦';
    case 'whatsapp_support': return '💬';
    default: return '🔔';
  }
};

const formatTimeAgo = (dateStr) => {
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
};
