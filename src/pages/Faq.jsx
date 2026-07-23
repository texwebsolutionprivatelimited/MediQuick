import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdArrowBack, 
  MdSearch, 
  MdExpandMore,
  MdHelpOutline,
  MdCall,
  MdMailOutline
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

export default function Faq() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState(null);

  const categories = ["All", "Prescription & Ordering", "Shipping & Delivery", "Refund & Quality"];

  const faqData = [
    {
      category: "Prescription & Ordering",
      question: "How do I order prescription medicines?",
      answer: "To order medicines marked with Rx, simply click the 'Upload Prescription' button on the homepage, select your prescription file (JPEG, PNG, or PDF), and submit. A certified pharmacist will review the order, call you to confirm dosage, configure your cart, and send a checkout link."
    },
    {
      category: "Prescription & Ordering",
      question: "Can I buy medicines without a prescription?",
      answer: "Over-the-counter (OTC) medicines, vitamins, wellness products, and lab tests do not require a prescription. You can add them directly to your cart and check out normally."
    },
    {
      category: "Shipping & Delivery",
      question: "How fast is the 1-hour priority delivery?",
      answer: "Our local express dispatch centers operate 24/7. Once your order is confirmed and packaged, a delivery executive is assigned immediately. Under normal weather and traffic conditions, priority delivery takes less than 60 minutes."
    },
    {
      category: "Shipping & Delivery",
      question: "Do you deliver at night?",
      answer: "Yes, MediQuick operates 24/7. You can place orders at any hour of the night, and our dispatch centers will package and deliver them with standard 1-hour priority shipping."
    },
    {
      category: "Refund & Quality",
      question: "What is your refund and return policy?",
      answer: "We offer a 100% money-back guarantee on damaged, expired, or incorrect items. Simply contact our support team at support@mediquick.com or call us within 7 days of delivery with your order ID and pictures of the product."
    },
    {
      category: "Refund & Quality",
      question: "How do you ensure medicine authenticity?",
      answer: "All medicines are sourced directly from NABL-inspected manufacturers and licensed pharma distributors. We store them in climate-controlled warehouses that are regularly inspected by regulatory authorities, completely eliminating risk of counterfeit medicines."
    }
  ];

  // Filter FAQs based on active category and search query
  const filteredFaqs = useMemo(() => {
    return faqData.filter(faq => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/95 text-left">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Home Page
          </Link>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 select-none">
          <div className="space-y-3">
            <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider">
              Help Center & Support
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063B44] leading-tight">
              FAQ & <span className="text-primary">Help Center</span>
            </h1>
            <p className="text-sm text-dark/50 max-w-xl font-light">
              Find quick answers to your questions about prescription verification, priority delivery, refunds, and health products.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <input 
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-dark/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-light focus-ring"
            />
            <MdSearch className="absolute left-3.5 top-3.5 text-dark/45 text-base" />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2.5 mb-10 select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenFaq(null);
              }}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all border ${
                activeCategory === cat 
                  ? "bg-primary text-white border-primary shadow-sm" 
                  : "bg-white text-dark/65 border-dark/10 hover:border-primary/45"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* FAQ Accordions (7 cols on desktop) */}
          <div className="md:col-span-8 space-y-4">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="border border-dark/5 rounded-[20px] overflow-hidden bg-white hover:border-primary/20 shadow-soft hover:shadow-hover transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-extrabold text-sm text-[#063B44] outline-none select-none"
                  >
                    <span>{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-dark/40 text-xl"
                    >
                      <MdExpandMore />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 text-xs sm:text-sm text-dark/65 font-light leading-relaxed border-t border-dark/5 pt-4 bg-[#F8FCFC]/45">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="text-center py-16 bg-white border border-dark/5 rounded-[24px] shadow-soft">
                <p className="text-sm text-dark/50 font-light">No questions found matching your search.</p>
              </div>
            )}
          </div>

          {/* Help & Support Contact Info (4 cols on desktop) */}
          <div className="md:col-span-4 space-y-6 flex flex-col">
            <div className="bg-white border border-dark/5 p-6 rounded-[28px] shadow-soft space-y-6 flex-grow flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[#063B44] flex items-center gap-1.5 border-b border-dark/5 pb-3">
                  <MdHelpOutline className="text-primary text-lg" /> Still need help?
                </h3>
                <p className="text-xs text-dark/50 font-light leading-relaxed">
                  Our customer care and licensed pharmacists are available 24/7 to resolve your issues.
                </p>

                <div className="space-y-4 pt-2">
                  {/* Call card */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base shrink-0">
                      <MdCall />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-extrabold text-dark/45 uppercase tracking-wide">Call Center</h4>
                      <p className="text-xs font-bold text-dark">+1 (555) 019-2834</p>
                    </div>
                  </div>

                  {/* Email card */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base shrink-0">
                      <MdMailOutline />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-extrabold text-dark/45 uppercase tracking-wide">Email Channel</h4>
                      <p className="text-xs font-bold text-dark">support@mediquick.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Whatsapp CTA */}
              <div className="pt-6 border-t border-dark/5">
                <button
                  onClick={() => window.open("https://api.whatsapp.com/send?phone=919876543210&text=Hi, I need assistance with my MediQuick order.", "_blank")}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <FaWhatsapp className="text-base" /> Chat on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
