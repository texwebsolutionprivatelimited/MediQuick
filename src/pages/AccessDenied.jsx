import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdErrorOutline, MdArrowBack } from 'react-icons/md';
import Button from '../components/Button';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F8FCFC] min-h-[75vh] flex items-center justify-center py-12 px-4 font-sans text-left">
      <div className="w-full max-w-md bg-white border border-dark/5 p-8 sm:p-10 rounded-[28px] shadow-premium text-center space-y-6">
        
        {/* Error lock symbol */}
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-3xl border border-red-100/50">
          <MdErrorOutline />
        </div>

        {/* Title and Descriptions */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark tracking-tight leading-tight">Access Denied</h2>
          <p className="text-xs sm:text-sm text-dark/50 leading-relaxed font-light max-w-sm mx-auto">
            You do not have the required administrative permissions to access this page. This portal is restricted to authorized personnel only.
          </p>
        </div>

        {/* Informative notification box */}
        <div className="bg-background border border-dark/5 p-4 rounded-2xl text-[11px] sm:text-xs text-left text-dark/75 leading-relaxed">
          🔒 <span className="font-bold text-primary">Security System Alert:</span> Your current account role does not permit access. If you believe this is an error, please contact the lead system administrator.
        </div>

        {/* Return buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button 
            variant="primary" 
            onClick={() => navigate('/')} 
            className="w-full py-3.5 bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow"
          >
            Return to Homepage
          </Button>
          <button 
            onClick={() => navigate('/login?redirect=admin')} 
            className="w-full py-3.5 hover:bg-background text-dark/60 hover:text-dark font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <MdArrowBack className="text-base" /> Log in as Admin
          </button>
        </div>

      </div>
    </div>
  );
}
