import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Lazy load pages
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const About = lazy(() => import('../pages/About'));
const Medicines = lazy(() => import('../pages/Medicines'));
const Categories = lazy(() => import('../pages/Categories'));
const ProductDetails = lazy(() => import('../pages/ProductDetails'));
const Cart = lazy(() => import('../pages/Cart'));
const Checkout = lazy(() => import('../pages/Checkout'));
const UploadPrescription = lazy(() => import('../pages/UploadPrescription'));
const OrderTracking = lazy(() => import('../pages/OrderTracking'));
const Contact = lazy(() => import('../pages/Contact'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminLogin = lazy(() => import('../pages/AdminLogin'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const AccessDenied = lazy(() => import('../pages/AccessDenied'));
const Blogs = lazy(() => import('../pages/Blogs'));
const Faq = lazy(() => import('../pages/Faq'));
const RefundPolicy = lazy(() => import('../pages/RefundPolicy'));
const Careers = lazy(() => import('../pages/Careers'));
const Profile = lazy(() => import('../pages/Profile'));
const Wishlist = lazy(() => import('../pages/Wishlist'));

// Simple loading indicator for fallback
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!currentUser) {
    // Redirect to the dedicated Admin Login page
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (currentUser.role !== 'admin') {
    // Redirect standard users to Access Denied
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

// Protected Route Guard for Standard Users
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!currentUser) {
    // Redirect to the login page and preserve the intended path in navigation state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected User Routes */}
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        <Route path="/blogs" element={<ProtectedRoute><Blogs /></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute><Faq /></ProtectedRoute>} />
        <Route path="/refund-policy" element={<ProtectedRoute><RefundPolicy /></ProtectedRoute>} />
        <Route path="/careers" element={<ProtectedRoute><Careers /></ProtectedRoute>} />
        <Route path="/medicines" element={<ProtectedRoute><Medicines /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/upload-prescription" element={<ProtectedRoute><UploadPrescription /></ProtectedRoute>} />
        <Route path="/order-tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

