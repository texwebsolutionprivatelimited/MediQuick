import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdArrowBack,
  MdWorkOutline,
  MdLocationOn,
  MdAccessTime,
  MdClose,
  MdCheckCircle,
  MdCloudUpload
} from 'react-icons/md';

export default function Careers() {
  const [selectedDept, setSelectedDept] = useState("All");
  const [applyingJob, setApplyingJob] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resume, setResume] = useState(null);

  const departments = ["All", "Technology", "Operations", "Pharmacy", "Sales"];

  const benefits = [
    {
      title: "Growth & Learning",
      desc: "Fast-track your professional path with dynamic hackathons, training, and direct mentorship."
    },
    {
      title: "Comprehensive Benefits",
      desc: "Get market-leading salary rates, active ESOP options, and top-tier family health insurance."
    },
    {
      title: "Balance & Wellness",
      desc: "Enjoy hybrid/remote configurations, regular mental health wellness check-ins, and flexible time-off."
    },
    {
      title: "Direct Health Impact",
      desc: "Be a part of a technology network that directly helps deliver vital medicines to patients under 1 hour."
    }
  ];

  const jobs = [
    {
      id: 1,
      title: "Senior Frontend Engineer (React)",
      dept: "Technology",
      location: "Hyderabad, India (Hybrid)",
      type: "Full-Time",
      desc: "Design and implement premium user interfaces for our patient catalog and dashboard panels.",
      reqs: "4+ years experience with React, TailwindCSS, and performance profiling."
    },
    {
      id: 2,
      title: "Full Stack Node.js Developer",
      dept: "Technology",
      location: "Hyderabad, India (Hybrid)",
      type: "Full-Time",
      desc: "Build highly scalable APIs, order dispatch architectures, and manage database integrations.",
      reqs: "3+ years experience with Node.js, Express, Postgres, and Redis."
    },
    {
      id: 3,
      title: "Logistics Operations Lead",
      dept: "Operations",
      location: "Hyderabad, India (On-Site)",
      type: "Full-Time",
      desc: "Supervise hyper-local dispatch operations, cold-chain monitoring, and partner warehouse metrics.",
      reqs: "Experience managing dispatch networks, fleet coordination, or delivery hubs."
    },
    {
      id: 4,
      title: "Licensed Lead Pharmacist",
      dept: "Pharmacy",
      location: "Secunderabad, India (On-Site)",
      type: "Full-Time",
      desc: "Review uploaded patient prescriptions, coordinate dosage checks, and oversee hygienic packaging protocols.",
      reqs: "Registered B.Pharm/M.Pharm degree with active license certificates."
    },
    {
      id: 5,
      title: "Customer Success Executive",
      dept: "Sales",
      location: "Hyderabad, India (Remote)",
      type: "Full-Time",
      desc: "Assist patients with order placements, prescription queries, and resolve billing issues.",
      reqs: "Excellent communication skills in English and regional languages."
    }
  ];

  const filteredJobs = useMemo(() => {
    if (selectedDept === "All") return jobs;
    return jobs.filter(job => job.dept === selectedDept);
  }, [selectedDept]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !phone) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setApplyingJob(null);
      setName("");
      setEmail("");
      setPhone("");
      setResume(null);
    }, 3000);
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/95 text-left relative">
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
            Join MediQuick Team
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063B44] leading-tight">
            Shape the Future of <span className="text-primary">Health-Tech</span>
          </h1>
          <p className="text-sm text-dark/50 max-w-xl font-light">
            We are hiring builders, pharmacists, and operators who are passionate about bringing accessible, rapid healthcare straight to patients' homes.
          </p>
        </div>

        {/* Why Us section */}
        <div className="space-y-6 mb-16">
          <h2 className="text-xl sm:text-2xl font-black text-[#063B44]">Why Join Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b, idx) => (
              <div 
                key={idx}
                className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-300 space-y-2"
              >
                <h3 className="font-extrabold text-sm text-[#063B44] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> {b.title}
                </h3>
                <p className="text-xs text-dark/60 font-light leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Job Board Section */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <h2 className="text-xl sm:text-2xl font-black text-[#063B44]">Open Positions</h2>
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all border ${
                    selectedDept === dept 
                      ? "bg-primary text-white border-primary shadow-sm" 
                      : "bg-white text-dark/65 border-dark/10 hover:border-primary/45"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Job listings */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div 
                key={job.id}
                className="bg-white border border-dark/5 p-6 sm:p-8 rounded-[28px] shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-3 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2 select-none">
                    <span className="bg-primary/5 text-primary-dark font-extrabold uppercase text-[8px] px-2 py-0.5 rounded-full tracking-wider">
                      {job.dept}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-dark/45 font-medium">
                      <MdLocationOn /> {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-dark/45 font-medium">
                      <MdAccessTime /> {job.type}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#063B44]">{job.title}</h3>
                  <p className="text-xs text-dark/60 font-light leading-relaxed">{job.desc}</p>
                  <p className="text-[11px] text-[#063B44]/75 font-medium bg-[#F8FCFC] px-3 py-2 rounded-xl border border-dark/5">
                    <strong>Requirements:</strong> {job.reqs}
                  </p>
                </div>

                <button
                  onClick={() => setApplyingJob(job)}
                  className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase px-6 py-3 rounded-xl shadow-sm shrink-0 self-start sm:self-center transition-all"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Application Modal Form */}
      <AnimatePresence>
        {applyingJob && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-dark/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md shadow-premium overflow-hidden flex flex-col relative"
            >
              <div className="p-6 border-b border-dark/5 flex items-center justify-between bg-[#F8FCFC]">
                <div>
                  <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[8px] px-2 py-0.5 rounded-full tracking-wider">
                    Application Form
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#063B44] mt-1 line-clamp-1">
                    {applyingJob.title}
                  </h3>
                </div>
                <button
                  onClick={() => setApplyingJob(null)}
                  className="text-dark/55 hover:text-red-500 rounded-full hover:bg-background p-1.5 transition-colors"
                >
                  <MdClose className="text-2xl" />
                </button>
              </div>

              {isSubmitted ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-4xl shadow-inner"
                  >
                    <MdCheckCircle />
                  </motion.div>
                  <h4 className="font-extrabold text-dark text-base">Application Received!</h4>
                  <p className="text-xs text-dark/50 font-light max-w-xs leading-relaxed">
                    Thank you for applying, {name}. Our recruiting team will review your credentials and reach out within 3 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-dark/50 uppercase tracking-wider block">Full Name *</label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-background border border-dark/10 rounded-xl px-4 py-2.5 text-xs font-light focus-ring"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-dark/50 uppercase tracking-wider block">Email Address *</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-dark/10 rounded-xl px-4 py-2.5 text-xs font-light focus-ring"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-dark/50 uppercase tracking-wider block">Phone Number *</label>
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-background border border-dark/10 rounded-xl px-4 py-2.5 text-xs font-light focus-ring"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  {/* Resume Upload Slot */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-dark/50 uppercase tracking-wider block">Resume / CV *</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-dark/10 rounded-2xl p-4 bg-background hover:bg-white hover:border-primary cursor-pointer transition-all select-none">
                      <MdCloudUpload className="text-primary text-2xl mb-1" />
                      <span className="text-[10px] text-dark/60 font-semibold">{resume ? resume.name : "Upload PDF, DOCX (Max 5MB)"}</span>
                      <input 
                        type="file"
                        required
                        className="hidden"
                        accept=".pdf,.docx,.doc"
                        onChange={(e) => setResume(e.target.files[0])}
                      />
                    </label>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase py-3.5 rounded-xl shadow-md transition-all"
                    >
                      Submit Application
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
