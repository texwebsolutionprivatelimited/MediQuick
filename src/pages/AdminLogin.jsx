import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { MdErrorOutline, MdArrowBack, MdLockOutline, MdMailOutline, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Please fill in all credentials fields.");
      setLoading(false);
      return;
    }

    try {
      const user = await login(cleanEmail, password);
      
      // Verify role is admin
      if (user.role !== 'admin') {
        // Safe logging out of non-admin accounts logged in here
        await logout();
        throw new Error("Invalid admin credentials.");
      }

      // Successful redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setErrorMsg(err.message || "Invalid admin credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FCFC] min-h-[85vh] flex items-center justify-center py-12 px-4 font-sans text-left relative overflow-hidden">
      
      {/* Background visual graphics */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Card hoverable={false} padding="p-8 sm:p-10" className="bg-white border border-dark/5 shadow-premium rounded-[28px]">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8 select-none">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl font-black shadow-sm mb-3">
              M+
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-dark tracking-tight leading-tight">Admin Console Portal</h2>
            <p className="text-xs text-dark/45 font-light leading-relaxed max-w-xs mx-auto">
              Please enter your private administrative credentials to log in.
            </p>
          </div>

          {/* Validation Alert */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs font-semibold leading-relaxed">
              <MdErrorOutline className="text-red-500 text-lg shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Administrator Email</label>
              <div className="relative">
                <MdMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40 text-lg" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mediquick.com"
                  className="w-full pl-11 pr-4 py-3 bg-background border border-dark/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Security Password</label>
              <div className="relative">
                <MdLockOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40 text-lg" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-10 py-3 bg-background border border-dark/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60"
                >
                  {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow shadow-primary/20 flex items-center justify-center"
              >
                {loading ? 'Verifying admin security...' : 'Authenticate Admin'}
              </Button>
            </div>
          </form>

          {/* Footer controls */}
          <div className="mt-8 border-t border-dark/5 pt-5 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-dark/50 hover:text-dark font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <MdArrowBack className="text-base" /> Return to Pharmacy Shop
            </button>
          </div>

        </Card>
      </div>

    </div>
  );
}
