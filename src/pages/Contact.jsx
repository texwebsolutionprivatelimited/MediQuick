import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FaWhatsapp, FaRegClock } from 'react-icons/fa';
import { MdCall, MdMailOutline, MdRoom, MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';

export default function Contact() {
  const { currentUser } = useAuth();
  const { systemSettings } = useSettings();

  const getWhatsappUrl = () => {
    let targetPhone = systemSettings?.supportPhone || "+1 (555) 019-2834";
    const cleanPhone = targetPhone.replace(/[\s\-+]/g, "");
    const finalPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;

    const baseText = currentUser
      ? `Hi ${currentUser.displayName || currentUser.fullName || 'Customer'}, welcome to MediQuick Support! Let us know how we can assist you today.`
      : "Hi, welcome to MediQuick Support! Let us know how we can assist you today.";
      
    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(baseText)}`;
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/90 text-left">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Home Page
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-left space-y-3 mb-12">
          <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider">Get In Touch</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063B44] leading-tight">
            Contact <span className="text-primary">MediQuick</span> Support
          </h1>
          <p className="text-sm text-dark/50 max-w-xl font-light">
            We are here to help you 24/7. Reach out through our phone support, email channels, or start an instant chat on WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Direct Contact Info (7 cols on desktop) */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Call Support Card */}
              <div className="flex items-start gap-4 p-5 bg-white border border-dark/5 shadow-soft rounded-[20px] hover:shadow-hover transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                  <MdCall />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-dark">Call Center Support</h4>
                  <p className="text-xs text-dark/50 font-light">Direct phone support for order inquiries and drug advice.</p>
                  <p className="text-sm font-bold text-primary mt-1">{systemSettings?.supportPhone || "+1 (555) 019-2834"}</p>
                </div>
              </div>

              {/* Email Support Card */}
              <div className="flex items-start gap-4 p-5 bg-white border border-dark/5 shadow-soft rounded-[20px] hover:shadow-hover transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                  <MdMailOutline />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-dark">Email Correspondence</h4>
                  <p className="text-xs text-dark/50 font-light">Send your questions, refund queries, or prescription documents.</p>
                  <p className="text-sm font-bold text-primary mt-1">{systemSettings?.supportEmail || "support@mediquick.com"}</p>
                </div>
              </div>

              {/* Physical Pharmacy Address Card */}
              <div className="flex items-start gap-4 p-5 bg-white border border-dark/5 shadow-soft rounded-[20px] hover:shadow-hover transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                  <MdRoom />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-dark">Distribution Pharmacy</h4>
                  <p className="text-xs text-dark/50 font-light">Phase 2, Gachibowli, Hyderabad, Telangana, 500032</p>
                </div>
              </div>
            </div>

            {/* Operating Hours Alert */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-2.5 text-xs text-primary-dark font-medium">
              <FaRegClock className="text-base shrink-0 text-primary" />
              <span>Pharmacy Dispatch & Call Center Operating Hours: {systemSettings?.operatingHours || "24/7, 365 Days"}.</span>
            </div>
          </div>

          {/* Right Column: Premium WhatsApp Contact Card (5 cols on desktop) */}
          <div className="md:col-span-5">
            <div className="h-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 sm:p-8 rounded-[32px] shadow-premium flex flex-col justify-between relative overflow-hidden select-none">
              {/* Decorative Circle Shapes */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-6 text-left">
                {/* Badge */}
                <span className="bg-white/15 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider inline-block">
                  Instant Support
                </span>

                <div className="space-y-3">
                  <FaWhatsapp className="text-5xl text-white drop-shadow-md animate-pulse" />
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                    WhatsApp Chat
                  </h3>
                  <p className="text-xs text-white/80 font-light leading-relaxed">
                    Connect directly to our dedicated medical assistants on WhatsApp. Ideal for swift order tracking, order cancellations, and quick help.
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-8 text-left space-y-4">
                {/* Active Indicator */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/90">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Average response time: &lt; 2 minutes
                </div>

                <button
                  onClick={() => window.open(getWhatsappUrl(), '_blank')}
                  className="w-full py-4 bg-white hover:bg-emerald-50 text-emerald-600 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border-none"
                >
                  <FaWhatsapp className="text-lg" />
                  Chat on WhatsApp Now
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
