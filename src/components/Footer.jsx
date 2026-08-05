import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
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
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

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
                <Link to="/medicines" className="hover:text-primary transition-colors leading-normal">Medicines</Link>
              </li>
              <li>
                <Link to="/medicines?category=Lab%20Tests" className="hover:text-primary transition-colors leading-normal">Lab Tests</Link>
              </li>
              <li>
                <button
                  onClick={() => window.open(getDoctorConsultUrl(), '_blank')}
                  className="hover:text-primary transition-colors cursor-pointer border-none bg-transparent p-0 font-light text-xs inline leading-normal !min-h-0 !min-w-0"
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
            <span 
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Privacy Policy
            </span>
            <span className="text-white/20">|</span>
            <span 
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Terms & Conditions
            </span>
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

      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="Privacy Policy"
        size="lg"
      >
        <div className="text-left text-xs text-dark/70 space-y-4 font-sans select-text">
          <p className="font-light text-dark/50 mb-2">Effective Date: August 3, 2026</p>
          
          <div>
            <h4 className="font-bold text-dark text-sm mb-1">1. Information Collected from Users</h4>
            <p className="leading-relaxed font-light">We collect personal details that you provide to us, including your full name, email address, mobile phone number, date of birth, gender, shipping/billing address, and medical prescription files when uploading order requests.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">2. How User Information is Used</h4>
            <p className="leading-relaxed font-light">Your information is used solely to facilitate pharmaceutical order processing, manage prescription verifications by licensed pharmacists, coordinate medical consultations, deliver products via logistics partners, and provide support notifications.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">3. Account and Authentication Information</h4>
            <p className="leading-relaxed font-light">We capture credentials and authentication tokens when you register an account. Passwords are securely hashed and stored to prevent unauthorized access.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">4. Product, Order, and Payment-Related Information</h4>
            <p className="leading-relaxed font-light">We record products in your shopping cart/wishlist and details of completed transactions. Actual payment processing is handled through secure, PCI-compliant third-party gateways. We do not store full credit card numbers or raw payment credentials on our servers.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">5. Cookies and Tracking</h4>
            <p className="leading-relaxed font-light">We utilize cookies and browser local storage to maintain session states (keeping you logged in), cache shopping cart items, and analyze website traffic to optimize performance.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">6. Data Storage and Security</h4>
            <p className="leading-relaxed font-light">All data is securely hosted in Firebase and Firestore with strictly configured security rules. We use secure socket layers (SSL/TLS) for data in transit and follow standard industry precautions to prevent data loss or breach.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">7. Third-Party Services</h4>
            <p className="leading-relaxed font-light">We utilize trusted third-party providers (e.g. Firebase Auth, Firestore Database, and WhatsApp API for consultations). These platforms only receive data necessary to perform their respective platform integrations.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">8. User Rights and Choices</h4>
            <p className="leading-relaxed font-light">You may update your account details directly via your profile page. You also hold the right to request access to or deletion of your personal data by contacting customer support.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">9. Data Retention</h4>
            <p className="leading-relaxed font-light">We retain collected information as long as your account remains active or as required by governing legal, tax, or regulatory pharmaceutical guidelines.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">10. Children's Privacy</h4>
            <p className="leading-relaxed font-light">MediQuick does not intentionally solicit or collect data from individuals under the age of 18. Registration and ordering of medicines are restricted to adults.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">11. Changes to the Privacy Policy</h4>
            <p className="leading-relaxed font-light">We reserve the right to modify this policy at any time. Any changes will be published on this page with an updated effective date.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">12. Contact Information</h4>
            <p className="leading-relaxed font-light">For questions regarding your data privacy, contact us at: <span className="font-semibold">{systemSettings?.supportEmail || "support@mediquick.com"}</span> or call <span className="font-semibold">{systemSettings?.supportPhone || "+1 (555) 019-2834"}</span>.</p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Terms & Conditions"
        size="lg"
      >
        <div className="text-left text-xs text-dark/70 space-y-4 font-sans select-text">
          <p className="font-light text-dark/50 mb-2">Last Updated: August 3, 2026</p>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">1. User Eligibility and Account Responsibilities</h4>
            <p className="leading-relaxed font-light">To register and place orders, you must be at least 18 years of age. You are responsible for keeping your account login details secure and confidential, and you assume full responsibility for all activities that occur under your account.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">2. Acceptable Use of the Website</h4>
            <p className="leading-relaxed font-light">You agree to use this platform only for personal, non-commercial purposes in accordance with local regulations. Any attempt to compromise server security or automate interactions is strictly prohibited.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">3. Product Information and Availability</h4>
            <p className="leading-relaxed font-light">We make every effort to display correct product names, descriptions, images, and availability. However, we do not guarantee that all listed products will be in stock at all times.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">4. Pricing and Payments</h4>
            <p className="leading-relaxed font-light">All prices are presented in local currency and inclusive of applicable taxes unless stated otherwise. Prices are subject to correction or update without prior notice.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">5. Orders and Cancellations</h4>
            <p className="leading-relaxed font-light">We reserve the right to accept, reject, or cancel any order. If an order is cancelled by us after payment, a full refund will be processed to the original payment method.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">6. Delivery</h4>
            <p className="leading-relaxed font-light">Deliveries will be made to the shipping address specified in your order by our third-party logistics partners. Timeline estimates are approximate and subject to logistics delays.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">7. Returns/Refunds</h4>
            <p className="leading-relaxed font-light">Refunds and returns are governed by our Refund Policy. Due to healthcare and drug safety standards, certain prescription medicines cannot be returned once delivered.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">8. Prescription Medicines and Requirements</h4>
            <p className="leading-relaxed font-light">Orders for scheduled prescription medications will not be dispatched without a valid, legible prescription uploaded by the user and approved by our licensed pharmacy panel.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">9. User Reviews/Content</h4>
            <p className="leading-relaxed font-light">If you publish reviews or product feedback, you grant us a non-exclusive, royalty-free license to feature the reviews. Defamatory, inappropriate, or plagiarized content will be removed.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">10. Intellectual Property</h4>
            <p className="leading-relaxed font-light">All text, logos, custom graphics, source code, and assets belong exclusively to MediQuick and are protected under copyright and trademark laws.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">11. Prohibited Activities</h4>
            <p className="leading-relaxed font-light">You are prohibited from reverse engineering the site, distributing spyware/viruses, scraping content, or causing excessive load on our database architecture.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">12. Limitation of Liability</h4>
            <p className="leading-relaxed font-light">MediQuick and its affiliates shall not be liable for any indirect, incidental, or punitive damages arising out of your access to or inability to use this platform.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">13. Disclaimer</h4>
            <p className="leading-relaxed font-light">Information regarding medicines is for informational purposes and does not constitute formal medical advice. Always consult a healthcare professional for diagnosis or treatment.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">14. Changes to Terms</h4>
            <p className="leading-relaxed font-light">We reserve the right to revise these Terms at any time. Continued use of the platform following updates indicates your absolute consent to the new terms.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">15. Account Termination</h4>
            <p className="leading-relaxed font-light">We reserve the right to suspend or terminate user accounts immediately if any fraudulent activity or violation of these terms is detected.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">16. Governing Law</h4>
            <p className="leading-relaxed font-light">These Terms and Conditions are governed by and construed in accordance with local regulations, and any disputes will be resolved under the jurisdiction of local courts.</p>
          </div>

          <div>
            <h4 className="font-bold text-dark text-sm mb-1">17. Contact Information</h4>
            <p className="leading-relaxed font-light">For questions regarding terms of use, please reach out to us at: <span className="font-semibold">{systemSettings?.supportEmail || "support@mediquick.com"}</span> or call <span className="font-semibold">{systemSettings?.supportPhone || "+1 (555) 019-2834"}</span>.</p>
          </div>
        </div>
      </Modal>
    </footer>
  );
}
