import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const AVAILABLE_COUPONS = {
  'MED10': { code: 'MED10', discount: 10, type: 'percentage', label: '10% OFF on all medicines' },
  'QUICK20': { code: 'QUICK20', discount: 20, type: 'percentage', label: '20% OFF (First Order)' },
  'FLAT50': { code: 'FLAT50', discount: 50, type: 'flat', label: 'Flat ₹50 OFF' }
};

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

  const applyCoupon = (code) => {
    const codeUpper = code.trim().toUpperCase();
    const found = AVAILABLE_COUPONS[codeUpper];
    if (found) {
      setCoupon(found);
      return { success: true, message: `Coupon ${codeUpper} applied successfully!` };
    }
    return { success: false, message: 'Invalid coupon code.' };
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
    if (coupon.type === 'percentage') {
      return Math.round((subtotal * coupon.discount) / 100);
    }
    if (coupon.type === 'flat') {
      return Math.min(coupon.discount, subtotal);
    }
    return 0;
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
    availableCoupons: Object.values(AVAILABLE_COUPONS)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
