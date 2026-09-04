import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
import MedicineImage from '../components/MedicineImage';
import Card from '../components/Card';
import { 
  MdShoppingCart, 
  MdDeleteOutline, 
  MdArrowForward,
  MdInfoOutline,
  MdCheckCircle,
  MdUploadFile,
  MdArrowBack
} from 'react-icons/md';

export default function Cart() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getSubtotal, 
    getDiscount,
    coupon,
    applyCoupon,
    removeCoupon,
    prescriptionRequired,
    prescriptionUploaded,
    prescriptionStatus,
    prescriptionApproved,
    prescriptionPending,
    prescriptionRejected,
    prescriptionFile
  } = useCart();

  const { address, distance, deliveryType, calculateDeliveryFee } = useLocation();
  const { systemSettings, deliverySettings } = useSettings();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const subtotal = getSubtotal();
  const discount = getDiscount();
  
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = subtotal - discount + deliveryFee;

  const isStoreClosed = systemSettings && systemSettings.storeOpen === false;
  // Bypassed location-based delivery restriction to match Buy Now behavior
  const isDeliveryUnavailable = false;

  const isCheckoutDisabled = (prescriptionRequired && !prescriptionApproved) || isStoreClosed || isDeliveryUnavailable;

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput("");
    } else {
      setCouponError(res.message);
    }
  };

  const handleCheckout = () => {
    if (isStoreClosed) return;
    if (isDeliveryUnavailable) return;
    if (prescriptionRequired && !prescriptionApproved) {
      navigate('/upload-prescription');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center font-sans">
        <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto text-4xl mb-6 shadow-sm">
          <MdShoppingCart />
        </div>
        <h2 className="text-2xl font-bold text-dark">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-dark/45 mt-2 max-w-sm mx-auto">Explore our catalog of medicines, vitamins, and healthcare devices to add products to your cart.</p>
        <Link to="/medicines">
          <button className="mt-8 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95">
            Shop Medicines
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FCFC] min-h-screen pt-10 pb-24 lg:pb-16 font-sans text-dark/90 text-left">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-extrabold text-[#063B44] mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-dark/5 rounded-[24px] overflow-hidden shadow-soft p-6 space-y-5">
              {cartItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-dark/5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                    <div className="w-16 h-16 bg-white border border-dark/5 p-1 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      <MedicineImage product={item} />
                    </div>
                    <div className="text-left space-y-1">
                      <h3 className="font-bold text-dark text-sm sm:text-base line-clamp-1 hover:text-primary transition-colors">{item.medicine_name}</h3>
                      <p className="text-[10px] text-dark/45 font-medium leading-none">{item.brand} • {item.pack_size}</p>
                      {item.prescription_required && (
                        <span className="bg-red-50 text-red-600 border border-red-200/50 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider inline-block">Rx Required</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-dark/10 rounded-lg overflow-hidden bg-white">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 bg-background hover:bg-dark/5 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-dark">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 bg-background hover:bg-dark/5 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Price and delete button */}
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-dark text-sm sm:text-base">₹{item.price * item.quantity}</span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-dark/40 hover:text-red-500 rounded-full hover:bg-background transition-colors"
                      >
                        <MdDeleteOutline className="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/medicines" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              <MdArrowBack className="text-base" /> Continue Shopping
            </Link>
          </div>

          {/* Right: Cart Summary and Promo Code */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Prescription warnings */}
            {prescriptionRequired && (
              <Card hoverable={false} padding="p-5" className={`bg-white border-l-4 shadow-soft rounded-[20px] ${
                prescriptionApproved 
                  ? 'border-l-emerald-500 border border-dark/5' 
                  : prescriptionRejected 
                    ? 'border-l-red-500 border border-dark/5' 
                    : 'border-l-amber-500 border border-dark/5'
              }`}>
                <div className="flex items-start gap-3 text-left">
                  <div className="text-lg shrink-0 mt-0.5">
                    {prescriptionApproved ? (
                      <MdCheckCircle className="text-emerald-500" />
                    ) : prescriptionRejected ? (
                      <MdClose className="text-red-500" />
                    ) : (
                      <MdInfoOutline className="text-amber-500" />
                    )}
                  </div>
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-dark uppercase tracking-wider">
                        {prescriptionApproved 
                          ? "Prescription Approved" 
                          : prescriptionRejected 
                            ? "Prescription Rejected" 
                            : prescriptionPending 
                              ? "Prescription Pending Approval" 
                              : "Prescription Required"}
                      </h4>
                      {prescriptionApproved && <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Ready</span>}
                      {prescriptionPending && <span className="bg-amber-50 text-amber-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse">Under Review</span>}
                      {prescriptionRejected && <span className="bg-red-50 text-red-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Rejected</span>}
                    </div>

                    {prescriptionApproved ? (
                      <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                        Uploaded document ({prescriptionFile?.name}) has been verified. You can now proceed to checkout.
                      </p>
                    ) : prescriptionPending ? (
                      <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                        Uploaded ({prescriptionFile?.name}). Our pharmacists are verifying your prescription. Checkout will unlock automatically upon approval.
                      </p>
                    ) : prescriptionRejected ? (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-red-700 leading-relaxed font-bold">
                          Reason: {prescriptionFile?.rejectionReason || "Invalid or unclear document."}
                        </p>
                        <button 
                          onClick={() => navigate('/upload-prescription')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                        >
                          Upload New Prescription
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-dark/50 leading-relaxed font-light">
                          This cart contains Rx medicines. Please upload a valid prescription to proceed.
                        </p>
                        <button 
                          onClick={() => navigate('/upload-prescription')}
                          className="mt-1 px-4 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1 select-none cursor-pointer"
                        >
                          <MdUploadFile className="text-xs" /> Upload Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Promo Code Coupon Form */}
            <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft space-y-4">
              <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Apply Promo Code</h4>
              
              {coupon ? (
                <div className="bg-secondary/15 text-secondary-dark p-3.5 rounded-xl border border-secondary/20 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold uppercase tracking-wider">{coupon.code}</span>
                    <p className="text-[9px] font-medium leading-none mt-0.5">{coupon.label}</p>
                  </div>
                  <button 
                    onClick={removeCoupon}
                    className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-wide cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon (e.g. MED10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-grow px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 bg-[#009688] hover:bg-primary-dark text-white font-bold text-xs uppercase rounded-xl transition-all shadow-sm"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccess}</p>}
            </div>

            {/* Price Calculations breakdown */}
            <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft space-y-4">
              <h4 className="font-bold text-xs text-dark uppercase tracking-wider border-b border-dark/5 pb-3">Bill Details</h4>
              
              {/* Delivery distance alert message */}
              {address && deliverySettings && (
                <div className="p-3 rounded-xl border text-[11px] font-semibold text-left">
                  {deliveryType === 'priority' ? (
                    <div className="text-emerald-600 border-emerald-100 bg-emerald-50/50 flex items-center gap-1.5">
                      ⚡ Delivery within {deliverySettings.priorityDeliveryTime || "1 Hour"} (Priority Zone)
                    </div>
                  ) : (
                    <div className="text-primary border-primary-light bg-primary-light/5 flex items-center gap-1.5">
                      🚚 Standard Delivery Available ({deliverySettings.standardDeliveryTime || "24 Hours"})
                    </div>
                  )}
                </div>
              )}

              {isStoreClosed && (
                <div className="p-3.5 rounded-xl border border-red-200/60 bg-red-50 text-red-600 text-xs font-bold text-center">
                  ⚠️ Store is currently closed. Checkout is disabled.
                </div>
              )}
              
              <div className="space-y-2.5 text-xs text-dark/70">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-dark">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-secondary-dark">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-dark">
                    {deliveryFee > 0 ? `₹${deliveryFee}` : "FREE"}
                  </span>
                </div>
              </div>

              <div className="border-t border-dark/5 pt-4 flex justify-between items-baseline">
                <span className="font-bold text-dark text-sm sm:text-base">To Pay</span>
                <span className="font-black text-primary text-xl sm:text-2xl">₹{total}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isCheckoutDisabled}
                className={`w-full py-4 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 select-none ${
                  isCheckoutDisabled
                    ? 'bg-dark/10 text-dark/30 border border-dark/5 cursor-not-allowed shadow-none'
                    : 'bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-95'
                }`}
              >
                {isStoreClosed ? "Store Closed" : "Proceed to Checkout"}
                <MdArrowForward className="text-base" />
              </button>
              
              {prescriptionRequired && !prescriptionApproved && (
                <div className="text-center mt-2">
                  {!prescriptionUploaded && (
                    <p className="text-[9px] text-red-500 font-semibold">
                      * Upload prescription and await approval to unlock checkout.
                    </p>
                  )}
                  {prescriptionPending && (
                    <p className="text-[9px] text-amber-600 font-bold flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                      Prescription under review. Checkout unlocks automatically upon approval.
                    </p>
                  )}
                  {prescriptionRejected && (
                    <p className="text-[9px] text-red-600 font-bold">
                      * Prescription was rejected. Please upload a new prescription.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
      
      {/* Sticky mobile checkout button bar */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-dark/10 p-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-dark/45 font-bold uppercase block">To Pay</span>
            <span className="text-lg font-black text-primary">₹{total}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={isCheckoutDisabled}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 select-none ${
              isCheckoutDisabled
                ? 'bg-dark/10 text-dark/30 border border-dark/5 cursor-not-allowed shadow-none'
                : 'bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-95'
            }`}
          >
            {isStoreClosed ? "Store Closed" : "Checkout"}
            <MdArrowForward className="text-base" />
          </button>
        </div>
      )}
    </div>
  );
}
