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

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/upload-prescription" element={<UploadPrescription />} />
        <Route path="/order-tracking" element={<OrderTracking />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Public Admin Login Page */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
