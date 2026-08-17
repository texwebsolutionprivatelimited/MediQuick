import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { 
  MdVisibility, 
  MdVisibilityOff, 
  MdCheckCircle, 
  MdErrorOutline,
  MdReceipt,
  MdLocalOffer,
  MdSecurity,
  MdLockOutline,
  MdMailOutline,
  MdVerified,
  MdLocalShipping,
  MdPayment,
  MdMedicalServices
} from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function Login() {
  const { currentUser, login, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Redirect to Home if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Helper to handle dynamic redirect after authentication
  const handleSuccessRedirect = (user, msg) => {
    const fromPath = location.state?.from 
      ? `${location.state.from.pathname || location.state.from}${location.state.from.search || ''}`
      : null;
    const dest = user?.role === 'admin' 
      ? '/admin/dashboard' 
      : (fromPath || (searchParams.get('redirect') === 'admin' ? '/admin' : '/'));
    setSuccessMsg(msg);
    setTimeout(() => {
      navigate(dest);
    }, 1500);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('mediquick_remembered_email'));

  // Forgot password states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [forgotError, setForgotError] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched'
  });

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    reset: resetForgotForm,
    formState: { errors: forgotErrors },
  } = useForm({
    mode: 'onTouched'
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const user = await login(data.email, data.password);
      
      // Remember Me logic (simulated storage)
      if (rememberMe) {
        localStorage.setItem('mediquick_remembered_email', data.email);
      } else {
        localStorage.removeItem('mediquick_remembered_email');
      }

      handleSuccessRedirect(user, "Logged in successfully! Redirecting...");
    } catch (err) {
      const getFirebaseErrorMessage = (error) => {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            return 'Invalid email address or password. Please try again.';
          case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
          case 'auth/too-many-requests':
            return 'Too many failed login attempts. Access is temporarily locked. Please try again later.';
          default:
            return error.message || 'Login failed. Please check your credentials.';
        }
      };
      setErrorMsg(getFirebaseErrorMessage(err));
      setLoading(false);
    }
  };

  // Forgot Password Submit Handler
  const onForgotSubmit = async (data) => {
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    const email = data.forgotEmail.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotSuccess("Password reset link has been sent successfully.");
      setTimeout(() => {
        // Close modal and reset form
        setForgotModalOpen(false);
        resetForgotForm();
        setForgotSuccess(null);
      }, 3500);
    } catch (error) {
      console.error(error);
      const getForgotPassErrorMessage = (err) => {
        switch (err.code) {
          case 'auth/user-not-found':
            return 'No account found with this email.';
          case 'auth/invalid-email':
            return 'The email address is invalid.';
          case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
          case 'auth/too-many-requests':
            return 'Too many requests. Please try again later.';
          case 'auth/configuration-not-found':
            return 'Firebase configuration error. Please contact admin.';
          default:
            return err.message || 'Failed to send password reset email. Please try again.';
        }
      };
      setForgotError(getForgotPassErrorMessage(error));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      handleSuccessRedirect(user, "Successfully signed in with Google! Redirecting...");
    } catch (err) {
      setErrorMsg(err.message || "Google Sign-In failed.");
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithApple();
      handleSuccessRedirect(user, "Successfully signed in with Apple! Redirecting...");
    } catch (err) {
      setErrorMsg(err.message || "Apple Sign-In failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[45%_55%] lg:grid-cols-[40%_60%] xl:grid-cols-[35%_65%] items-stretch bg-[#F8FCFC] font-sans">
      
      {/* Left Column: Welcome Slogans & Animated Medical Vector */}
      <div className="hidden md:flex w-full bg-gradient-to-br from-[#E2F3F0] via-[#F8FCFC] to-white relative flex-col justify-between p-8 sm:p-12 text-dark text-left overflow-hidden border-b md:border-b-0 md:border-r border-dark/5">
        
        {/* Backdrop visual elements */}
        <div className="absolute top-[-5%] left-[-10%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-15%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

        {/* Branding header & Trust Badge */}
        <div className="relative z-10 space-y-3 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft font-bold text-lg">
              +
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">MediQuick</span>
          </div>

          {/* 100% Genuine Medicine Trust Badge */}
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/15 rounded-full px-3.5 py-1.5 w-fit shadow-sm">
            <MdVerified className="text-primary text-sm sm:text-base shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-extrabold text-primary-dark tracking-wider uppercase">
              100% Genuine Medicine
            </span>
          </div>
        </div>

        {/* Floating 3D Vector SVG Medical Illustration */}
        <div className="flex-grow flex items-center justify-center relative z-10 py-6 md:py-8">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, -1, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 5.5, 
              ease: "easeInOut" 
            }}
            className="w-full max-w-[220px] md:max-w-[360px] drop-shadow-[0_15px_30px_rgba(6,59,68,0.12)]"
          >
            <svg viewBox="0 0 400 400" fill="none" className="w-full h-auto">
              {/* Ground Shadow */}
              <ellipse cx="200" cy="350" rx="120" ry="12" fill="rgba(6, 59, 68, 0.08)" />

              {/* Pharmacy Store Vector */}
              <rect x="130" y="160" width="140" height="150" rx="8" fill="#FFFFFF" stroke="#E6EBEB" strokeWidth="3" />
              <path d="M110 160 L290 160 L200 110 Z" fill="#009688" />
              <rect x="150" y="220" width="100" height="90" rx="4" fill="#E2F3F0" />
              <rect x="175" y="220" width="50" height="90" fill="#00C896" opacity="0.3" />
              <line x1="200" y1="220" x2="200" y2="310" stroke="#009688" strokeWidth="2" />

              {/* Stethoscope */}
              <path d="M260 220 C290 220, 310 250, 300 280 C290 300, 270 280, 260 270" stroke="#FFD54F" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="258" cy="270" r="8" fill="#FFD54F" />

              {/* Delivery Bike/Box Indicator */}
              <rect x="90" y="230" width="50" height="40" rx="6" fill="#063B44" />
              <circle cx="102" cy="280" r="10" fill="#063B44" />
              <circle cx="128" cy="280" r="10" fill="#063B44" />
              {/* Cross symbol on delivery box */}
              <rect x="110" y="245" width="10" height="4" fill="#FFFFFF" />
              <rect x="113" y="242" width="4" height="10" fill="#FFFFFF" />

              {/* Capsule Vector */}
              <g transform="rotate(-25 150 120)">
                <rect x="140" y="80" width="20" height="45" rx="10" fill="#00C896" />
                <path d="M140 102.5 H160 V125 C160 130.5, 155.5 135, 150 135 S140 130.5, 140 125 Z" fill="#FFFFFF" opacity="0.8" />
              </g>
            </svg>
          </motion.div>
        </div>

        {/* Dynamic Slogan Headings */}
        <div className="relative z-10 max-w-lg mb-6 md:mb-8">
          {/* Related Benefits List */}
          <div className="flex flex-wrap gap-2 mb-5 select-none">
            <div className="flex items-center gap-1.5 bg-[#E2F3F0]/65 border border-primary/10 rounded-full px-3 py-1 w-fit shadow-sm">
              <MdLocalShipping className="text-primary text-[11px] sm:text-xs shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold text-primary-dark tracking-wide uppercase">
                Fast & Reliable Delivery
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#E2F3F0]/65 border border-primary/10 rounded-full px-3 py-1 w-fit shadow-sm">
              <MdPayment className="text-primary text-[11px] sm:text-xs shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold text-primary-dark tracking-wide uppercase">
                Secure & Easy Payments
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#E2F3F0]/65 border border-primary/10 rounded-full px-3 py-1 w-fit shadow-sm">
              <MdMedicalServices className="text-primary text-[11px] sm:text-xs shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold text-primary-dark tracking-wide uppercase">
                Trusted Healthcare Services
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#063B44] leading-tight tracking-tight">
            Welcome Back!
          </h1>
          <p className="mt-2 md:mt-3 text-[#063B44]/70 text-[11px] sm:text-xs md:text-sm font-light leading-relaxed">
            Sign in to order medicines, upload prescriptions, track orders, and manage your account.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="relative z-10 grid grid-cols-3 gap-2 pt-6 border-t border-dark/10">
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <MdReceipt className="text-sm sm:text-base" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#063B44]/75 tracking-tight leading-tight">Easy Order<br />Tracking</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <MdLocalOffer className="text-sm sm:text-base" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#063B44]/75 tracking-tight leading-tight">Exclusive<br />Offers</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <MdSecurity className="text-sm sm:text-base" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#063B44]/75 tracking-tight leading-tight">100% Secure<br />Account</span>
          </div>
        </div>

      </div>

      {/* Right Column: Centered Login Card & Benefits Panel */}
      <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-8 xl:gap-12 p-6 sm:p-12 bg-white overflow-y-auto">
        {/* Column 1: Login Card & Stats */}
        <div className="w-full max-w-[480px] shrink-0 flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            {/* Main Card with rounded corners (20px) and soft shadow */}
            <div className="bg-white rounded-[20px] shadow-soft border border-dark/5 p-6 sm:p-10 select-none text-left">
              
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-dark">Access Your Account</h2>
                <p className="text-xs sm:text-sm text-dark/45 mt-1 font-light">Sign in to manage your medical orders</p>
              </div>

              {/* Notifications */}
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-center gap-3"
                >
                  <MdCheckCircle className="text-lg text-emerald-500 shrink-0" />
                  <span className="font-medium">{successMsg}</span>
                </motion.div>
              )}

              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-3"
                >
                  <MdErrorOutline className="text-lg text-red-500 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Input */}
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  defaultValue={localStorage.getItem('mediquick_remembered_email') || ''}
                  error={errors.email}
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  rightElement={<MdMailOutline className="text-dark/35 text-lg" />}
                />

                {/* Password Input */}
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    error={errors.password}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-5 h-5 p-0 bg-transparent border-0 outline-none flex items-center justify-center cursor-pointer text-dark/35 hover:text-dark/60 transition-colors"
                      >
                        {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                      </button>
                    }
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-dark/15 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span className="text-xs text-dark/65 font-light">Remember Me</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalOpen(true);
                      setForgotSuccess(null);
                      setForgotError(null);
                      resetForgot();
                    }}
                    className="text-xs font-bold text-primary hover:underline transition-all cursor-pointer bg-transparent border-none outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full py-3.5 mt-4 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
                >
                  Sign In
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark/10" />
                </div>
                <span className="relative z-10 px-3 bg-white text-[10px] font-extrabold text-dark/35 uppercase tracking-wider">
                  Or Continue With
                </span>
              </div>

              {/* Social Login */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  disabled={loading}
                  icon={FcGoogle}
                  className="w-full py-2.5 border-dark/10 hover:bg-dark/5 text-dark/75 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  Continue with Google
                </Button>
                <Button
                  onClick={handleAppleLogin}
                  variant="outline"
                  disabled={loading}
                  icon={FaApple}
                  className="w-full py-2.5 border-dark/10 hover:bg-dark/5 text-dark/75 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  Continue with Apple
                </Button>
              </div>
            </div>
          </motion.div>

          {/* MediQuick at a Glance & Quote (Visible only on xl+) */}
          <div className="hidden xl:flex flex-col gap-4">
            {/* Quote */}
            <div className="flex items-center justify-center gap-2 bg-[#E2F3F0]/40 border border-primary/10 rounded-full py-2 px-4 select-none shadow-xs">
              <span className="text-xs">💚</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-primary-dark tracking-wide italic">
                "Your health, our priority."
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Benefits & Promos */}
        <div className="hidden xl:flex flex-col gap-4 max-w-[310px] xl:-mt-8">
          {/* Vertical Why Choose MediQuick Panel */}
          <div className="flex flex-col w-full min-h-[360px] text-left bg-[#F8FCFC]/60 border border-dark/5 rounded-[24px] p-6 shadow-soft select-none">
            <div className="border-b border-dark/5 pb-3.5 mb-5">
              <h3 className="font-extrabold text-sm sm:text-base text-[#063B44] uppercase tracking-wider">
                Why MediQuick?
              </h3>
              <p className="text-[10px] sm:text-[11px] text-dark/55 font-light mt-1">
                Your trusted partner for healthcare and authentic medicines.
              </p>
            </div>

            {/* Timeline / List Wrapper */}
            <div className="relative flex-grow flex flex-col gap-6 py-1 pl-2">
              {/* Vertical Connecting Line */}
              <div className="absolute left-[21px] top-6 bottom-6 w-[1.5px] bg-gradient-to-b from-primary/30 via-primary/20 to-primary/5 pointer-events-none" />

              {/* Benefit Item 1 */}
              <div className="relative z-10 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shadow-xs shrink-0 select-none border border-primary/20">
                  🛡️
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-dark/85 leading-tight">100% Secure & Private</h4>
                  <p className="text-[10px] text-dark/55 font-light leading-normal">
                    Your data and orders are protected.
                  </p>
                </div>
              </div>

              {/* Benefit Item 2 */}
              <div className="relative z-10 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shadow-xs shrink-0 select-none border border-primary/20">
                  🚚
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-dark/85 leading-tight">Fast & Reliable Delivery</h4>
                  <p className="text-[10px] text-dark/55 font-light leading-normal">
                    Get your medicines delivered quickly.
                  </p>
                </div>
              </div>

              {/* Benefit Item 3 */}
              <div className="relative z-10 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shadow-xs shrink-0 select-none border border-primary/20">
                  💊
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-dark/85 leading-tight">Wide Range of Medicines</h4>
                  <p className="text-[10px] text-dark/55 font-light leading-normal">
                    Everyday essentials and healthcare products.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Promotional Card */}
          <div className="bg-[#E2F3F0]/50 border border-primary/10 rounded-[20px] p-4 text-left shadow-soft select-none">
            <h4 className="font-extrabold text-xs text-[#063B44] leading-tight">
              Save More on Your Medicines
            </h4>
            <p className="text-[10px] text-dark/65 font-light leading-normal mt-1">
              Exclusive offers available for registered users.
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[9px] font-bold text-primary tracking-wide uppercase cursor-pointer hover:underline">
                View Offers →
              </span>
              <span className="text-xs">💰</span>
            </div>
          </div>

          {/* Healthcare Assurance Tags */}
          <div className="flex flex-wrap gap-1.5 select-none">
            <div className="bg-white border border-dark/5 rounded-full px-2.5 py-1 text-[8.5px] font-medium text-dark/60 shadow-xs">
              🛡️ Genuine Medicines
            </div>
            <div className="bg-white border border-dark/5 rounded-full px-2.5 py-1 text-[8.5px] font-medium text-dark/60 shadow-xs">
              🔒 Secure Payments
            </div>
            <div className="bg-white border border-dark/5 rounded-full px-2.5 py-1 text-[8.5px] font-medium text-dark/60 shadow-xs">
              📦 Easy Returns
            </div>
            <div className="bg-white border border-dark/5 rounded-full px-2.5 py-1 text-[8.5px] font-medium text-dark/60 shadow-xs">
              🚀 Reliable Delivery
            </div>
          </div>
        </div>
      </div>

      {/* Centered Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Forgot Password"
        size="sm"
      >
        <div className="text-left space-y-4">
          <p className="text-xs sm:text-sm text-dark/65 leading-relaxed font-light">
            Enter your registered email address. We will send you a password reset link.
          </p>

          {forgotSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <MdCheckCircle className="text-lg text-emerald-500 shrink-0" />
              <span>{forgotSuccess}</span>
            </div>
          )}

          {forgotError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <MdErrorOutline className="text-lg text-red-500 shrink-0" />
              <span className="font-semibold">{forgotError}</span>
            </div>
          )}

          <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-4">
            <Input
              label="Registered Email Address"
              type="email"
              placeholder="name@example.com"
              required
              error={forgotErrors.forgotEmail}
              {...registerForgot('forgotEmail', {
                required: 'Registered email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              rightElement={<MdMailOutline className="text-dark/35 text-lg" />}
            />

            <div className="flex items-center justify-end gap-3.5 pt-2">
              <Button
                onClick={() => setForgotModalOpen(false)}
                variant="ghost"
                disabled={forgotLoading}
                className="px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={forgotLoading}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary text-white"
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
}
