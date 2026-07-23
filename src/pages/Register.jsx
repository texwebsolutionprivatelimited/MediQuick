import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  MdVisibility, 
  MdVisibilityOff, 
  MdCheckCircle, 
  MdErrorOutline,
  MdWc,
  MdCalendarToday
} from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function Register() {
  const { register: registerUser, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onTouched'
  });

  const passwordVal = watch('password', '');

  // Calculate password strength rating
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: 'bg-dark/10' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, text: 'Weak', color: 'bg-red-500 w-1/3' };
    if (score <= 4) return { score: 2, text: 'Fair', color: 'bg-amber-500 w-2/3' };
    return { score: 3, text: 'Strong', color: 'bg-secondary w-full' };
  };

  const strength = getPasswordStrength(passwordVal);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await registerUser(data.email, data.password, data.fullName, {
        fullName: data.fullName,
        mobileNumber: data.phone,
        gender: data.gender,
        dateOfBirth: data.dob,
      });
      setSuccessMsg("Account created successfully! Redirecting to Login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const getFirebaseErrorMessage = (error) => {
        switch (error.code) {
          case 'auth/email-already-in-use':
            return 'This email address is already registered.';
          case 'auth/weak-password':
            return 'The password is too weak. Please use a stronger password.';
          case 'auth/invalid-email':
            return 'The email address is invalid.';
          default:
            return error.message || 'Failed to create account. Please try again.';
        }
      };
      setErrorMsg(getFirebaseErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      setSuccessMsg("Successfully signed in with Google!");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setErrorMsg("Google Sign-In failed.");
      setLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithApple();
      setSuccessMsg("Successfully signed in with Apple!");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setErrorMsg("Apple Sign-In failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FCFC] px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[500px]"
      >
        {/* Main centered card */}
        <div className="bg-white rounded-[20px] shadow-soft border border-dark/5 p-8 sm:p-10 select-none text-left">
          
          {/* Logo Branding */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-soft font-bold">
              +
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">MediQuick</span>
          </div>

          {/* Heading Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dark">Create Your Account</h2>
            <p className="text-sm text-dark/45 mt-1 font-light">Fill in the details below to get started.</p>
          </div>

          {/* Success and Error Alerts */}
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

          {/* Registration Form Grid (2-columns on tablet/desktop) */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Row 1: Full Name & Email Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                required
                error={errors.fullName}
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' }
                })}
              />
              
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                required
                error={errors.email}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>

            {/* Row 2: Mobile Number & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Number"
                placeholder="Enter your mobile number"
                required
                error={errors.phone}
                {...register('phone', {
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit mobile number'
                  }
                })}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  required
                  error={errors.password}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-dark/35 hover:text-dark/75 focus:outline-none"
                >
                  {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>

                {/* Password Strength Indicator */}
                {passwordVal && (
                  <div className="mt-1.5 text-left">
                    <div className="h-1 w-full bg-dark/5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strength.color}`} />
                    </div>
                    <span className="text-[10px] text-dark/40 font-medium mt-0.5 inline-block">
                      Strength: <span className="text-dark/75 font-semibold">{strength.text}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Confirm Password & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  required
                  error={errors.confirmPassword}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === passwordVal || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-[38px] text-dark/35 hover:text-dark/75 focus:outline-none"
                >
                  {showConfirmPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              </div>

              <div className="flex flex-col text-left gap-1.5">
                <label htmlFor="gender" className="text-xs font-semibold text-dark/70 tracking-wider uppercase select-none">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="gender"
                    required
                    className={`w-full px-4 py-3 text-sm bg-background border rounded-xl appearance-none outline-none focus-ring ${
                      errors.gender ? 'border-red-400 focus:border-red-400' : 'border-dark/10 hover:border-dark/20'
                    }`}
                    {...register('gender', { required: 'Please select your gender' })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <MdWc className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/35 text-lg pointer-events-none" />
                </div>
                {errors.gender && (
                  <span className="text-xs text-red-500 pl-1 font-medium">{errors.gender.message}</span>
                )}
              </div>
            </div>

            {/* Row 4: Date of Birth */}
            <div className="relative">
              <Input
                label="Date of Birth"
                type="date"
                required
                error={errors.dob}
                {...register('dob', { required: 'Date of birth is required' })}
              />
              <MdCalendarToday className="absolute right-4 top-[38px] text-dark/35 text-lg pointer-events-none bg-background pr-1" />
            </div>

            {/* Terms Checkbox */}
            <div className="flex flex-col items-start gap-1 pt-1">
              <label className="flex items-start gap-2.5 text-xs text-dark/65 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-primary border-dark/20 focus:ring-primary/45 focus:ring-offset-0 focus:ring-2 w-4 h-4 cursor-pointer"
                  {...register('terms', { required: 'You must accept the terms and conditions' })}
                />
                <span className="text-left leading-normal font-light">
                  I agree to the <Link to="/terms" className="text-primary hover:underline font-semibold">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>.
                </span>
              </label>
              {errors.terms && (
                <span className="text-xs text-red-500 pl-6 font-medium text-left">{errors.terms.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3.5 mt-4 rounded-xl font-bold bg-[#009688] hover:bg-[#00796B] text-sm text-white"
            >
              Create Account
            </Button>
          </form>

          {/* Social Divider */}
          <div className="my-6 flex items-center justify-between gap-4">
            <span className="w-full h-px bg-dark/5"></span>
            <span className="text-[10px] font-semibold tracking-wider text-dark/30 uppercase shrink-0">or continue with</span>
            <span className="w-full h-px bg-dark/5"></span>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handleGoogleSignup}
              variant="outline"
              disabled={loading}
              icon={FcGoogle}
              className="py-2.5 border-dark/10 hover:bg-dark/5 text-dark/75 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              Continue with Google
            </Button>
            <Button
              onClick={handleAppleSignup}
              variant="outline"
              disabled={loading}
              icon={FaApple}
              className="py-2.5 border-dark/10 hover:bg-dark/5 text-dark/75 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              Continue with Apple
            </Button>
          </div>

          {/* Footer Link */}
          <p className="mt-8 text-center text-xs sm:text-sm text-dark/55">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold transition-colors">
              Login Now
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
}
