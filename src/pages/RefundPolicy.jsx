import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MdArrowBack,
  MdCheckCircle,
  MdCancel,
  MdReplay,
  MdAccountBalance,
  MdRoom,
  MdEmail,
  MdCall
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

export default function RefundPolicy() {
  
  const pillars = [
    {
      title: "7-Day Window",
      desc: "Raise return requests within 7 days of order delivery.",
      icon: <MdReplay className="text-secondary" />
    },
    {
      title: "100% Refund",
      desc: "Get full value back on damaged, expired, or incorrect products.",
      icon: <MdCheckCircle className="text-primary" />
    },
    {
      title: "Free Pickup",
      desc: "We schedule return pickup from your doorstep at zero cost.",
      icon: <MdRoom className="text-[#063B44]" />
    },
    {
      title: "Direct Bank Credit",
      desc: "Refunds reflect back in source account within 3-5 business days.",
      icon: <MdAccountBalance className="text-accent-dark" />
    }
  ];

  const eligibleItems = [
    "Products delivered past their expiration date.",
    "Items structurally damaged during transit (e.g. broken seals, leaked bottles).",
    "Incorrect medicine formulation, dosage, or quantity mismatch against order.",
    "Missing items in the delivered package."
  ];

  const nonEligibleItems = [
    "Healthcare/wellness supplements with broken safety seals or opened bottles.",
    "Self-damaged products due to improper storage (e.g. cold-chain drugs kept at room temp).",
    "Medical devices where the manufacturer's warranty seal has been broken.",
    "Requests raised after 7 days from the timestamp of delivery."
  ];

  const steps = [
    {
      title: "Raise Request",
      desc: "Send an email to support@mediquick.com or start a live support ticket on WhatsApp within 7 days."
    },
    {
      title: "Verification Check",
      desc: "Our support agents review the purchase invoice and product images showing damages or discrepancies."
    },
    {
      title: "Free Doorstep Pickup",
      desc: "A delivery agent is dispatched to collect the verified items in original packaging with tags."
    },
    {
      title: "Refund Credit",
      desc: "Once received at our warehouse, the refund is initiated and reflects in your original payment mode within 3-5 days."
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
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Home Page
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-left space-y-3 mb-12 select-none">
          <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider">
            Consumer Protection
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063B44] leading-tight">
            Refund & <span className="text-primary">Cancellation Policy</span>
          </h1>
          <p className="text-sm text-dark/50 max-w-xl font-light">
            We ensure complete transparency in our packaging and sourcing. Here is a clear guide to returns, exchange, and direct bank refund credits.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Core Pillars Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pillars.map((pillar, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F8FCFC] flex items-center justify-center text-2xl shadow-inner">
                  {pillar.icon}
                </div>
                <h3 className="font-extrabold text-sm text-[#063B44]">{pillar.title}</h3>
                <p className="text-[10px] text-dark/50 font-light leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Guidelines Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Eligible items */}
            <div className="bg-white border border-dark/5 p-8 rounded-[28px] shadow-soft space-y-4">
              <h3 className="font-extrabold text-sm text-[#063B44] uppercase tracking-wider flex items-center gap-1.5 border-b border-dark/5 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Eligible for Refund
              </h3>
              <ul className="space-y-3 text-xs text-dark/70 font-light leading-relaxed">
                {eligibleItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <MdCheckCircle className="text-secondary text-base shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Non Eligible items */}
            <div className="bg-white border border-dark/5 p-8 rounded-[28px] shadow-soft space-y-4">
              <h3 className="font-extrabold text-sm text-[#063B44] uppercase tracking-wider flex items-center gap-1.5 border-b border-dark/5 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Non-Returnable Items
              </h3>
              <ul className="space-y-3 text-xs text-dark/70 font-light leading-relaxed">
                {nonEligibleItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <MdCancel className="text-red-500 text-base shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Workflow Section */}
          <motion.div variants={itemVariants} className="space-y-10">
            <div className="text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063B44]">Refund Processing Steps</h2>
              <p className="text-sm text-dark/50 font-light">Simple and fully automated refund processing timeline.</p>
            </div>

            <div className="relative pl-6 border-l border-primary/20 space-y-8 ml-3 text-left">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#F8FCFC] border-2 border-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">Step 0{idx + 1}</span>
                    <h4 className="font-extrabold text-sm text-[#063B44]">{step.title}</h4>
                    <p className="text-xs text-dark/60 max-w-2xl font-light leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact Support CTA */}
          <motion.div 
            variants={itemVariants} 
            className="relative bg-gradient-to-r from-[#063B44] to-[#0d5966] text-white p-8 sm:p-10 rounded-[32px] overflow-hidden shadow-premium text-left flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            
            <div className="max-w-md space-y-3 relative z-10">
              <h3 className="text-2xl font-extrabold leading-tight">Need a refund processed?</h3>
              <p className="text-xs text-white/70 font-light leading-relaxed">
                Connect directly with our billing support on WhatsApp or phone to coordinate swift doorstep pick up.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-white/80 pt-1">
                <span className="flex items-center gap-1.5"><MdCall className="text-primary text-base" /> +1 (555) 019-2834</span>
                <span className="flex items-center gap-1.5"><MdEmail className="text-primary text-base" /> billing@mediquick.com</span>
              </div>
            </div>

            <div className="relative z-10 shrink-0 w-full md:w-auto">
              <button
                onClick={() => window.open("https://api.whatsapp.com/send?phone=919876543210&text=Hi, I want to request a return/refund for my order.", "_blank")}
                className="w-full md:w-auto bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <FaWhatsapp className="text-base" /> Chat on WhatsApp
              </button>
            </div>
          </motion.div>

        </motion.div>

      </div>
    </div>
  );
}
