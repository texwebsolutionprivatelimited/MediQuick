import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isConfigValid } from '../firebase/firebase';
import { isCouponApplicableToCart, calculateEligibleDiscount } from '../utils/couponMatcher';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null); // stores { name, size, type, dataUrl or firebaseStorageUrl }

  // Load cart from LocalStorage on load
  useEffect(() => {
    const savedCart = localStorage.getItem('mediquick_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }
  }, []);

  // Save cart to LocalStorage when changed
  useEffect(() => {
    localStorage.setItem('mediquick_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item, qty = 1) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.id === item.id);
      if (existing) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prevItems, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((i) => i.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => {
    setCartItems([]);
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

  const applyCoupon = (code) => {
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
    const subtotal = getSubtotal();
    if (found.minimumOrder && subtotal < Number(found.minimumOrder)) {
      return { success: false, message: `Minimum order of ₹${found.minimumOrder} required to use this coupon.` };
    }

    // Validate that the coupon matches the discount percentage of any item in the cart
    if (!isCouponApplicableToCart(found, cartItems)) {
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

  // Prescription Checking
  const prescriptionRequired = cartItems.some(item => item.requiresPrescription || item.prescription_required);
  const prescriptionUploaded = !!prescriptionFile;

  // Price Calculations
  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = item.offerPrice || item.price || item.mrp || 0;
      return acc + price * item.quantity;
    }, 0);
  };

  const getDiscount = () => {
    const subtotal = getSubtotal();
    if (!coupon) return 0;
    if (coupon.minimumOrder && subtotal < coupon.minimumOrder) return 0;

    const calculated = calculateEligibleDiscount(coupon, cartItems);

    return Math.min(calculated, subtotal);
  };

  const value = {
    cartItems,
    coupon,
    prescriptionFile,
    setPrescriptionFile,
    prescriptionRequired,
    prescriptionUploaded,
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
