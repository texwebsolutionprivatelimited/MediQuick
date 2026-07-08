import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { 
  MdCheckCircle, 
  MdLocalShipping, 
  MdSchedule, 
  MdMyLocation,
  MdChat,
  MdArrowBack
} from 'react-icons/md';

export default function OrderTracking() {
  
  // Simulated milestones
  const steps = [
    { label: "Order Placed", desc: "Received at 04:30 PM", active: true, done: true },
    { label: "Pharmacist Verified", desc: "Rx validated by Dr. Reddy's team", active: true, done: true },
    { label: "Dispatched", desc: "Courier out from Gachibowli hub", active: true, done: false },
    { label: "Delivered", desc: "Estimated delivery in 12 mins", active: false, done: false }
  ];

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-10 font-sans text-dark/90 text-left">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            <MdArrowBack className="text-base" /> Back to Home Page
          </Link>
        </div>

        <div className="space-y-6">
          
          {/* Top details card */}
          <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-primary-dark tracking-wider">Priority Deliveries</span>
              <h2 className="text-lg font-bold text-dark">Order #MQ-82910</h2>
              <p className="text-xs text-dark/50 font-light">ETA: <strong className="font-extrabold text-primary">In 12 minutes</strong> (1-Hour Priority Delivery)</p>
            </div>
            <div className="flex gap-2">
              <a 
                href="https://wa.me/919876543210?text=Hi%20MediQuick%2C%20I%20am%20enquiring%20about%20my%20order%20MQ-82910."
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-emerald-500/20 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
              >
                <MdChat className="text-base" /> WhatsApp Support
              </a>
            </div>
          </div>

          {/* Steps tracking card */}
          <Card hoverable={false} padding="p-6 md:p-8" className="bg-white border border-dark/5 shadow-soft rounded-[28px]">
            <h3 className="font-bold text-sm text-dark uppercase tracking-wider border-b border-dark/5 pb-4 mb-6">Order Status</h3>
            
            <div className="relative pl-6 border-l-2 border-dark/10 space-y-8 select-none">
              {steps.map((step, idx) => (
                <div key={idx} className="relative group text-left">
                  
                  {/* Step point badge indicator */}
                  <div className={`absolute left-[-32px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                    step.done 
                      ? 'border-primary bg-primary text-white scale-110 shadow-sm' 
                      : step.active 
                        ? 'border-primary animate-pulse scale-105' 
                        : 'border-dark/15'
                  }`}>
                    {step.done && <span className="text-[9px]">✔</span>}
                  </div>

                  <div className="space-y-0.5 leading-tight">
                    <h4 className={`text-sm font-bold ${step.active ? 'text-dark' : 'text-dark/40'}`}>
                      {step.label}
                    </h4>
                    <p className="text-xs text-dark/45 font-light">
                      {step.desc}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </Card>

          {/* Delivery location address */}
          <div className="bg-[#E2F3F0]/30 border border-primary/10 p-6 rounded-[24px] shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg shrink-0">
              <MdMyLocation />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Courier Destination</h4>
              <p className="text-xs text-dark/70 font-light leading-relaxed">
                Gachibowli Area, Financial District Road, Hyderabad, Telangana, 500032.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
