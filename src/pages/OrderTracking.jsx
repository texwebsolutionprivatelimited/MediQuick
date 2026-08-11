import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { 
  MdArrowBack,
  MdRoom,
  MdCheckCircle,
  MdPayment,
  MdReceipt,
  MdMyLocation,
  MdClose,
  MdChat
} from 'react-icons/md';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const STATUS_MILESTONES = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

const STATUS_LABELS = {
  "Pending": "Order Placed",
  "Confirmed": "Confirmed",
  "Packed": "Packed",
  "Out for Delivery": "Out for Delivery",
  "Delivered": "Delivered"
};

export default function OrderTracking() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (isConfigValid && db) {
      // Real-time Firestore query for root orders collection filtered by userId
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedOrders.push({ id: doc.id, orderId: data.orderId || doc.id, ...data });
        });
        // Sort newest first
        fetchedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(fetchedOrders);
        setLoading(false);
      }, (error) => {
        console.error("Error listening to user orders:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Mock LocalStorage tracking
      const fetchLocalOrders = () => {
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const userOrders = stored.filter(o => o.userId === currentUser.uid);
        userOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(userOrders);
        setLoading(false);
      };

      fetchLocalOrders();

      const handleStorageChange = (e) => {
        if (e.key === 'mediquick_local_orders') {
          fetchLocalOrders();
        }
      };
      window.addEventListener('storage', handleStorageChange);

      // Periodically sync in mock mode to handle changes made in other tabs/intervals
      const interval = setInterval(fetchLocalOrders, 1000);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [currentUser]);

  const isCancellationAllowed = (status) => {
    return ["Pending", "Confirmed", "Packed"].includes(status);
  };

  const handleCancelOrder = async (order) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel order #${order.orderId}?`);
    if (!confirmCancel) return;

    try {
      if (isConfigValid && db) {
        // Update in root orders collection
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, { status: 'Cancelled' });

        // Update in user subcollection for completeness
        if (currentUser?.uid) {
          const userOrderRef = doc(db, 'users', currentUser.uid, 'orders', order.id);
          await updateDoc(userOrderRef, { status: 'Cancelled' }).catch(err => {
            console.warn("Could not sync user subcollection order status:", err);
          });
        }

        // Generate cancellation notification in Firestore
        await addDoc(collection(db, 'notifications'), {
          userId: currentUser.uid,
          title: 'Order Cancelled',
          message: `Your order #${order.orderId} has been successfully cancelled.`,
          type: 'order_status',
          isRead: false,
          createdAt: serverTimestamp(),
          actionUrl: '/order-tracking'
        });
      } else {
        // Mock LocalStorage update
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const updated = stored.map(o => 
          o.orderId === order.orderId ? { ...o, status: 'Cancelled' } : o
        );
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));

        // Add local mock notification
        const mockNotif = {
          id: `local-cancel-${Date.now()}`,
          userId: currentUser.uid,
          title: 'Order Cancelled',
          message: `Your order #${order.orderId} has been successfully cancelled.`,
          type: 'order_status',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/order-tracking'
        };
        const savedNotifs = JSON.parse(localStorage.getItem('mediquick_local_notifications') || '[]');
        savedNotifs.unshift(mockNotif);
        localStorage.setItem('mediquick_local_notifications', JSON.stringify(savedNotifs));
      }
      alert("Order cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Failed to cancel order: " + err.message);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getWhatsappUrl = (order) => {
    let targetPhone = "919876543210"; // Default support phone fallback
    const userPhone = currentUser?.phone || currentUser?.mobileNumber;
    if (userPhone) {
      const cleanPhone = userPhone.replace(/[\s\-+]/g, "");
      targetPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
    }

    const baseText = `Hi, I want to inquire about my MediQuick order #${order.orderId} (Current Status: ${order.status}).`;
    return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(baseText)}`;
  };

  if (loading) {
    return (
      <div className="bg-[#F8FCFC] min-h-screen py-20 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark/50 font-bold uppercase tracking-wider">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-10 font-sans text-dark/90 text-left">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            <MdArrowBack className="text-base" /> Back to Home
          </Link>
        </div>

        <h1 className="text-2xl font-black text-[#063B44] tracking-tight mb-8">Track Your Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white border border-dark/5 p-12 rounded-[32px] text-center shadow-soft space-y-6">
            <div className="text-6xl select-none">📦</div>
            <h3 className="text-lg font-bold text-dark">No orders placed yet.</h3>
            <p className="text-xs text-dark/45 font-light max-w-sm mx-auto">
              You haven't ordered anything yet. Browse our selection of genuine medicines and wellness products!
            </p>
            <Link to="/medicines" className="inline-block">
              <button className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const activeIndex = STATUS_MILESTONES.indexOf(order.status);
              const isCancelled = order.status === 'Cancelled';

              return (
                <div key={order.orderId} className="bg-white border border-dark/5 rounded-[28px] shadow-soft overflow-hidden">
                  
                  {/* Order Header Block */}
                  <div className="bg-background/45 border-b border-dark/5 p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-primary tracking-wider">Order Reference</span>
                      <h2 className="text-base font-bold text-dark">Order #{order.orderId}</h2>
                      <p className="text-xs text-dark/45 font-light">Placed on: {formatDate(order.orderDate)}</p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                      <span className="text-xs font-black text-dark/75">Total: <strong className="text-primary font-extrabold text-sm sm:text-base">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                      <div className="flex gap-2">
                        {isCancellationAllowed(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="px-3.5 py-1.5 border border-red-500/20 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 transition-all cursor-pointer select-none"
                          >
                            <MdClose className="text-xs" /> Cancel Order
                          </button>
                        )}
                        <button
                          onClick={() => window.open(getWhatsappUrl(order), "_blank")}
                          className="px-3.5 py-1.5 border border-emerald-500/20 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 transition-all cursor-pointer select-none"
                        >
                          <MdChat className="text-xs" /> Help Chat
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Content Block */}
                  <div className="p-5 md:p-6 space-y-6">
                    
                    {/* Items Grid */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-dark/45 uppercase tracking-wider">Ordered Products</h3>
                      <div className="divide-y divide-dark/5 border border-dark/5 rounded-2xl overflow-hidden bg-background/25">
                        {order.items && order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3.5 text-xs">
                            <div className="space-y-0.5 pr-4">
                              <p className="font-bold text-dark">{item.medicine_name}</p>
                              <p className="text-[10px] text-dark/45 font-light">{item.brand}</p>
                            </div>
                            <div className="flex gap-4 shrink-0 text-right">
                              <span className="text-dark/40 font-light">Qty: <strong className="text-dark/70 font-semibold">{item.quantity}</strong></span>
                              <span className="font-bold text-dark">₹{((item.price || 0) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-dark/45 uppercase tracking-wider">Tracking Progress</h3>
                      {isCancelled ? (
                        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold">
                          <MdClose className="text-base shrink-0" />
                          <span>This order was Cancelled. If you have questions or require a refund, please contact support.</span>
                        </div>
                      ) : (
                        <div className="p-4 bg-background/20 rounded-2xl border border-dark/5">
                          {/* Desktop Timeline */}
                          <div className="hidden md:flex items-center justify-between mt-4 relative w-full px-2">
                            {/* Line */}
                            <div className="absolute left-6 right-6 top-3.5 -translate-y-1/2 h-0.5 bg-dark/10 z-0" />
                            <div 
                              className="absolute left-6 top-3.5 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 z-0"
                              style={{ width: `${activeIndex >= 0 ? (activeIndex / (STATUS_MILESTONES.length - 1)) * 100 : 0}%` }}
                            />
                            {/* Points */}
                            {STATUS_MILESTONES.map((milestone, idx) => {
                              const isDone = idx <= activeIndex;
                              const isActive = idx === activeIndex;
                              return (
                                <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300 ${
                                    isDone 
                                      ? 'border-primary bg-primary text-white scale-110 shadow-sm' 
                                      : 'border-dark/15 text-dark/40'
                                  } ${isActive ? 'animate-pulse' : ''}`}>
                                    {isDone ? <span className="text-[10px]">✔</span> : <span className="text-[9px]">{idx + 1}</span>}
                                  </div>
                                  <span className={`text-[10px] font-bold mt-2 ${isDone ? 'text-primary-dark' : 'text-dark/45'}`}>
                                    {STATUS_LABELS[milestone]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Mobile Timeline */}
                          <div className="md:hidden relative pl-6 border-l-2 border-dark/10 space-y-4 py-1 select-none text-left">
                            {STATUS_MILESTONES.map((milestone, idx) => {
                              const isDone = idx <= activeIndex;
                              const isActive = idx === activeIndex;
                              return (
                                <div key={idx} className="relative group">
                                  <div className={`absolute left-[-31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                                    isDone ? 'border-primary bg-primary text-white' : 'border-dark/15 text-dark/40'
                                  } ${isActive ? 'animate-pulse' : ''}`}>
                                    {isDone && <span className="text-[8px]">✔</span>}
                                  </div>
                                  <h4 className={`text-xs font-bold ${isDone ? 'text-dark font-extrabold' : 'text-dark/45'}`}>
                                    {STATUS_LABELS[milestone]}
                                  </h4>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Delivery Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Destination Address */}
                      <div className="bg-[#E2F3F0]/25 border border-primary/10 p-4 rounded-2xl flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-base shrink-0">
                          <MdMyLocation />
                        </div>
                        <div className="space-y-0.5 leading-tight">
                          <h4 className="font-bold text-[10px] text-dark/50 uppercase tracking-wider">Shipping Details</h4>
                          <p className="text-xs text-dark/70 font-light leading-normal">{order.deliveryAddress}</p>
                          {order.phone && (
                            <p className="text-[10px] text-dark/65 font-bold mt-1">Contact: {order.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Payment Detail */}
                      <div className="bg-background border border-dark/5 p-4 rounded-2xl flex items-start gap-3">
                        <div className="w-8 h-8 bg-dark/5 text-dark/60 rounded-lg flex items-center justify-center text-base shrink-0">
                          <MdPayment />
                        </div>
                        <div className="space-y-0.5 leading-tight">
                          <h4 className="font-bold text-[10px] text-dark/50 uppercase tracking-wider">Payment Details</h4>
                          <p className="text-xs text-dark/75 font-semibold leading-normal">{order.paymentMethod}</p>
                          <p className="text-[10px] text-dark/45 font-light">Status: <strong className={order.paymentStatus === 'Paid' ? 'text-secondary-dark font-bold' : 'text-amber-600 font-bold'}>{order.paymentStatus}</strong></p>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
