import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MdArrowBack,
  MdLocalPharmacy,
  MdVerified,
  MdOutlineAccessTime,
  MdShield,
  MdSupportAgent,
  MdCloudUpload,
  MdCheckCircle,
  MdLocalShipping
} from 'react-icons/md';

export default function About() {
  // Motion variations for smooth entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const stats = [
    { value: "< 1 Hour", label: "Delivery Promise", icon: <MdOutlineAccessTime className="text-secondary" /> },
    { value: "100%", label: "Genuine Medicines", icon: <MdVerified className="text-primary" /> },
    { value: "24/7", label: "Pharmacist Support", icon: <MdSupportAgent className="text-accent-dark" /> }
  ];

  const features = [
    {
      title: "Direct Sourcing Protocols",
      description: "Every medicine and device on MediQuick is sourced directly from certified pharmaceutical companies and licensed retail distributors. We eliminate middlemen to eliminate counterfeits.",
      icon: <MdLocalPharmacy />
    },
    {
      title: "Sealed & Hygienic Packaging",
      description: "Orders are packed in specialized temperature-controlled, tamper-evident, sealed bags to maintain chemical stability and hygiene, especially for cold-chain medications.",
      icon: <MdShield />
    },
    {
      title: "Smart Prescription Parsing",
      description: "Our digital systems let you upload prescriptions instantly. A certified, licensed pharmacist manually reviews, calls to verify, and dispenses exactly what you need.",
      icon: <MdCloudUpload />
    }
  ];

  const steps = [
    {
      title: "Browse & Select or Upload Rx",
      description: "Search for OTC items or upload a prescription for Rx-only medications directly to our platform."
    },
    {
      title: "Pharmacist Validation",
      description: "Our in-house certified pharmacists verify your prescription, dosage, and substitute recommendations if required."
    },
    {
      title: "Hygienic Compounding & Packaging",
      description: "Your order is sanitarily prepared, packed in tamper-proof bags, and double-checked for accuracy."
    },
    {
      title: "Express Doorstep Delivery",
      description: "A delivery executive is dispatched immediately, completing contact-free delivery in under an hour."
    }
  ];

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/90 text-left overflow-hidden">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Home Page
          </Link>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header & Hero Section */}
          <motion.div variants={itemVariants} className="text-left space-y-4 max-w-3xl">
            <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider">
              Empowering Healthcare
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#063B44] leading-tight">
              A Healthier You, <br />
              <span className="text-gradient">Delivered in Minutes.</span>
            </h1>
            <p className="text-base text-dark/60 font-light leading-relaxed">
              At MediQuick, we are redefining modern retail pharmacy. By combining technology, licensed pharmacists, and a rapid delivery network, we bring genuine medicine, healthcare devices, and expert care directly to your doorstep in under 1 hour.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F8FCFC] flex items-center justify-center text-2xl shadow-inner">
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-black text-[#063B44]">{stat.value}</h3>
                <p className="text-xs text-dark/40 font-medium tracking-wide">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Core Pillars Section */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063B44]">Why Millions Trust MediQuick</h2>
              <p className="text-sm text-dark/50 font-light">We stand on the foundation of authenticity, reliability, and speed.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-dark/5 p-8 rounded-[28px] shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col justify-between space-y-6"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                    {feature.icon}
                  </div>
                  <div className="space-y-2 flex-grow text-left">
                    <h4 className="font-extrabold text-base text-[#063B44]">{feature.title}</h4>
                    <p className="text-xs text-dark/60 font-light leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Timeline / How It Works */}
          <motion.div variants={itemVariants} className="space-y-10">
            <div className="text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063B44]">How It Works</h2>
              <p className="text-sm text-dark/50 font-light">Simple, secure, and fully verified dispatch workflow.</p>
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
                    <p className="text-xs text-dark/60 max-w-2xl font-light leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quality Commitment Banner */}
          <motion.div 
            variants={itemVariants} 
            className="relative bg-gradient-to-r from-[#063B44] to-[#0d5966] text-white p-8 sm:p-10 rounded-[32px] overflow-hidden shadow-premium text-left"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-accent tracking-wide">
                <MdShield className="text-sm" /> 100% Quality & Safety Guarantee
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">Licensed & Inspected Warehouses</h3>
              <p className="text-xs text-white/70 font-light leading-relaxed">
                All medications are stored in state-of-the-art warehouses featuring computerized climate control and continuous monitoring. We strictly follow the guidelines of pharmacy regulators to ensure you receive drugs in optimal biological condition.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <MdCheckCircle className="text-secondary text-sm" /> Temperature Controlled Storage
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <MdCheckCircle className="text-secondary text-sm" /> Pharmacist Supervised
                </span>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

