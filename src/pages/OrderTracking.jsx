import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { 
  MdArrowBack,
  MdRoom,
  MdCheckCircle,
  MdPayment,
  MdReceipt,
  MdMyLocation,
  MdClose,
  MdChat,
  MdCloudUpload,
  MdErrorOutline
} from 'react-icons/md';
import { db, isConfigValid, storage } from '../firebase/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDetails, setReturnDetails] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnStep, setReturnStep] = useState('FORM'); // 'FORM' | 'CONFIRM' | 'SUCCESS'
  const [returnImages, setReturnImages] = useState([]); // array of File objects
  const [returnImagePreviews, setReturnImagePreviews] = useState([]); // array of preview strings
  const [uploadingImages, setUploadingImages] = useState(false);
  const [returnError, setReturnError] = useState(null);
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [confirmBankAccountNumber, setConfirmBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

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

  const isReturnAllowed = (order) => {
    if (order.status !== 'Delivered') return false;
    if (order.returnStatus) return false;
    if (!order.deliveredAt) return false;

    try {
      let deliveryTime = null;
      if (order.deliveredAt.toDate) {
        deliveryTime = order.deliveredAt.toDate().getTime();
      } else if (order.deliveredAt.seconds) {
        deliveryTime = order.deliveredAt.seconds * 1000;
      } else {
        deliveryTime = new Date(order.deliveredAt).getTime();
      }

      if (isNaN(deliveryTime)) return false;

      const RETURN_WINDOW_DAYS = 7;
      const expiryTime = deliveryTime + (RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      return Date.now() <= expiryTime;
    } catch (e) {
      console.error("Error parsing deliveredAt:", e);
      return false;
    }
  };

  const handleOpenReturnModal = (order) => {
    setSelectedOrderForReturn(order);
    setReturnReason("");
    setReturnDetails("");
    setReturnImages([]);
    setReturnImagePreviews([]);
    setReturnError(null);
    setBankHolderName("");
    setBankAccountNumber("");
    setConfirmBankAccountNumber("");
    setBankIfsc("");
    setReturnStep('FORM');
    setShowReturnModal(true);
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    setReturnError(null);

    if (returnImages.length + files.length > 3) {
      setReturnError("You can upload a maximum of 3 photos.");
      return;
    }

    const newFiles = [];
    const newPreviews = [];

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setReturnError("Only image files (JPG, PNG, WebP) are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setReturnError("Each image must be smaller than 5MB.");
        return;
      }

      newFiles.push(file);
      // Generate preview URL
      const reader = new FileReader();
      const previewPromise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
      });
      reader.readAsDataURL(file);
      const dataUrl = await previewPromise;
      newPreviews.push(dataUrl);
    }

    setReturnImages(prev => [...prev, ...newFiles]);
    setReturnImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setReturnImages(prev => prev.filter((_, i) => i !== index));
    setReturnImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOrderForReturn) return;
    setSubmittingReturn(true);
    setReturnError(null);

    try {
      // Security Validation: Ensure the current logged-in user is the owner of the order
      if (!currentUser || selectedOrderForReturn.userId !== currentUser.uid) {
        throw new Error("Unauthorized. You can only submit a return request for your own order.");
      }

      const orderId = selectedOrderForReturn.id || selectedOrderForReturn.orderId;
      const isCOD = selectedOrderForReturn.paymentMethod === 'COD' || selectedOrderForReturn.paymentMethod === 'Cash on Delivery (COD)';
      
      let refundMethod = undefined;
      let refundDetails = undefined;

      if (isCOD) {
        // Enforce validations
        if (!bankHolderName.trim()) {
          throw new Error("Account Holder Name is required.");
        }
        if (!bankAccountNumber.trim()) {
          throw new Error("Bank Account Number is required.");
        }
        if (!confirmBankAccountNumber.trim()) {
          throw new Error("Confirm Account Number is required.");
        }
        if (bankAccountNumber.trim() !== confirmBankAccountNumber.trim()) {
          throw new Error("Account Number and Confirm Account Number must match.");
        }
        if (!bankIfsc.trim()) {
          throw new Error("IFSC Code is required.");
        }
        // IFSC format validation (11-digit alphanumeric: 4 letters, 0, 6 letters/digits)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
        if (!ifscRegex.test(bankIfsc.trim())) {
          throw new Error("Invalid IFSC Code format. Example: HDFC0001234");
        }

        refundMethod = 'Bank Account';
        refundDetails = {
          accountHolderName: bankHolderName.trim(),
          accountNumber: bankAccountNumber.trim(),
          ifscCode: bankIfsc.trim().toUpperCase()
        };
      }

      let uploadedImageUrls = [];

      if (isConfigValid && db && storage && returnImages.length > 0) {
        setUploadingImages(true);
        for (let i = 0; i < returnImages.length; i++) {
          const file = returnImages[i];
          const storageRef = ref(storage, `returns/${selectedOrderForReturn.orderId}/${Date.now()}-${i}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          uploadedImageUrls.push(downloadUrl);
        }
        setUploadingImages(false);
      } else if (returnImages.length > 0) {
        // Mock upload: use the base64 preview URLs
        uploadedImageUrls = [...returnImagePreviews];
      }

      const returnData = {
        returnStatus: "requested",
        returnReason: returnReason,
        returnDescription: returnDetails,
        returnDetails: returnDetails, // Keep for backward compatibility
        returnRequestedAt: isConfigValid && db ? serverTimestamp() : new Date().toISOString(),
        refundStatus: "pending",
        refundProcessedAt: null,
        returnImages: uploadedImageUrls
      };

      if (isCOD) {
        returnData.refundMethod = refundMethod;
        returnData.refundDetails = refundDetails;
      }

      if (isConfigValid && db) {
        // Update in root orders collection
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, returnData);

        // Update in user subcollection for completeness
        if (currentUser?.uid) {
          const userOrderRef = doc(db, 'users', currentUser.uid, 'orders', orderId);
          await updateDoc(userOrderRef, returnData).catch(err => {
            console.warn("Could not sync user subcollection return info:", err);
          });
        }
      } else {
        // Update mock local storage orders
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const updated = stored.map(o => 
          o.orderId === selectedOrderForReturn.orderId 
            ? { ...o, ...returnData } 
            : o
        );
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));
        
        // Update state in real-time
        setOrders(prev => prev.map(o => o.orderId === selectedOrderForReturn.orderId ? { ...o, ...returnData } : o));
      }

      setReturnStep('SUCCESS');
    } catch (err) {
      console.error("Error submitting return:", err);
      setReturnError("Failed to submit return request: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingReturn(false);
      setUploadingImages(false);
    }
  };

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
                        {isReturnAllowed(order) && (
                          <button
                            onClick={() => handleOpenReturnModal(order)}
                            className="px-3.5 py-1.5 border border-amber-500/20 bg-amber-50 hover:bg-amber-100 text-amber-600 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 transition-all cursor-pointer select-none animate-pulse"
                          >
                            Return Order
                          </button>
                        )}
                        {order.returnStatus === 'requested' && (
                          <span className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold uppercase rounded-lg select-none">
                            Return Requested
                          </span>
                        )}
                        {order.returnStatus === 'approved' && (
                          <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold uppercase rounded-lg select-none">
                            Return Approved
                          </span>
                        )}
                        {order.returnStatus === 'completed' && (
                          <span className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold uppercase rounded-lg select-none">
                            Return Completed
                          </span>
                        )}
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

                    {order.returnStatus && (
                      <div className="p-4 md:p-5 bg-amber-50/30 rounded-2xl border border-amber-100/50 space-y-3.5 text-left select-none mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-2 gap-2 leading-tight">
                          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Return & Refund Status Tracker</span>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/40">
                              Return Status: {order.returnStatus === 'requested' ? 'Return Requested' : order.returnStatus === 'approved' ? 'Return Approved' : order.returnStatus === 'completed' ? 'Return Completed' : order.returnStatus}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              order.refundStatus === 'successful' || order.refundStatus === 'completed'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100/40' 
                                : 'bg-amber-50 text-amber-500 border-amber-100/40'
                            }`}>
                              Refund Status: {order.refundStatus === 'successful' ? 'Refund Successful' : order.refundStatus === 'completed' ? 'Refund Successful' : order.refundStatus === 'pending' ? 'Refund Pending' : order.refundStatus || 'Refund Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Visual timeline */}
                        <div className="relative pl-6 border-l-2 border-amber-200 space-y-4.5 py-1.5">
                          {/* Step 1: Return Requested */}
                          <div className="relative">
                            <div className="absolute left-[-29px] top-0.5 w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-500 text-white flex items-center justify-center text-[7px]">✔</div>
                            <h4 className="text-xs font-bold text-dark">Return Requested</h4>
                            <p className="text-[10px] text-dark/50 font-light">
                              Your return request has been submitted on {order.returnRequestedAt ? new Date(order.returnRequestedAt).toLocaleString('en-IN') : 'review'}.
                            </p>
                            {order.returnReason && (
                              <p className="text-[9px] text-amber-800 font-bold mt-0.5 bg-amber-50/50 inline-block px-1.5 py-0.5 rounded">Reason: {order.returnReason}</p>
                            )}
                          </div>
                          
                          {/* Step 2: Refund Pending */}
                          <div className="relative">
                            <div className={`absolute left-[-29px] top-0.5 w-3 h-3 rounded-full border-2 bg-white flex items-center justify-center text-[7px] ${
                              ['pending', 'successful', 'completed', 'Refund Initiated', 'Refund Processing', 'approved'].includes(order.refundStatus) || order.returnStatus === 'approved' ? 'border-amber-500 bg-amber-500 text-white' : 'border-dark/15 text-dark/40'
                            }`}>
                              {(['pending', 'successful', 'completed', 'Refund Initiated', 'Refund Processing', 'approved'].includes(order.refundStatus) || order.returnStatus === 'approved') && '✔'}
                            </div>
                            <h4 className={`text-xs font-bold ${(['pending', 'successful', 'completed', 'Refund Initiated', 'Refund Processing', 'approved'].includes(order.refundStatus) || order.returnStatus === 'approved') ? 'text-dark' : 'text-dark/45'}`}>Refund Pending</h4>
                            <p className="text-[10px] text-dark/50 font-light">
                              {['successful', 'completed'].includes(order.refundStatus)
                                ? 'Refund has been approved and processed.'
                                : 'Refund is pending administrative verification.'}
                            </p>
                          </div>

                          {/* Step 3: Return Completed */}
                          <div className="relative">
                            <div className={`absolute left-[-29px] top-0.5 w-3 h-3 rounded-full border-2 bg-white flex items-center justify-center text-[7px] ${
                              order.returnStatus === 'completed' ? 'border-amber-500 bg-amber-500 text-white' : 'border-dark/15 text-dark/40'
                            }`}>
                              {order.returnStatus === 'completed' && '✔'}
                            </div>
                            <h4 className={`text-xs font-bold ${order.returnStatus === 'completed' ? 'text-dark' : 'text-dark/45'}`}>Return Completed</h4>
                            <p className="text-[10px] text-dark/50 font-light">
                              {order.returnStatus === 'completed'
                                ? 'Return has been marked as completed.'
                                : 'Return will be marked completed once refund is finalized.'}
                            </p>
                          </div>

                          {/* Step 4: Refund Successful */}
                          <div className="relative">
                            <div className={`absolute left-[-29px] top-0.5 w-3 h-3 rounded-full border-2 bg-white flex items-center justify-center text-[7px] ${
                              ['successful', 'completed'].includes(order.refundStatus) ? 'border-amber-500 bg-amber-500 text-white' : 'border-dark/15 text-dark/40'
                            }`}>
                              {['successful', 'completed'].includes(order.refundStatus) && '✔'}
                            </div>
                            <h4 className={`text-xs font-bold ${['successful', 'completed'].includes(order.refundStatus) ? 'text-dark' : 'text-dark/45'}`}>Refund Successful</h4>
                            <p className="text-[10px] text-dark/50 font-light">
                              {['successful', 'completed'].includes(order.refundStatus)
                                ? `Refund of ₹${order.refundAmount || order.totalAmount} was processed successfully${order.refundProcessedAt || order.refundCompletedAt ? ` on ${new Date(order.refundProcessedAt || order.refundCompletedAt).toLocaleString('en-IN')}` : ''}.`
                                : 'Refund will be credited to your account.'}
                            </p>
                            {order.refundTransactionId && (
                              <p className="text-[8px] font-mono text-dark/45 select-all mt-0.5">Ref: {order.refundTransactionId}</p>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <Modal
        isOpen={showReturnModal}
        onClose={() => {
          if (!submittingReturn && !uploadingImages) {
            setShowReturnModal(false);
            setSelectedOrderForReturn(null);
            setReturnStep('FORM');
            setReturnReason('');
            setReturnDetails('');
            setReturnImages([]);
            setReturnImagePreviews([]);
            setReturnError(null);
          }
        }}
        title={
          returnStep === 'SUCCESS'
            ? 'Return Request Submitted'
            : returnStep === 'CONFIRM'
              ? 'Confirm Return Request'
              : `Return Order #${selectedOrderForReturn?.orderId}`
        }
        size="md"
      >
        {selectedOrderForReturn && (
          <div className="space-y-5 text-left select-none">
            
            {/* Step 1: Form Fill */}
            {returnStep === 'FORM' && (
              <div className="space-y-5">
                {/* Order Summary Card */}
                <div className="bg-background/40 border border-dark/5 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-dark/45 font-bold uppercase tracking-wider border-b border-dark/5 pb-2">
                    <span>Order Summary</span>
                    <span>Delivered on: {new Date(selectedOrderForReturn.deliveredAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  
                  {/* Products list */}
                  <div className="space-y-2.5 max-h-36 overflow-y-auto">
                    {selectedOrderForReturn.items && selectedOrderForReturn.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs leading-tight">
                        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary font-bold shrink-0 border border-primary/5">
                          +
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-bold text-dark truncate">{item.medicine_name}</p>
                          <p className="text-[10px] text-dark/45 font-medium truncate">{item.brand}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-dark/45 font-medium">Qty: {item.quantity}</p>
                          <p className="font-bold text-dark">₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-dark/5 text-xs font-bold text-dark leading-tight">
                    <span>Order Total:</span>
                    <span className="text-primary text-sm font-extrabold">₹{selectedOrderForReturn.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Return Reason selection */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-primary tracking-wider">Why are you returning this product? *</label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {[
                      { value: "Product damaged", label: "Product damaged / Broken seal" },
                      { value: "Wrong product received", label: "Wrong product received" },
                      { value: "Product is defective", label: "Product is defective / Malfunctioned" },
                      { value: "Product is expired", label: "Product is expired" },
                      { value: "Product is different from description", label: "Product is different from description" },
                      { value: "Product not needed anymore", label: "Product not needed anymore" },
                      { value: "Other", label: "Other / Personal reasons" }
                    ].map((reason) => {
                      const isSelected = returnReason === reason.value;
                      return (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => {
                            setReturnReason(reason.value);
                            setReturnError(null);
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-dark/10 hover:border-dark/20 text-dark/70'
                          }`}
                        >
                          <span>{reason.label}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-primary text-primary' : 'border-dark/25'
                          }`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-primary tracking-wider">Additional details (Optional)</label>
                  <textarea
                    value={returnDetails}
                    onChange={(e) => setReturnDetails(e.target.value)}
                    rows="2.5"
                    placeholder="Tell us more about the issue..."
                    className="w-full px-4 py-3 bg-background border border-dark/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-dark resize-none placeholder-dark/35"
                  />
                </div>

                {/* Bank Details section for COD orders */}
                {(selectedOrderForReturn.paymentMethod === 'COD' || selectedOrderForReturn.paymentMethod === 'Cash on Delivery (COD)') && (
                  <div className="space-y-4 border-t border-dark/5 pt-4">
                    <div className="space-y-1 bg-amber-50/20 border border-amber-500/10 p-3.5 rounded-2xl">
                      <h4 className="text-xs font-extrabold text-amber-700">Bank Details for Refund</h4>
                      <p className="text-[10px] text-amber-800 leading-normal font-medium mt-0.5">
                        Since this order was paid using Cash on Delivery, your refund will be transferred to your bank account after the return is approved and processed. The refund is expected to be credited within 3–5 business days after the refund is initiated, depending on bank processing time.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-primary tracking-wider">Account Holder Name *</label>
                        <input
                          type="text"
                          value={bankHolderName}
                          onChange={(e) => setBankHolderName(e.target.value)}
                          placeholder="Name as it appears on your bank passbook"
                          className="w-full text-xs px-3.5 py-3 bg-background border border-dark/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium placeholder-dark/35"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-primary tracking-wider">Bank Account Number *</label>
                        <input
                          type="password"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="Enter account number"
                          className="w-full text-xs px-3.5 py-3 bg-background border border-dark/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium placeholder-dark/35 font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-primary tracking-wider">Confirm Account Number *</label>
                        <input
                          type="text"
                          value={confirmBankAccountNumber}
                          onChange={(e) => setConfirmBankAccountNumber(e.target.value)}
                          placeholder="Re-enter account number"
                          className="w-full text-xs px-3.5 py-3 bg-background border border-dark/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium placeholder-dark/35 font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-primary tracking-wider">IFSC Code *</label>
                        <input
                          type="text"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                          placeholder="e.g. SBIN0001234 (11 characters)"
                          className="w-full text-xs px-3.5 py-3 bg-background border border-dark/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium placeholder-dark/35 font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-primary tracking-wider">Upload Product Photos (Optional)</label>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Upload trigger button */}
                    {returnImages.length < 3 && (
                      <label className="w-14 h-14 bg-background border-2 border-dashed border-dark/10 hover:border-primary/50 rounded-xl flex flex-col items-center justify-center text-dark/45 hover:text-primary transition-colors cursor-pointer select-none">
                        <MdCloudUpload className="text-xl" />
                        <span className="text-[7.5px] font-bold mt-0.5">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* Previews */}
                    {returnImagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative w-14 h-14 border border-dark/5 rounded-xl overflow-hidden bg-background shrink-0">
                        <img src={preview} alt="Return Item" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] cursor-pointer shadow border border-white/20"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-dark/40">Max 3 images. Supported: JPG, PNG, WebP (under 5MB each)</p>
                </div>

                {/* Error Banner */}
                {returnError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-semibold leading-relaxed">
                    <MdErrorOutline className="text-red-500 text-lg shrink-0" />
                    <span>{returnError}</span>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-4 border-t border-dark/5 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReturnModal(false);
                      setSelectedOrderForReturn(null);
                    }}
                    className="flex-grow py-3 text-xs font-bold uppercase rounded-xl border border-dark/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!returnReason}
                    onClick={() => setReturnStep('CONFIRM')}
                    className="flex-grow py-3 text-xs font-bold uppercase rounded-xl bg-primary text-white disabled:opacity-50"
                  >
                    Submit Return Request
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Confirm Prompt */}
            {returnStep === 'CONFIRM' && (
              <div className="text-center py-6 space-y-6">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                  <MdErrorOutline className="text-2xl text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-dark">Confirm Return</h3>
                  <p className="text-xs sm:text-sm text-dark/65 max-w-sm mx-auto leading-relaxed font-light">
                    Are you sure you want to request a return for this order?
                  </p>
                </div>
                
                {returnError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center gap-2.5 text-red-700 text-xs font-semibold leading-relaxed max-w-sm mx-auto text-left">
                    <MdErrorOutline className="text-red-500 text-lg shrink-0" />
                    <span>{returnError}</span>
                  </div>
                )}

                <div className="flex gap-3 max-w-sm mx-auto pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submittingReturn}
                    onClick={() => {
                      setReturnStep('FORM');
                      setReturnError(null);
                    }}
                    className="flex-grow py-3 text-xs font-bold uppercase rounded-xl border border-dark/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    loading={submittingReturn}
                    onClick={handleSubmitReturn}
                    className="flex-grow py-3 text-xs font-bold uppercase rounded-xl bg-primary text-white"
                  >
                    {submittingReturn ? "Submitting..." : "Confirm Return"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {returnStep === 'SUCCESS' && (
              <div className="text-center py-6 space-y-6">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <MdCheckCircle className="text-2xl text-emerald-500" />
                </div>
                <div className="space-y-2.5">
                  <h3 className="text-lg font-bold text-dark">Return Request Submitted</h3>
                  <p className="text-xs sm:text-sm text-dark/65 max-w-sm mx-auto leading-relaxed font-light">
                    Your return request has been submitted successfully. Our team will review your request and update the return status.
                  </p>
                  <p className="text-[10px] bg-slate-50 border border-slate-200/50 text-dark/60 font-semibold px-2.5 py-1 rounded-md inline-block select-all">
                    Return Request ID: RET-{selectedOrderForReturn.orderId}
                  </p>
                </div>

                <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setShowReturnModal(false);
                      setSelectedOrderForReturn(null);
                      setReturnStep('FORM');
                    }}
                    className="w-full py-3 text-xs font-bold uppercase rounded-xl bg-primary text-white"
                  >
                    View Return Status
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReturnModal(false);
                      setSelectedOrderForReturn(null);
                      setReturnStep('FORM');
                    }}
                    className="w-full py-3 text-xs font-bold uppercase rounded-xl border border-dark/10"
                  >
                    Back to Order
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

    </div>
  );
}


