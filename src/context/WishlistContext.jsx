import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db, isConfigValid } from '../firebase/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();

  const [wishlistIds, setWishlistIds] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync wishlist from Firestore (or LocalStorage fallback)
  useEffect(() => {
    if (!currentUser) {
      // If user is logged out, clear wishlist state
      setWishlistIds([]);
      return;
    }

    if (isConfigValid && db) {
      setLoading(true);
      const docRef = doc(db, 'wishlists', currentUser.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setWishlistIds(docSnap.data().productIds || []);
        } else {
          setWishlistIds([]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to Firestore wishlist:", error);
        // Fallback to local storage on error
        const local = localStorage.getItem(`mediquick_wishlist_${currentUser.uid}`);
        setWishlistIds(local ? JSON.parse(local) : []);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      // Local storage fallback for mock environment
      const local = localStorage.getItem(`mediquick_wishlist_${currentUser.uid}`);
      setWishlistIds(local ? JSON.parse(local) : []);
    }
  }, [currentUser]);

  // Sync to local storage for offline / mock fallback
  useEffect(() => {
    if (currentUser && (!isConfigValid || !db)) {
      localStorage.setItem(`mediquick_wishlist_${currentUser.uid}`, JSON.stringify(wishlistIds));
    }
  }, [wishlistIds, currentUser]);

  // Keep track of the previous state of cartItems to detect new additions/increases
  const prevCartItemsRef = useRef(cartItems);

  // Auto-remove item from wishlist when it is added to the cart
  useEffect(() => {
    if (!currentUser || wishlistIds.length === 0) {
      prevCartItemsRef.current = cartItems;
      return;
    }

    // Find items whose quantity has increased in the cart
    const addedItems = cartItems.filter((item) => {
      const prevItem = prevCartItemsRef.current.find((i) => i.id === item.id);
      const prevQty = prevItem ? prevItem.quantity : 0;
      return item.quantity > prevQty;
    });

    if (addedItems.length > 0) {
      // Find which of these added items are currently in the wishlist
      const idsToRemove = addedItems
        .map((item) => item.id)
        .filter((id) => wishlistIds.includes(id));

      if (idsToRemove.length > 0) {
        const updatedIds = wishlistIds.filter((id) => !idsToRemove.includes(id));
        setWishlistIds(updatedIds);

        // Persist change to database or localStorage
        if (isConfigValid && db) {
          const docRef = doc(db, 'wishlists', currentUser.uid);
          setDoc(docRef, { productIds: updatedIds }, { merge: true }).catch((err) => {
            console.error("Failed to update wishlist in Firestore:", err);
          });
        } else {
          localStorage.setItem(`mediquick_wishlist_${currentUser.uid}`, JSON.stringify(updatedIds));
        }
      }
    }

    prevCartItemsRef.current = cartItems;
  }, [cartItems, currentUser, wishlistIds]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const isInWishlist = (productId) => {
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = async (product) => {
    if (!currentUser) {
      localStorage.setItem('mediquick_pending_action', JSON.stringify({
        type: 'TOGGLE_WISHLIST',
        payload: { product }
      }));
      // Redirect to login page and preserve redirect path
      showToast("Please login to manage wishlist");
      navigate('/login', { state: { from: location } });
      return;
    }

    const isAdded = wishlistIds.includes(product.id);
    let updatedIds;

    if (isAdded) {
      updatedIds = wishlistIds.filter((id) => id !== product.id);
      showToast("Removed from Wishlist");
    } else {
      updatedIds = [...wishlistIds, product.id];
      showToast("Added to Wishlist ❤️");
    }

    // Optimistically update client state
    setWishlistIds(updatedIds);

    // Persist to database or localStorage
    if (isConfigValid && db) {
      try {
        const docRef = doc(db, 'wishlists', currentUser.uid);
        await setDoc(docRef, { productIds: updatedIds }, { merge: true });
      } catch (err) {
        console.error("Failed to update wishlist in Firestore:", err);
      }
    } else {
      localStorage.setItem(`mediquick_wishlist_${currentUser.uid}`, JSON.stringify(updatedIds));
    }
  };

  const value = {
    wishlistIds,
    loading,
    isInWishlist,
    toggleWishlist,
    showToast
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
      
      {/* Toast Notification Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="flex items-center gap-2.5 bg-dark text-white border border-white/10 px-4 py-3 rounded-xl shadow-premium text-xs font-bold pointer-events-auto leading-none select-none"
            >
              <span>{toast.message.includes('❤️') ? '❤️' : '✨'}</span>
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </WishlistContext.Provider>
  );
}
