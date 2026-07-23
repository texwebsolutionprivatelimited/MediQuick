import React, { useState } from 'react';
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
  MdMailOutline
} from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function Login() {
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

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
      if (data.rememberMe) {
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
    <div className="min-h-[calc(100vh-80px)] grid grid-cols-1 md:grid-cols-[45%_55%] items-stretch bg-[#F8FCFC] font-sans">
      
      {/* Left Column: Welcome Slogans & Animated Medical Vector */}
      <div className="hidden md:flex w-full bg-gradient-to-br from-[#E2F3F0] via-[#F8FCFC] to-white relative flex-col justify-between p-8 sm:p-12 text-dark text-left overflow-hidden border-b md:border-b-0 md:border-r border-dark/5">
        
        {/* Backdrop visual elements */}
        <div className="absolute top-[-5%] left-[-10%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-15%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

        {/* Branding header */}
        <div className="flex items-center gap-2.5 select-none relative z-10">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft font-bold text-lg">
            +
          </div>
          <span className="text-lg font-bold tracking-tight text-primary">MediQuick</span>
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

      {/* Right Column: Centered Login Card (55%) */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[500px]"
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
                <MdCheckCircle className="text-xl text-emerald-500 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-3"
              >
                <MdErrorOutline className="text-xl text-red-500 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Username / Email Address Input */}
              <div className="relative">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  error={errors.email}
                  defaultValue={localStorage.getItem('mediquick_remembered_email') || ''}
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                <MdMailOutline className="absolute right-4 top-[38px] text-dark/35 text-lg" />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required
                  error={errors.password}
                  {...register('password', {
                    required: 'Password is required'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-dark/35 hover:text-dark/75 focus:outline-none"
                >
                  {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              </div>

              {/* Remember Me and Forgot Password row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-dark/65 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-primary border-dark/20 focus:ring-primary/45 focus:ring-offset-0 focus:ring-2 w-4 h-4 cursor-pointer"
                    {...register('rememberMe')}
                  />
                  <span>Remember Me</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotModalOpen(true);
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full py-3.5 mt-2 rounded-xl font-bold bg-[#009688] hover:bg-[#00796B] text-sm text-white"
              >
                Sign In
              </Button>
            </form>

            {/* Social Separator */}
            <div className="my-6 flex items-center justify-between gap-4">
              <span className="w-full h-px bg-dark/5"></span>
              <span className="text-[10px] font-semibold tracking-wider text-dark/30 uppercase shrink-0">or continue with</span>
              <span className="w-full h-px bg-dark/5"></span>
            </div>

            {/* Social Buttons */}
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

            {/* Register Link */}
            <p className="mt-8 text-center text-xs sm:text-sm text-dark/55">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-bold transition-colors">
                Register Now
              </Link>
            </p>

          </div>
        </motion.div>
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
