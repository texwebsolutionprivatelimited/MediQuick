import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { 
  MdLocalPharmacy, 
  MdRoom, 
  MdSearch, 
  MdShoppingCart, 
  MdAccountCircle, 
  MdUploadFile, 
  MdKeyboardArrowDown,
  MdLogout,
  MdReceipt,
  MdSettings,
  MdMenu
} from 'react-icons/md';
import { useProducts } from '../context/ProductsContext';

export default function Navigation() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { cartItems } = useCart();
  const { address, detectLocation, loading: locLoading } = useLocation();
  const { products: productsData } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/medicines?search=${encodeURIComponent(searchQuery.trim())}`);
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

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col shadow-soft select-none font-sans">
      
      {/* 🚀 TOP HEADER (White Glassmorphic Area) */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-dark/5 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm font-bold">
              +
            </div>
            <span className="text-xl font-extrabold tracking-tight text-primary">
              MediQuick
            </span>
          </Link>

          {/* Location Selector (with pointer pin) */}
          <button 
            onClick={detectLocation}
            disabled={locLoading}
            className="hidden md:flex items-center gap-1.5 text-left max-w-[200px] hover:opacity-80 transition-opacity outline-none shrink-0"
          >
            <MdRoom className={`text-xl text-primary shrink-0 ${locLoading ? 'animate-bounce' : ''}`} />
            <div className="overflow-hidden leading-tight">
              <span className="text-[10px] text-dark/40 font-bold uppercase tracking-wider block">Deliver to</span>
              <p className="text-xs font-bold text-dark/70 truncate">
                {address || "Hyderabad, 500001"}
              </p>
            </div>
          </button>

          {/* Centered Autocomplete Search Bar */}
          <div className="flex-grow max-w-xl relative">
            <form 
              onSubmit={handleSearchSubmit}
              className="w-full flex items-center bg-background border border-dark/5 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
            >
              <div className="pl-4 text-dark/45 shrink-0">
                <MdSearch className="text-xl" />
              </div>
              <input
                type="text"
                placeholder="Search medicines, healthcare products, brand or category..."
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

          {/* Right Action Icons (Vertically Stacked Icon + Label) */}
          <div className="flex items-center gap-6 shrink-0 text-dark/75">
            
            {/* Notification Icon */}
            <button className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors outline-none cursor-pointer relative text-center">
              <div className="relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0.5 w-2 h-2 bg-secondary rounded-full border border-white animate-pulse" />
              </div>
              <span className="text-[9px] font-bold tracking-tight text-dark/60 leading-none mt-0.5">Alerts</span>
            </button>

            {/* Upload Prescription */}
            <Link 
              to="/upload-prescription"
              className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors cursor-pointer select-none text-center"
            >
              <MdUploadFile className="text-xl" />
              <span className="text-[9px] font-bold tracking-tight text-dark/60 leading-none">Upload<br />Prescription</span>
            </Link>

            {/* Login / Register Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors outline-none text-center"
              >
                <MdAccountCircle className="text-xl" />
                <span className="text-[9px] font-bold tracking-tight text-dark/60 leading-none">
                  {currentUser ? (currentUser.displayName || 'Account') : 'Login / Register'}
                </span>
              </button>

              {profileDropdownOpen && (
                <>
                  <div onClick={() => setProfileDropdownOpen(false)} className="fixed inset-0 z-30" />
                  <div className="absolute right-0 mt-3.5 w-52 bg-white border border-dark/5 shadow-premium rounded-2xl p-2 z-40 text-sm text-left">
                    {currentUser ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-dark/5 leading-tight">
                          <p className="font-bold text-dark truncate">{currentUser.displayName || 'Customer'}</p>
                          <p className="text-[11px] text-dark/40 truncate">{currentUser.email}</p>
                        </div>
                        <div className="py-1">
                          <Link 
                            to="/order-tracking" 
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-dark/85 hover:bg-background rounded-lg transition-colors"
                          >
                            <MdReceipt className="text-base text-dark/40" />
                            Track Orders
                          </Link>
                          {currentUser.role === 'admin' && (
                            <Link 
                              to="/admin" 
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 text-secondary-dark hover:bg-background px-4 py-2 rounded-lg transition-colors"
                            >
                              <MdSettings className="text-base" />
                              Admin Dashboard
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
                          className="w-full block text-center py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          Sign In
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
                  </div>
                </>
              )}
            </div>

            {/* Shopping Cart */}
            <Link 
              to="/cart"
              className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors cursor-pointer relative text-center"
            >
              <div className="relative">
                <MdShoppingCart className="text-xl" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4.5 h-4.5 bg-secondary text-white text-[9px] font-black flex items-center justify-center rounded-full border border-white animate-pulse shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold tracking-tight text-dark/60 leading-none mt-0.5">Cart</span>
            </Link>

          </div>

        </div>
      </div>

      {/* 🚀 NAVIGATION BAR (Emerald-Green Strip) */}
      <div className="w-full bg-[#00897B] text-white">
        <div className="container mx-auto px-4 flex items-center justify-between h-11 text-xs sm:text-sm font-semibold">
          
          {/* Menu links list */}
          <div className="flex items-center gap-1 sm:gap-4 lg:gap-6 overflow-x-auto scrollbar-none h-full">
            
            {/* Categories dropdown tab */}
            <div className="relative h-full">
              <button 
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="flex items-center gap-1 px-4 bg-[#00695C] hover:bg-[#004D40] h-full text-xs font-bold uppercase transition-colors outline-none cursor-pointer"
              >
                <MdMenu className="text-base" />
                All Categories
                <MdKeyboardArrowDown className="text-base" />
              </button>

              {categoriesDropdownOpen && (
                <>
                  <div onClick={() => setCategoriesDropdownOpen(false)} className="fixed inset-0 z-30" />
                  <div className="absolute left-0 mt-0.5 w-56 bg-white border border-dark/5 shadow-premium rounded-b-2xl py-2 z-40 text-sm text-left">
                    <Link to="/medicines?category=prescription" onClick={() => setCategoriesDropdownOpen(false)} className="block px-4 py-2 text-dark/80 hover:bg-background transition-colors">Prescription Drugs</Link>
                    <Link to="/medicines?category=otc" onClick={() => setCategoriesDropdownOpen(false)} className="block px-4 py-2 text-dark/80 hover:bg-background transition-colors">OTC Medicines</Link>
                    <Link to="/medicines?category=babycare" onClick={() => setCategoriesDropdownOpen(false)} className="block px-4 py-2 text-dark/80 hover:bg-background transition-colors">Baby Care Essentials</Link>
                    <Link to="/medicines?category=ayurvedic" onClick={() => setCategoriesDropdownOpen(false)} className="block px-4 py-2 text-dark/80 hover:bg-background transition-colors">Ayurvedic Wellness</Link>
                  </div>
                </>
              )}
            </div>

            <Link to="/" className="hover:text-white/80 transition-colors py-3 shrink-0">Home</Link>
            <Link to="/medicines" className="hover:text-white/80 transition-colors py-3 shrink-0">Medicines</Link>
            <Link to="/medicines?category=healthcare" className="hover:text-white/80 transition-colors py-3 shrink-0">Healthcare</Link>
            <span className="hover:text-white/80 transition-colors py-3 cursor-pointer shrink-0">Lab Tests</span>
            <span className="hover:text-white/80 transition-colors py-3 cursor-pointer shrink-0">Offers</span>
            <span className="hover:text-white/80 transition-colors py-3 cursor-pointer shrink-0">Health Blogs</span>
            <Link to="/contact" className="hover:text-white/80 transition-colors py-3 shrink-0">Contact</Link>
          </div>
          
        </div>
      </div>

    </header>
  );
}
