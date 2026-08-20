import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  MdVisibility, 
  MdVisibilityOff, 
  MdCheckCircle, 
  MdErrorOutline 
} from 'react-icons/md';

export default function ResetPassword() {
  const { resetPassword, verifyResetCode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract firebase action code (oobCode) and mock email if present
  const oobCode = searchParams.get('oobCode') || '';
  const mockEmail = searchParams.get('email') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isValidating, setIsValidating] = useState(true);
  const [isLinkValid, setIsLinkValid] = useState(null); // null = checking, true = valid, false = invalid
  const [resetEmail, setResetEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onTouched'
  });

  const passwordVal = watch('newPassword', '');

  // Validate the reset link code on mount
  useEffect(() => {
    if (!oobCode) {
      setIsLinkValid(false);
      setIsValidating(false);
      return;
    }

    const checkCode = async () => {
      try {
        const email = await verifyResetCode(oobCode);
        setResetEmail(email || mockEmail || '');
        setIsLinkValid(true);
      } catch (err) {
        console.error("Verification of reset code failed:", err);
        setIsLinkValid(false);
      } finally {
        setIsValidating(false);
      }
    };
    checkCode();
  }, [oobCode, verifyResetCode, mockEmail]);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await resetPassword(oobCode, data.newPassword, mockEmail || resetEmail);
      setSuccessMsg("Password reset successfully!");
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset password. The link may have expired or is invalid.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading screen while verifying code
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFC]">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // 2. Expired / Invalid link screen
  if (isLinkValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFC] px-4 py-12 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-[20px] shadow-soft border border-dark/5 p-8 sm:p-10 select-none text-left">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-soft">
                +
              </div>
              <span className="text-lg font-bold tracking-tight text-primary">MediQuick</span>
            </div>
            
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <MdErrorOutline className="text-2xl text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-dark">Invalid Reset Link</h2>
                <p className="text-xs sm:text-sm text-dark/65 leading-relaxed font-light">
                  This password reset link is invalid or has expired. Please request a new reset link.
                </p>
              </div>
              <Button
                onClick={() => navigate('/login?forgot=true')}
                variant="primary"
                className="w-full py-3.5 mt-2 rounded-xl font-bold bg-[#009688] hover:bg-[#00796B] text-sm text-white"
              >
                Request New Reset Link
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Success Screen
  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFC] px-4 py-12 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-[20px] shadow-soft border border-dark/5 p-8 sm:p-10 select-none text-left">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-soft">
                +
              </div>
              <span className="text-lg font-bold tracking-tight text-primary">MediQuick</span>
            </div>
            
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <MdCheckCircle className="text-2xl text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-dark">Password reset successfully!</h2>
              </div>
              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                className="w-full py-3.5 mt-2 rounded-xl font-bold bg-[#009688] hover:bg-[#00796B] text-sm text-white"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Normal Form View (link is valid)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FCFC] px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[20px] shadow-soft border border-dark/5 p-8 sm:p-10 select-none text-left">
          
          {/* Logo Branding */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-soft font-bold text-lg">
              +
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">MediQuick</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dark">Reset Your Password</h2>
            {resetEmail && (
              <p className="text-[10px] bg-slate-50 text-dark/60 font-semibold px-2.5 py-1 rounded-md border border-slate-200/50 inline-block mx-auto mt-2 select-none">
                For: {resetEmail}
              </p>
            )}
            <p className="text-sm text-dark/45 mt-2 font-light">Create a new secure password for your account</p>
          </div>

          {/* Error Alert (non-blocking) */}
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

          {/* Reset password form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* New Password */}
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              required
              error={errors.newPassword}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                validate: {
                  hasUppercase: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
                  hasLowercase: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
                  hasDigit: (v) => /[0-9]/.test(v) || 'Must contain at least one number'
                }
              })}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-dark/35 hover:text-dark/75 focus:outline-none cursor-pointer flex items-center justify-center w-5 h-5 p-0 bg-transparent border-0 outline-none"
                >
                  {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              }
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              required
              error={errors.confirmNewPassword}
              {...register('confirmNewPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === passwordVal || 'Passwords do not match.'
              })}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-dark/35 hover:text-dark/75 focus:outline-none cursor-pointer flex items-center justify-center w-5 h-5 p-0 bg-transparent border-0 outline-none"
                >
                  {showConfirmPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              }
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3.5 mt-2 rounded-xl font-bold bg-[#009688] hover:bg-[#00796B] text-sm text-white"
            >
              Reset Password
            </Button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
