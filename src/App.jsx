import React, { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { LocationProvider } from './context/LocationContext';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider, useCart } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import AppRoutes from './routes/AppRoutes';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LocationModal from './components/LocationModal';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const { systemSettings } = useSettings();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  // Auto redirect Firebase action links to reset-password
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hash = location.hash || '';
    const hashQuery = hash.includes('?') ? hash.split('?')[1] : hash.replace(/^#\/?/, '');
    const hashParams = new URLSearchParams(hashQuery);

    const mode = searchParams.get('mode') || hashParams.get('mode');
    const oobCode = searchParams.get('oobCode') || hashParams.get('oobCode');

    if ((mode === 'resetPassword' || oobCode) && 
        !['/reset-password', '/resetpassword'].includes(pathname)) {
      const query = location.search || (hashQuery ? `?${hashQuery}` : '');
      navigate(`/reset-password${query}`, { replace: true });
    }
  }, [pathname, location.search, location.hash, navigate]);

  // Recovery effect for global guest actions after logging in
  useEffect(() => {
    if (currentUser) {
      const pendingStr = localStorage.getItem('mediquick_pending_action');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending.type === 'ADD_TO_CART') {
            localStorage.removeItem('mediquick_pending_action');
            addToCart(pending.payload.item, pending.payload.qty);
          } else if (pending.type === 'TOGGLE_WISHLIST') {
            localStorage.removeItem('mediquick_pending_action');
            toggleWishlist(pending.payload.product);
          } else if (pending.type === 'BUY_NOW') {
            localStorage.removeItem('mediquick_pending_action');
            if (pending.payload?.product) {
              addToCart(pending.payload.product, pending.payload.quantity || 1);
              navigate('/checkout', { state: { buyNowProduct: pending.payload.product } });
            }
          }
        } catch (e) {
          console.error("Error executing pending action in AppContent:", e);
        }
      }
    }
  }, [currentUser, addToCart, toggleWishlist, navigate]);

  const isAdmin = currentUser?.role === 'admin';
  const isMaintenance = systemSettings?.maintenanceMode && !isAdmin;

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-[#F8FCFC] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-md bg-white border border-dark/5 p-8 sm:p-10 rounded-[32px] shadow-premium space-y-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm animate-pulse">
            🔧
          </div>
          <h1 className="text-2xl font-extrabold text-[#063B44] tracking-tight">
            Under Maintenance
          </h1>
          <p className="text-xs text-dark/60 leading-relaxed">
            MediQuick is currently undergoing scheduled system maintenance to improve our service. We'll be back shortly! Thank you for your patience.
          </p>
          <div className="pt-4 border-t border-dark/5 text-left space-y-2 text-[11px] text-dark/50">
            <p className="flex justify-between">
              <span>Status:</span>
              <span className="font-semibold text-amber-600">Offline for Maintenance</span>
            </p>
            {systemSettings?.supportPhone && (
              <p className="flex justify-between">
                <span>Support Contact:</span>
                <span className="font-semibold text-primary">{systemSettings.supportPhone}</span>
              </p>
            )}
            {systemSettings?.supportEmail && (
              <p className="flex justify-between">
                <span>Support Email:</span>
                <span className="font-semibold text-primary">{systemSettings.supportEmail}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-dark">
      <ScrollToTop />
      {/* Premium Navigation Header */}
      <Navigation />
      
      {/* Global Location Modal */}
      <LocationModal />
      
      {/* Main Content Area */}
      <main className="flex-grow page-entrance" key={pathname}>
        <AppRoutes />
      </main>
      
      {/* Clean Trust-focused Footer */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <LocationProvider>
            <ProductsProvider>
              <CartProvider>
                <NotificationProvider>
                  <WishlistProvider>
                    <AppContent />
                  </WishlistProvider>
                </NotificationProvider>
              </CartProvider>
            </ProductsProvider>
          </LocationProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

