import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { db, isConfigValid } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Card from '../components/Card';
import { 
  MdChevronRight, 
  MdRoom, 
  MdPayment, 
  MdReceipt,
  MdCheckCircle,
  MdArrowBack
} from 'react-icons/md';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getSubtotal, getDiscount, clearCart, coupon } = useCart();
  const { address } = useLocation();
  const { currentUser } = useAuth();

  // Local Form states
  const [flatNo, setFlatNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(address || "");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod", "upi", "card"
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const isFreeDelivery = subtotal >= 500 || (deliveryAddress && deliveryAddress.includes("Gachibowli"));
  const deliveryFee = subtotal > 0 && !isFreeDelivery ? 40 : 0;
  const total = subtotal - discount + deliveryFee;

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
        }
      } else {
        // Mock LocalStorage placement for offline mock mode
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        stored.unshift(newOrder);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(stored));
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
                <div className="space-y-1">
                  <label className="font-bold text-dark/65">Full Address (Detected / Manual)</label>
                  <textarea 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    rows="2"
                    placeholder="Enter your street address, city, and pincode..."
                    className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl outline-none focus:border-primary bg-background resize-none text-dark leading-relaxed"
                  />
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

            {/* Calculations and submit Button */}
            <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft space-y-4">
              <h3 className="font-bold text-xs text-dark uppercase tracking-wider border-b border-dark/5 pb-3">Price Summary</h3>
              
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
                <span className="font-bold text-dark text-sm sm:text-base">Grand Total</span>
                <span className="font-black text-primary text-xl sm:text-2xl">₹{total}</span>
              </div>

              <button 
                type="submit"
                disabled={orderSuccess || isPlacing}
                className={`w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 select-none ${orderSuccess || isPlacing ? 'bg-primary-dark cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-95'}`}
              >
                {isPlacing ? "Placing Order..." : "Place Order"}
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
