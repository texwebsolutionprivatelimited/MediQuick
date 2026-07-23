import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MdEmail, 
  MdPhone, 
  MdRoom, 
  MdPerson, 
  MdCalendarToday,
  MdArrowBack
} from 'react-icons/md';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // If not logged in, redirect to login page (safeguard)
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }



  const fullName = currentUser.fullName || currentUser.displayName || 'Not Provided';
  const email = currentUser.email || 'Not Provided';
  const phone = currentUser.mobileNumber || currentUser.phone || 'Not Provided';
  const deliveryAddress = currentUser.location || currentUser.deliveryAddress || currentUser.address || 'Not Provided';
  const role = currentUser.role 
    ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) 
    : 'User';

  const getCreationDate = () => {
    if (currentUser.createdAt) {
      try {
        return new Date(currentUser.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (_) {}
    }
    if (currentUser.metadata?.creationTime) {
      try {
        return new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (_) {}
    }
    return 'Not Provided';
  };

  const creationDate = getCreationDate();

  return (
    <div className="bg-[#F8FCFC] min-h-[75vh] flex items-center justify-center py-12 px-4 font-sans text-left bg-gradient-soft">
      <div className="w-full max-w-[500px] space-y-6">
        
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-bold text-dark/60 hover:text-primary transition-colors cursor-pointer select-none"
        >
          <MdArrowBack className="text-base" /> Back
        </button>

        <Card hoverable={false} className="bg-white border border-dark/5 p-6 sm:p-10 rounded-[32px] shadow-premium overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start pb-8 border-b border-dark/5">
            {/* Avatar Image / Default Icon Container */}
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-md select-none shrink-0 overflow-hidden">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <MdPerson className="text-5xl" />
              )}
            </div>

            {/* Profile Brief Info */}
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-2xl font-extrabold text-dark tracking-tight leading-none">{fullName}</h1>
              <p className="text-xs text-dark/50 leading-relaxed font-light">{email}</p>
              <div className="pt-1.5 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="bg-primary/10 text-primary-dark font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider leading-none">
                  {role} Account
                </span>
                {currentUser.role === 'admin' && (
                  <span className="bg-secondary/10 text-secondary-dark font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider leading-none">
                    Console Access Enabled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 text-xs sm:text-sm">
            
            {/* Full Name */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdPerson className="text-base text-dark/35" /> Full Name
              </span>
              <p className="font-semibold text-dark leading-relaxed pl-5">{fullName}</p>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdEmail className="text-base text-dark/35" /> Email Address
              </span>
              <p className="font-semibold text-dark leading-relaxed pl-5 truncate" title={email}>{email}</p>
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdPhone className="text-base text-dark/35" /> Contact Number
              </span>
              <p className="font-semibold text-dark leading-relaxed pl-5">{phone}</p>
            </div>



            {/* Created At */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdCalendarToday className="text-base text-dark/35" /> Member Since
              </span>
              <p className="font-semibold text-dark leading-relaxed pl-5">{creationDate}</p>
            </div>

            {/* Delivery Address */}
            <div className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdRoom className="text-base text-dark/35" /> Primary Delivery Address
              </span>
              <p className="font-semibold text-dark leading-relaxed pl-5 leading-normal max-w-xl">{deliveryAddress}</p>
            </div>

          </div>

          {/* Action button */}
          <div className="pt-8 mt-4 border-t border-dark/5 flex justify-end">
            <Button 
              variant="primary" 
              onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/')} 
              className="py-3.5 px-6 bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow"
            >
              {currentUser.role === 'admin' ? 'Go to Admin Console' : 'Continue Shopping'}
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
