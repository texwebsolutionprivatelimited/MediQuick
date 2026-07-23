import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { 
  MdLocalPharmacy, 
  MdSecurity, 
  MdPayment,
  MdMail,
  MdPhone
} from 'react-icons/md';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedinIn 
} from 'react-icons/fa';

export default function Footer() {
  const { currentUser } = useAuth();
  const { systemSettings } = useSettings();

  const getDoctorConsultUrl = () => {
    let targetPhone = systemSettings?.supportPhone || "+1 (555) 019-2834";
    const cleanPhone = targetPhone.replace(/[\s\-+]/g, "");
    const finalPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;

    const baseText = currentUser
      ? `Hi ${currentUser.displayName || currentUser.fullName || 'Customer'}, welcome to MediQuick Doctor Consult! A certified pharmacist/doctor will connect with you here shortly.`
      : "Hi, welcome to MediQuick Doctor Consult! A certified pharmacist/doctor will connect with you here shortly.";

    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(baseText)}`;
  };

  return (
    <footer className="w-full bg-[#063B44] text-white/80 select-none font-sans border-t border-white/5">
      
      {/* 🚀 TOP FOOTER COLUMNS */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center sm:text-left">
          
          {/* Column 1: Brand Info */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2 flex flex-col items-center sm:items-start space-y-4">
            <Link to="/" className="flex items-center gap-2 text-white justify-center sm:justify-start">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold">
                +
              </div>
              <span className="text-lg font-black tracking-tight">MediQuick</span>
            </Link>
            <p className="text-xs text-white/50 leading-relaxed font-light pr-4 max-w-sm">
              Your trusted partner in health and wellness. Bringing authentic medicines, healthcare devices, and online consultations straight to your doorstep in under 1 hour.
            </p>
            <div className="flex items-center gap-3 pt-2 justify-center sm:justify-start">
              <span className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors text-sm">
                <FaFacebookF />
              </span>
              <span className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors text-sm">
                <FaTwitter />
              </span>
              <span className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors text-sm">
                <FaInstagram />
              </span>
              <span className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors text-sm">
                <FaLinkedinIn />
              </span>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Company</h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-primary transition-colors">Careers</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="space-y-3 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Customer</h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link to="/order-tracking" className="hover:text-primary transition-colors">Track Orders</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">FAQ & Help</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Services */}
          <div className="space-y-3 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Services</h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link to="/medicines" className="hover:text-primary transition-colors">Medicines</Link>
              </li>
              <li>
                <Link to="/medicines?category=Lab%20Tests" className="hover:text-primary transition-colors">Lab Tests</Link>
              </li>
              <li>
                <button
                  onClick={() => window.open(getDoctorConsultUrl(), '_blank')}
                  className="hover:text-primary transition-colors cursor-pointer border-none bg-transparent text-center sm:text-left p-0 font-light text-xs w-full sm:w-auto"
                >
                  Consult Doctor
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Column 5: Legal & Contact details wrapper for mobile responsiveness */}
        <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center text-center md:text-left">
          <div className="flex flex-wrap gap-4 text-xs font-light justify-center md:justify-start">
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-white/20">|</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms & Conditions</span>
          </div>
          <div className="flex flex-wrap gap-6 justify-center md:justify-end text-xs text-white/50">
            <div className="flex items-center gap-1.5 justify-center">
              <MdPhone className="text-primary text-base" />
              <span>{systemSettings?.supportPhone || "+1 (555) 019-2834"}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <MdMail className="text-primary text-base" />
              <span>{systemSettings?.supportEmail || "support@mediquick.com"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 🚀 BOTTOM ROW BAR (Copyright / Payments) */}
      <div className="w-full bg-[#032025] py-4 text-center">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/40">
          <p>&copy; {new Date().getFullYear()} MediQuick. All rights reserved. Sourced under pharma licensing norms.</p>
          <div className="flex items-center gap-1">
            <MdSecurity className="text-base text-primary/60" />
            <span className="uppercase tracking-widest">100% Secure Transaction Guarantee</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
