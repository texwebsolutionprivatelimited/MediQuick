import React, { useState } from 'react';
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
  const { resetPassword } = useAuth();
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onTouched'
  });

  const passwordVal = watch('newPassword', '');

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // oobCode works for Firebase; mockEmail allows local storage simulation tests
      await resetPassword(oobCode, data.newPassword, mockEmail);
      setSuccessMsg("Your password has been updated successfully. Redirecting to Login page...");
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset password. The link may have expired or is invalid.");
      setLoading(false);
    }
  };

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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-soft font-bold">
              +
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">MediQuick</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dark">Reset Your Password</h2>
            <p className="text-sm text-dark/45 mt-1 font-light">Create a new secure password for your account</p>
          </div>

          {/* Success / Error Alerts */}
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

            {/* Confirm New Password */}
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              required
              error={errors.confirmNewPassword}
              {...register('confirmNewPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === passwordVal || 'Passwords do not match'
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
