import React from 'react';
import { Link } from 'react-router-dom';
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
  return (
    <footer className="w-full bg-[#063B44] text-white/80 select-none font-sans border-t border-white/5">
      
      {/* 🚀 TOP FOOTER COLUMNS */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold">
                +
              </div>
              <span className="text-lg font-black tracking-tight">MediQuick</span>
            </Link>
            <p className="text-xs text-white/50 leading-relaxed font-light pr-4 max-w-sm">
              Your trusted partner in health and wellness. Bringing authentic medicines, healthcare devices, and online consultations straight to your doorstep in under 1 hour.
            </p>
            <div className="flex items-center gap-3 pt-2">
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
          <div className="space-y-3 text-left">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Company</h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">Careers</span>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="space-y-3 text-left">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Customer</h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link to="/order-tracking" className="hover:text-primary transition-colors">Track Orders</Link>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">FAQ & Help</span>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">Refund Policy</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Services */}
          <div className="space-y-3 text-left">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Services</h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link to="/medicines" className="hover:text-primary transition-colors">Medicines</Link>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">Lab Tests</span>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">Consult Doctor</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Column 5: Legal & Contact details wrapper for mobile responsiveness */}
        <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex flex-wrap gap-4 text-xs font-light">
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-white/20">|</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms & Conditions</span>
          </div>
          <div className="flex flex-wrap gap-6 md:justify-end text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <MdPhone className="text-primary text-base" />
              <span>+1 (555) 019-2834</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MdMail className="text-primary text-base" />
              <span>support@mediquick.com</span>
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
