import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MdArrowBack, 
  MdContentCopy, 
  MdDone, 
  MdPercent,
  MdCreditCard,
  MdAccountBalanceWallet,
  MdCardGiftcard
} from 'react-icons/md';

export default function Offers() {
  const [copiedCode, setCopiedCode] = useState("");

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode("");
    }, 2000);
  };

  const coupons = [
    {
      code: "QUICK20",
      discount: "20% OFF",
      title: "First Order Discount",
      desc: "Get 20% discount on your first order. Minimum order value ₹200.",
      terms: "Valid for new users only. Max discount up to ₹150.",
      badge: "FIRST ORDER"
    },
    {
      code: "MED10",
      discount: "10% OFF",
      title: "Special Medicine Discount",
      desc: "Save 10% on all prescription and OTC medicines.",
      terms: "No minimum order limit. Max discount up to ₹200.",
      badge: "ALL MEDICINES"
    },
    {
      code: "FLAT50",
      discount: "Flat ₹50 OFF",
      title: "Super Saver Deal",
      desc: "Get flat ₹50 cashback/discount on all orders.",
      terms: "Minimum order value ₹499. Applicable once per user.",
      badge: "FLAT DISCOUNT"
    }
  ];

  const bankOffers = [
    {
      bank: "HDFC Bank Credit Cards",
      offer: "10% Instant Discount",
      desc: "Get 10% instant discount up to ₹250 on a minimum transaction of ₹1,500 using HDFC Credit Cards.",
      code: "HDFC10",
      icon: <MdCreditCard className="text-blue-600" />
    },
    {
      bank: "Paytm Wallet",
      offer: "Up to ₹100 Cashback",
      desc: "Pay using Paytm Wallet and get assured cashback between ₹25 and ₹100. Minimum transaction ₹800.",
      code: "PAYTM100",
      icon: <MdAccountBalanceWallet className="text-cyan-500" />
    },
    {
      bank: "ICICI Bank Debit Cards",
      offer: "Flat ₹75 OFF",
      desc: "Get flat ₹75 discount on ordering medical devices or wellness products. Minimum order value ₹1,000.",
      code: "ICICI75",
      icon: <MdCreditCard className="text-orange-600" />
    }
  ];

  // Container variants for stagger animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/95 text-left overflow-hidden">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Home Page
          </Link>
        </div>

        {/* Header */}
        <div className="text-left space-y-3 mb-12">
          <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider">
            Promotions & Coupons
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063B44] leading-tight">
            MediQuick <span className="text-primary">Offers & Deals</span>
          </h1>
          <p className="text-sm text-dark/50 max-w-xl font-light">
            Copy the coupon codes below to apply them during checkout, or check out bank discounts and wallet cashback programs.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Section 1: Active Coupons */}
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#063B44] flex items-center gap-2">
              <MdPercent className="text-primary text-2xl" /> Active Promo Codes
            </h2>
            
            <div className="grid grid-cols-1 min-[576px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coupons.map((coupon, idx) => (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="bg-white border border-dark/5 rounded-[28px] shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-primary/5 text-primary-dark font-extrabold uppercase text-[9px] px-2 py-0.5 rounded-full tracking-wider">
                        {coupon.badge}
                      </span>
                      <span className="text-lg font-black text-secondary">{coupon.discount}</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-[#063B44] text-base">{coupon.title}</h3>
                      <p className="text-xs text-dark/65 font-light leading-relaxed">{coupon.desc}</p>
                    </div>
                  </div>

                  <div className="bg-[#F8FCFC] px-6 py-4 border-t border-dark/5 flex items-center justify-between gap-3">
                    <div className="border border-dashed border-primary/45 rounded-lg px-3 py-1.5 bg-white font-mono font-bold text-sm text-primary tracking-wider uppercase select-all">
                      {coupon.code}
                    </div>
                    
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${
                        copiedCode === coupon.code 
                          ? "bg-secondary text-white" 
                          : "bg-primary hover:bg-primary-dark text-white"
                      }`}
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <MdDone className="text-sm" /> Copied
                        </>
                      ) : (
                        <>
                          <MdContentCopy className="text-xs" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 2: Bank & Wallet Partners */}
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#063B44] flex items-center gap-2">
              <MdCreditCard className="text-primary text-2xl" /> Bank & Wallet Offers
            </h2>

            <div className="grid grid-cols-1 min-[576px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bankOffers.map((offer, idx) => (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="bg-white border border-dark/5 p-6 rounded-[28px] shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6 h-full"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl shadow-inner">
                        {offer.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-dark/50 uppercase tracking-wider">{offer.bank}</h4>
                        <h3 className="font-black text-sm text-[#063B44]">{offer.offer}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-dark/65 font-light leading-relaxed">{offer.desc}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-dark/5 pt-4">
                    <span className="text-[10px] font-bold text-dark/40 uppercase tracking-widest">NO CODE REQUIRED</span>
                    <Link to="/medicines" className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">
                      Shop Now →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 3: Extra Promotions */}
          <motion.div 
            variants={itemVariants} 
            className="relative bg-gradient-to-r from-[#063B44] to-[#0d5966] text-white p-8 sm:p-10 rounded-[32px] overflow-hidden shadow-premium text-left"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-accent tracking-wide">
                <MdCardGiftcard className="text-sm" /> Referral Bonus program
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">Refer Friends & Earn ₹100 Cashback</h3>
              <p className="text-xs text-white/70 font-light leading-relaxed">
                Invite your family and friends to order from MediQuick. They get flat 20% off on their first purchase, and you receive flat ₹100 credits directly in your MediQuick wallet once their order is delivered successfully.
              </p>
              <div className="pt-2">
                <Link to="/profile" className="inline-flex bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase px-6 py-3 rounded-xl shadow-md transition-all">
                  Get Referral Link
                </Link>
              </div>
            </div>
          </motion.div>

        </motion.div>

      </div>
    </div>
  );
}
