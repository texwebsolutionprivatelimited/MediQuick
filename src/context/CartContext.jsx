import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db, isConfigValid } from '../firebase/firebase';
import { isCouponApplicableToCart, calculateEligibleDiscount } from '../utils/couponMatcher';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from './ProductsContext';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { products } = useProducts();

  const [rawCartItems, setRawCartItems] = useState(() => {
    const storedUser = localStorage.getItem('mediquick_current_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.uid) {
          const savedCart = localStorage.getItem(`mediquick_cart_${user.uid}`);
          if (savedCart) {
            return JSON.parse(savedCart);
          }
        }
      } catch (e) {
        console.error("Error initializing user cart:", e);
      }
    }
    return [];
  });

  const cartItems = useMemo(() => {
    return rawCartItems.map(item => {
      const latestProduct = products?.find(p => p.id === item.id);
      if (latestProduct) {
        return {
          ...item,
          price: latestProduct.price,
          mrp: latestProduct.mrp,
          medicine_name: latestProduct.medicine_name,
          brand: latestProduct.brand,
          stock: latestProduct.stock,
          prescription_required: latestProduct.prescription_required,
          image_url: latestProduct.image_url,
          discount_percentage: latestProduct.discount_percentage,
          last_updated: latestProduct.last_updated
        };
      }
      return item;
    });
  }, [rawCartItems, products]);

  const [coupon, setCoupon] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(() => {
    try {
      const storedUser = localStorage.getItem('mediquick_current_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const key = user?.uid ? `mediquick_rx_${user.uid}` : 'mediquick_rx_guest';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (_e) {
      return null;
    }
  });

  // Load user-specific cart and prescription from LocalStorage when currentUser changes
  useEffect(() => {
    if (loading) return;

    if (currentUser) {
      const userCartKey = `mediquick_cart_${currentUser.uid}`;
      const savedCart = localStorage.getItem(userCartKey);
      if (savedCart) {
        try {
          setRawCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Error loading user cart:", e);
          setRawCartItems([]);
        }
      } else {
        setRawCartItems([]);
      }

      const userRxKey = `mediquick_rx_${currentUser.uid}`;
      const savedRx = localStorage.getItem(userRxKey);
      if (savedRx) {
        try {
          setPrescriptionFile(JSON.parse(savedRx));
        } catch (_e) {}
      }
    } else {
      setRawCartItems([]);
      setCoupon(null);
      setPrescriptionFile(null);
    }
  }, [currentUser, loading]);

  // Save user-specific cart to LocalStorage when changed
  useEffect(() => {
    if (loading) return;
    if (currentUser) {
      const userCartKey = `mediquick_cart_${currentUser.uid}`;
      localStorage.setItem(userCartKey, JSON.stringify(rawCartItems));
    }
  }, [rawCartItems, currentUser, loading]);

  // Save user-specific prescription to LocalStorage when changed
  useEffect(() => {
    const rxKey = currentUser?.uid ? `mediquick_rx_${currentUser.uid}` : 'mediquick_rx_guest';
    if (prescriptionFile) {
      localStorage.setItem(rxKey, JSON.stringify(prescriptionFile));
    } else {
      localStorage.removeItem(rxKey);
    }
  }, [prescriptionFile, currentUser]);

  // Real-time Firestore sync for prescription review status
  useEffect(() => {
    if (prescriptionFile?.id && isConfigValid && db) {
      const docRef = doc(db, 'prescriptions', prescriptionFile.id);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newStatus = data.reviewStatus || 'pending';
          const newReason = data.rejectionReason || '';
          setPrescriptionFile(prev => {
            if (!prev || prev.id !== prescriptionFile.id) return prev;
            if (prev.reviewStatus === newStatus && prev.rejectionReason === newReason) return prev;
            return {
              ...prev,
              reviewStatus: newStatus,
              rejectionReason: newReason
            };
          });
        }
      }, (err) => {
        console.warn("Firestore prescription sync error in CartContext:", err);
      });
      return unsubscribe;
    }
  }, [prescriptionFile?.id]);

  const addToCart = (item, qty = 1) => {
    if (!currentUser) {
      localStorage.setItem('mediquick_pending_action', JSON.stringify({
        type: 'ADD_TO_CART',
        payload: { item, qty }
      }));
      navigate('/login', { state: { from: location } });
      return;
    }

    const latestProduct = products?.find(p => p.id === item.id) || item;
    const currentStock = Number(latestProduct.stock !== undefined ? latestProduct.stock : 0);

    if (currentStock <= 0) {
      alert("Out of Stock");
      return;
    }

    let limitExceeded = false;

    setRawCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.id === item.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + qty;

      if (targetQty > currentStock) {
        limitExceeded = true;
        return prevItems;
      }

      if (existing) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: targetQty } : i
        );
      }
      return [...prevItems, { ...item, quantity: qty }];
    });

    if (limitExceeded) {
      alert(`Only ${currentStock} items available`);
    }
  };

  const removeFromCart = (id) => {
    setRawCartItems((prevItems) => prevItems.filter((i) => i.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }

    const latestProduct = products?.find(p => p.id === id);
    const currentStock = latestProduct ? Number(latestProduct.stock !== undefined ? latestProduct.stock : 0) : 9999;

    if (qty > currentStock) {
      alert(`Only ${currentStock} items available`);
      return;
    }

    setRawCartItems((prevItems) =>
      prevItems.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => {
    setRawCartItems([]);
    setCoupon(null);
    setPrescriptionFile(null);
  };

  const [couponsList, setCouponsList] = useState([]);

  // Sync Coupons from Firestore (or LocalStorage fallback)
  useEffect(() => {
    if (isConfigValid && db) {
      const couponsRef = collection(db, 'coupons');
      const unsubscribe = onSnapshot(couponsRef, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setCouponsList(list);
      }, (error) => {
        console.error("Error listening to coupons:", error);
      });
      return unsubscribe;
    } else {
      const savedCoupons = localStorage.getItem('mediquick_local_coupons');
      if (savedCoupons) {
        setCouponsList(JSON.parse(savedCoupons));
      } else {
        const defaultCoupons = [
          { id: 'c1', couponCode: 'MED10', discount: 10, description: '10% OFF on all medicines', status: 'active', expiryDate: '2030-12-31', minimumOrder: 0, maximumDiscount: 500 },
          { id: 'c2', couponCode: 'QUICK20', discount: 20, description: '20% OFF (First Order)', status: 'active', expiryDate: '2030-12-31', minimumOrder: 100, maximumDiscount: 200 },
          { id: 'c3', couponCode: 'FLAT50', discount: 50, description: 'Flat ₹50 OFF', status: 'inactive', expiryDate: '2030-12-31', minimumOrder: 200, maximumDiscount: 50 }
        ];
        localStorage.setItem('mediquick_local_coupons', JSON.stringify(defaultCoupons));
        setCouponsList(defaultCoupons);
      }
    }
  }, []);

  const applyCoupon = (code, items = cartItems) => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Please enter a coupon code.' };
    }
    const codeUpper = code.trim().toUpperCase();
    const found = couponsList.find(c => c.couponCode.trim().toUpperCase() === codeUpper);

    if (!found) {
      return { success: false, message: 'Invalid coupon code.' };
    }

    if (found.status !== 'active') {
      return { success: false, message: 'This coupon is inactive.' };
    }

    // Check expiry
    const todayStr = new Date().toISOString().split('T')[0];
    if (found.expiryDate && found.expiryDate < todayStr) {
      return { success: false, message: 'This coupon has expired.' };
    }

    // Check minimum order
    const subtotal = getSubtotal(items);
    if (found.minimumOrder && subtotal < Number(found.minimumOrder)) {
      return { success: false, message: `Minimum order of ₹${found.minimumOrder} required to use this coupon.` };
    }

    // Validate that the coupon matches the discount percentage of any item in the cart
    if (!isCouponApplicableToCart(found, items)) {
      return { success: false, message: 'This coupon is not valid for this product.' };
    }

    const appliedCouponObj = {
      code: found.couponCode,
      discount: Number(found.discount),
      type: 'percentage', // Requirement: coupons represent percentage discount (1% - 100%)
      label: found.description || `${found.discount}% OFF`,
      minimumOrder: found.minimumOrder ? Number(found.minimumOrder) : 0,
      maximumDiscount: found.maximumDiscount ? Number(found.maximumDiscount) : null,
      expiryDate: found.expiryDate
    };

    setCoupon(appliedCouponObj);
    return { success: true, message: `Coupon ${codeUpper} applied successfully!` };
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  // Prescription Checking & Status Evaluation
  const prescriptionRequired = cartItems.some(item => item.requiresPrescription || item.prescription_required);
  const prescriptionUploaded = !!prescriptionFile;
  const rawStatus = (prescriptionFile?.reviewStatus || (prescriptionFile ? 'pending' : null))?.toLowerCase();
  const prescriptionStatus = rawStatus === 'under_review' ? 'pending' : rawStatus;
  const prescriptionApproved = !!prescriptionFile && (prescriptionStatus === 'approved');
  const prescriptionPending = !!prescriptionFile && (prescriptionStatus === 'pending');
  const prescriptionRejected = !!prescriptionFile && (prescriptionStatus === 'rejected');

  // Price Calculations
  const getSubtotal = (items = cartItems) => {
    return items.reduce((acc, item) => {
      const price = item.offerPrice || item.price || item.mrp || 0;
      return acc + price * item.quantity;
    }, 0);
  };

  const getDiscount = (items = cartItems, currentCoupon = coupon) => {
    const subtotal = getSubtotal(items);
    if (!currentCoupon) return 0;
    if (currentCoupon.minimumOrder && subtotal < currentCoupon.minimumOrder) return 0;

    const calculated = calculateEligibleDiscount(currentCoupon, items);

    return Math.min(calculated, subtotal);
  };

  const value = {
    cartItems,
    coupon,
    prescriptionFile,
    setPrescriptionFile,
    prescriptionRequired,
    prescriptionUploaded,
    prescriptionStatus,
    prescriptionApproved,
    prescriptionPending,
    prescriptionRejected,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscount,
    availableCoupons: couponsList
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
