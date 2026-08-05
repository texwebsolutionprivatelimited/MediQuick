import React, { useState } from 'react';
import { useNavigate, Link, useLocation as useRouterLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { db, isConfigValid } from '../firebase/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Card from '../components/Card';
import { 
  MdChevronRight, 
  MdRoom, 
  MdPayment, 
  MdReceipt,
  MdCheckCircle,
  MdArrowBack,
  MdMyLocation,
  MdPercent
} from 'react-icons/md';
import { isCouponApplicableToCart, getCouponForProduct } from '../utils/couponMatcher';

export default function Checkout() {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { cartItems, getSubtotal, getDiscount, clearCart, coupon, applyCoupon, removeCoupon, availableCoupons } = useCart();
  const { address, detectLocation, loading: locLoading, error: locError, distance, deliveryType, calculateDeliveryFee } = useLocation();
  const { systemSettings, deliverySettings } = useSettings();
  const { currentUser } = useAuth();

  // Local Form states
  const [flatNo, setFlatNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(address || "");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod", "upi", "card"
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  // Promo code states
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [copiedPromo, setCopiedPromo] = useState("");

  const handleCopyPromo = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedPromo(code);
    setTimeout(() => setCopiedPromo(""), 2000);
  };

  const handleApplyPromo = (code) => {
    setPromoError("");
    setPromoSuccess("");
    if (!code || !code.trim()) {
      setPromoError("Please enter a promo code.");
      return;
    }

    const codeUpper = code.trim().toUpperCase();
    // Check if the code is in the available coupons from Firestore
    let found = availableCoupons.find(c => {
      const cCode = c.couponCode || c.code;
      return cCode && cCode.trim().toUpperCase() === codeUpper;
    });

    // If not found in Firestore availableCoupons, check if it's on any of the cart items!
    if (!found) {
      const itemWithCoupon = cartItems.find(item => {
        const itemCouponCode = item.couponCode || item.coupon_code;
        return itemCouponCode && itemCouponCode.trim().toUpperCase() === codeUpper;
      });
      if (itemWithCoupon) {
        const itemDiscount = itemWithCoupon.discountPercentage !== undefined ? itemWithCoupon.discountPercentage : itemWithCoupon.discount_percentage || 0;
        found = {
          id: `cp-${itemWithCoupon.id}`,
          couponCode: itemWithCoupon.couponCode || itemWithCoupon.coupon_code,
          discount: itemDiscount,
          discountPercentage: itemDiscount,
          status: 'active'
        };
      }
    }

    if (!found) {
      setPromoError("Invalid promo code.");
      return;
    }

    if (found.status !== 'active') {
      setPromoError("This promo code is inactive.");
      return;
    }

    // Expiry check
    const todayStr = new Date().toISOString().split('T')[0];
    if (found.expiryDate && found.expiryDate < todayStr) {
      setPromoError("This promo code has expired.");
      return;
    }

    // Check minimum order
    if (found.minimumOrder && subtotal < Number(found.minimumOrder)) {
      setPromoError(`Minimum order of ₹${found.minimumOrder} required.`);
      return;
    }

    // Check discount percentage match (all eligible products must have the same discount percentage)
    const buyNowProduct = routerLocation.state?.buyNowProduct;
    if (buyNowProduct) {
      const buyNowDiscount = Number(buyNowProduct.discountPercentage !== undefined ? buyNowProduct.discountPercentage : buyNowProduct.discount_percentage) || 0;
      const couponDiscount = Number(found.discountPercentage !== undefined ? found.discountPercentage : found.discount);
      if (buyNowDiscount !== couponDiscount) {
        setPromoError("This promo code is not applicable to your cart.");
        return;
      }
    } else {
      const activeDiscounts = cartItems
        .map(item => Number(item.discountPercentage !== undefined ? item.discountPercentage : item.discount_percentage) || 0)
        .filter(d => d > 0);
      const uniqueDiscounts = [...new Set(activeDiscounts)];

      if (uniqueDiscounts.length > 1) {
        setPromoError("This promo code is not applicable to your cart.");
        return;
      }

      if (uniqueDiscounts.length === 1) {
        const couponDiscount = Number(found.discountPercentage !== undefined ? found.discountPercentage : found.discount);
        if (uniqueDiscounts[0] !== couponDiscount) {
          setPromoError("This promo code is not applicable to your cart.");
          return;
        }
      }
    }

    // Apply the coupon
    const res = applyCoupon(codeUpper);
    if (res.success) {
      setPromoSuccess(res.message);
      setPromoInput("");
    } else {
      setPromoError(res.message);
    }
  };

  const handleRemovePromo = () => {
    removeCoupon();
    setPromoSuccess("");
    setPromoError("");
  };

  // Sync deliveryAddress state when address is detected/changed in context (e.g. from header selector or checkout button)
  React.useEffect(() => {
    if (address) {
      setDeliveryAddress(address);
    }
  }, [address]);


  const handleGetCurrentLocation = () => {
    if (address) {
      setDeliveryAddress(address);
    }
    detectLocation();
  };

  const subtotal = getSubtotal();
  const uniqueCartDiscounts = React.useMemo(() => {
    const discounts = cartItems
      .map(item => Number(item.discountPercentage !== undefined ? item.discountPercentage : item.discount_percentage) || 0)
      .filter(d => d > 0);
    return [...new Set(discounts)];
  }, [cartItems]);

  const applicableCoupons = React.useMemo(() => {
    // Check if the route contains buyNowProduct (Buy Now flow)
    const buyNowProduct = routerLocation.state?.buyNowProduct;
    if (buyNowProduct) {
      const itemCouponCode = buyNowProduct.couponCode || buyNowProduct.coupon_code;
      if (itemCouponCode) {
        const match = availableCoupons.find(c => {
          const cCode = c.couponCode || c.code;
          return cCode && cCode.trim().toUpperCase() === itemCouponCode.trim().toUpperCase();
        });
        if (match) return [match];
        
        const itemDiscount = buyNowProduct.discountPercentage !== undefined ? buyNowProduct.discountPercentage : buyNowProduct.discount_percentage || 0;
        return [{
          id: `cp-${buyNowProduct.id}`,
          couponCode: itemCouponCode,
          discount: itemDiscount,
          discountPercentage: itemDiscount,
          description: `Applicable for this order`,
          status: 'active'
        }];
      } else {
        const discountVal = buyNowProduct.discountPercentage !== undefined ? buyNowProduct.discountPercentage : buyNowProduct.discount_percentage;
        if (discountVal && Number(discountVal) > 0) {
          const match = getCouponForProduct(discountVal, availableCoupons);
          if (match) return [match];
        }
      }
      return [];
    }

    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    const activeDiscounts = cartItems
      .map(item => Number(item.discountPercentage !== undefined ? item.discountPercentage : item.discount_percentage) || 0)
      .filter(d => d > 0);
    const uniqueDiscounts = [...new Set(activeDiscounts)];

    if (uniqueDiscounts.length > 1) {
      return [];
    }

    const coupons = [];
    
    cartItems.forEach(item => {
      const itemCouponCode = item.couponCode || item.coupon_code;
      if (itemCouponCode) {
        const match = availableCoupons.find(c => {
          const cCode = c.couponCode || c.code;
          return cCode && cCode.trim().toUpperCase() === itemCouponCode.trim().toUpperCase();
        });
        if (match) {
          const exists = coupons.some(c => (c.couponCode || c.code) === (match.couponCode || match.code));
          if (!exists) {
            coupons.push(match);
          }
        } else {
          const itemDiscount = item.discountPercentage !== undefined ? item.discountPercentage : item.discount_percentage || 0;
          const exists = coupons.some(c => c.couponCode === itemCouponCode);
          if (!exists) {
            coupons.push({
              id: `cp-${item.id}`,
              couponCode: itemCouponCode,
              discount: itemDiscount,
              discountPercentage: itemDiscount,
              description: `Applicable for this order`,
              status: 'active'
            });
          }
        }
      } else {
        const discountVal = item.discountPercentage !== undefined ? item.discountPercentage : item.discount_percentage;
        if (discountVal && Number(discountVal) > 0) {
          const match = getCouponForProduct(discountVal, availableCoupons);
          if (match) {
            const exists = coupons.some(c => {
              const codeName = match.couponCode || match.code;
              return (c.couponCode || c.code) === codeName;
            });
            if (!exists) {
              coupons.push(match);
            }
          }
        }
      }
    });

    return coupons;
  }, [cartItems, availableCoupons, routerLocation.state]);

  const totalMSRP = cartItems.reduce((sum, item) => sum + (item.mrp || item.price || 0) * item.quantity, 0);
  const productDiscount = Math.max(0, totalMSRP - subtotal);

  const discount = getDiscount();
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const isStoreClosed = systemSettings && systemSettings.storeOpen === false;
  // Temporary bypass of delivery serviceability validation for testing/dev
  // To re-enable serviceability check, uncomment the original line below:
  // const isDeliveryUnavailable = deliveryType === 'unavailable' || !deliverySettings?.deliveryEnabled;
  const isDeliveryUnavailable = false;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!deliveryAddress.trim() || isPlacing) return;

    setIsPlacing(true);

    const orderId = 'MQ-' + Math.floor(10000 + Math.random() * 90000);
    const fullAddress = `${flatNo ? flatNo + ', ' : ''}${deliveryAddress}${landmark ? ' (Landmark: ' + landmark + ')' : ''}`;
    
    const newOrder = {
      orderId: orderId,
      userId: currentUser?.uid || "guest",
      customerName: currentUser?.displayName || currentUser?.fullName || "Guest Customer",
      email: currentUser?.email || "guest@mediquick.com",
      phone: currentUser?.phone || currentUser?.mobileNumber || "9876543210",
      deliveryAddress: fullAddress,
      items: cartItems.map(item => ({
        id: item.id,
        medicine_name: item.medicine_name,
        price: item.price || item.mrp || 0,
        quantity: item.quantity,
        brand: item.brand || 'Generic'
      })),
      totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: total,
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod === 'upi' ? 'UPI' : 'Credit / Debit Card',
      paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
      orderDate: new Date().toISOString(),
      status: 'Pending'
    };

    try {
      if (isConfigValid && db) {
        // Write to root orders collection (Admin Dashboard queries this)
        await setDoc(doc(db, 'orders', orderId), newOrder);
        
        // Write to user specific orders subcollection (for user-side queries)
        if (currentUser?.uid) {
          await setDoc(doc(db, 'users', currentUser.uid, 'orders', orderId), newOrder);
          
          // Generate notification for order placement in Firestore
          await addDoc(collection(db, 'notifications'), {
            userId: currentUser.uid,
            title: 'Order Placed Successfully!',
            message: `Your order has been placed successfully. Reference: ${orderId}`,
            type: 'order_confirmed',
            isRead: false,
            createdAt: serverTimestamp(),
            actionUrl: '/order-tracking'
          });
        }
      } else {
        // Mock LocalStorage placement for offline mock mode
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        stored.unshift(newOrder);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(stored));

        // Generate local mock notification
        if (currentUser?.uid) {
          const mockNotif = {
            id: `local-place-${Date.now()}`,
            userId: currentUser.uid,
            title: 'Order Placed Successfully!',
            message: `Your order has been placed successfully. Reference: ${orderId}`,
            type: 'order_confirmed',
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: '/order-tracking'
          };
          const savedNotifs = JSON.parse(localStorage.getItem('mediquick_local_notifications') || '[]');
          savedNotifs.unshift(mockNotif);
          localStorage.setItem('mediquick_local_notifications', JSON.stringify(savedNotifs));
        }
      }

      setOrderSuccess(true);
      setTimeout(() => {
        clearCart();
        setOrderSuccess(false);
        navigate('/order-tracking');
      }, 2500);
    } catch (err) {
      console.error("Error saving order: ", err);
      alert("Failed to record order: " + err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 text-center font-sans">
        <h2 className="text-2xl font-bold text-dark">No Items in Checkout</h2>
        <p className="text-xs text-dark/45 mt-2">Your cart is empty. Please add items before checking out.</p>
        <Link to="/medicines">
          <button className="mt-6 px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-md">
            Go to Medicines
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-10 font-sans text-dark/90 text-left">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <h1 className="text-2xl font-extrabold text-[#063B44] mb-8">Checkout</h1>
        
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Columns: Address and Payment */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Delivery address details */}
            <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-[24px] space-y-4">
              <h3 className="font-bold text-sm text-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-dark/5 pb-3">
                <MdRoom className="text-primary text-lg" /> Delivery Address
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1">
                    <label className="font-bold text-dark/65">Full Address (Detected / Manual)</label>
                    <button
                      type="button"
                      disabled={locLoading}
                      onClick={handleGetCurrentLocation}
                      className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                    >
                      {locLoading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Locating...
                        </>
                      ) : (
                        <>
                          <MdMyLocation className="text-sm" /> Get Current Location
                        </>
                      )}
                    </button>
                  </div>
                  <textarea 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    rows="2"
                    placeholder="Enter your street address, city, and pincode..."
                    className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl outline-none focus:border-primary bg-background resize-none text-dark leading-relaxed"
                  />
                  {locError && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{locError}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-dark/65">Flat / House No. / Building</label>
                    <input 
                      type="text" 
                      value={flatNo}
                      onChange={(e) => setFlatNo(e.target.value)}
                      placeholder="e.g. Flat 302, Block A"
                      className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl outline-none focus:border-primary bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-dark/65">Landmark (Optional)</label>
                    <input 
                      type="text" 
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Gachibowli Stadium"
                      className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl outline-none focus:border-primary bg-background"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-[24px] space-y-4">
              <h3 className="font-bold text-sm text-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-dark/5 pb-3">
                <MdPayment className="text-primary text-lg" /> Payment Options
              </h3>

              <div className="space-y-3 text-xs text-dark/80">
                <label className="flex items-center gap-3 p-3.5 border border-dark/5 rounded-xl hover:bg-background/40 cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="text-primary border-dark/15 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-dark">Cash on Delivery (COD)</span>
                    <p className="text-[10px] text-dark/45 mt-0.5">Pay in cash or digital scan when order reaches your door.</p>
                  </div>
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3.5 border border-dark/5 rounded-xl hover:bg-background/40 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="upi"
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                      className="text-primary border-dark/15 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-dark">UPI (Google Pay, PhonePe, Paytm)</span>
                      <p className="text-[10px] text-dark/45 mt-0.5">Instant secure payment redirect through your UPI client app.</p>
                    </div>
                  </label>

                  {paymentMethod === "upi" && (
                    <div className="mx-auto sm:ml-7 p-4 border border-dashed border-dark/10 rounded-xl bg-background/30 flex flex-col items-center text-center space-y-2 w-fit">
                      <div className="w-36 h-36 bg-white p-2.5 border border-dark/5 rounded-2xl shadow-sm flex items-center justify-center">
                        <img 
                          src="/images/dummy-qr.svg" 
                          alt="Dummy UPI QR Code" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-dark text-[11px]">Scan the QR code using any UPI app</p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-wider">Demo Payment Only</p>
                        <p className="text-[9px] text-dark/45">No real transaction will be processed</p>
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 p-3.5 border border-dark/5 rounded-xl hover:bg-background/40 cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="text-primary border-dark/15 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-dark">Credit / Debit Card</span>
                    <p className="text-[10px] text-dark/45 mt-0.5">Visa, MasterCard, RuPay, Maestro accepted. Secure 3D-Redirect.</p>
                  </div>
                </label>
              </div>
            </Card>

            <Link to="/cart" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              <MdArrowBack className="text-base" /> Back to Cart
            </Link>
          </div>

          {/* Right Column: Order Summary & Placement */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Items Summary list */}
            <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft space-y-4">
              <h3 className="font-bold text-xs text-dark uppercase tracking-wider border-b border-dark/5 pb-3">Order Items</h3>
              
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs gap-3">
                    <div className="overflow-hidden leading-tight text-left">
                      <p className="font-bold text-dark truncate max-w-[150px]">{item.medicine_name}</p>
                      <p className="text-[10px] text-dark/40 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-extrabold text-dark">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PROMO CODE SECTION */}
            {applicableCoupons.length > 0 && (
              <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft space-y-4">
                <h3 className="font-bold text-xs text-dark uppercase tracking-wider border-b border-dark/5 pb-3">PROMO CODE</h3>
                
                {/* Display available applicable coupon(s) */}
                <div className="space-y-3">
                  {applicableCoupons.map((cp) => {
                    const cpCodeName = cp.couponCode || cp.code;
                    const cpDiscountValue = cp.discountPercentage !== undefined ? cp.discountPercentage : cp.discount;
                    const isApplied = coupon && (coupon.code === cpCodeName || coupon.couponCode === cpCodeName);
                    return (
                      <div key={cp.id} className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-primary text-xs tracking-wide">{cpCodeName}</span>
                          <span className="text-[10px] font-black text-secondary-dark bg-secondary/15 px-2 py-0.5 rounded-full">{cpDiscountValue}% OFF</span>
                        </div>
                        <p className="text-[10px] text-dark/65 font-medium leading-normal">{cp.description || 'Applicable for this order'}</p>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleCopyPromo(cpCodeName)}
                            className="flex-grow py-1.5 bg-white border border-dark/10 hover:border-dark/20 text-dark/70 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedPromo === cpCodeName ? "Copied!" : "Copy Code"}
                          </button>
                          {!isApplied ? (
                            <button
                              type="button"
                              onClick={() => handleApplyPromo(cpCodeName)}
                              className="flex-grow py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Apply
                            </button>
                          ) : (
                            <span className="flex-grow py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                              Applied ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Input Form */}
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-grow px-3 py-2 border border-dark/10 rounded-xl outline-none focus:border-primary bg-background text-xs uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo(promoInput)}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{promoError}</p>
                  )}
                  {promoSuccess && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">{promoSuccess}</p>
                  )}
                </div>

                {/* After Successful Application Details */}
                {coupon && (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-left">
                    <div className="leading-tight">
                      <p className="font-bold text-emerald-800 flex items-center gap-1">
                        Coupon Applied <span className="text-emerald-600">✓</span>
                      </p>
                      <p className="text-[10px] font-extrabold text-emerald-700 mt-0.5">{coupon.couponCode || coupon.code}</p>
                      <p className="text-[10px] text-emerald-600/80 font-medium mt-1">You saved ₹{discount}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Calculations and submit Button */}
            <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft space-y-4">
              <h3 className="font-bold text-xs text-dark uppercase tracking-wider border-b border-dark/5 pb-3">Price Summary</h3>
              
              <div className="space-y-2.5 text-xs text-dark/70">
                {coupon ? (
                  <>
                    <div className="flex justify-between">
                      <span>Cart Subtotal (MSRP)</span>
                      <span className="font-bold text-dark">₹{totalMSRP}</span>
                    </div>
                    <div className="flex justify-between text-dark/60">
                      <span>Discount</span>
                      <span className="font-bold text-secondary-dark">-₹{productDiscount}</span>
                    </div>
                    <div className="flex justify-between text-secondary-dark">
                      <span>Promo Savings</span>
                      <span className="font-bold">-₹{discount}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Cart Subtotal</span>
                      <span className="font-bold text-dark">₹{subtotal}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-dark">
                    {deliveryFee > 0 ? `₹${deliveryFee}` : "FREE"}
                  </span>
                </div>
              </div>

              {isStoreClosed && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-bold text-xs select-none">
                  ⚠️ Store is currently closed. Ordering is disabled.
                </div>
              )}

              {isDeliveryUnavailable && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-bold text-xs select-none">
                  ⚠️ Delivery is currently unavailable for your location.
                </div>
              )}

              <div className="border-t border-dark/5 pt-4 flex justify-between items-baseline">
                <span className="font-bold text-dark text-sm sm:text-base">
                  {coupon ? "Final Total" : "Grand Total"}
                </span>
                <span className="font-black text-primary text-xl sm:text-2xl">₹{total}</span>
              </div>

              <button 
                type="submit"
                disabled={orderSuccess || isPlacing || isStoreClosed || isDeliveryUnavailable}
                className={`w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 select-none ${
                  orderSuccess || isPlacing || isStoreClosed || isDeliveryUnavailable 
                    ? 'bg-dark/10 text-dark/30 border border-dark/5 cursor-not-allowed shadow-none' 
                    : 'cursor-pointer active:scale-95'
                }`}
              >
                {isPlacing ? "Placing Order..." : isStoreClosed ? "Store Closed" : "Place Order"}
              </button>
            </div>

          </div>

        </form>
      </div>

      {/* 🚀 ORDER SUCCESS BANNER / OVERLAY */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] shadow-premium max-w-md w-full text-center border border-dark/5 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto animate-bounce">
              <MdCheckCircle />
            </div>
            <h3 className="text-xl font-bold text-dark">Order Placed Successfully!</h3>
            <p className="text-xs text-dark/55 leading-relaxed max-w-xs mx-auto">
              Your prescription & payment details have been logged. Redirecting you to order tracking...
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
