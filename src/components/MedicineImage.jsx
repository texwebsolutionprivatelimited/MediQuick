import React, { useState, useEffect } from 'react';

export default function MedicineImage({ product, className = "w-full h-full object-contain" }) {
  const [src, setSrc] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  useEffect(() => {
    const url = product?.image_url || "/images/default-medicine.png";
    setSrc(prev => {
      if (prev === url) {
        return prev;
      }
      setFallbackAttempted(false);
      setLoaded(false);
      return url;
    });
  }, [product?.id, product?.image_url]);

  const handleError = () => {
    if (!fallbackAttempted) {
      // Try local default fallback first
      setFallbackAttempted(true);
      setSrc("/images/default-medicine.png");
    } else {
      // Clear src to display the CSS-based branded medical placeholder if fallback also fails
      setSrc("");
      setLoaded(true);
    }
  };

  if (!src) {
    // Beautiful medical placeholder backstop with brand colors
    return (
      <div className="w-full h-full bg-[#E2F3F0]/20 flex flex-col items-center justify-center rounded-xl p-4 border border-primary/10 select-none">
        <svg viewBox="0 0 100 100" fill="none" className="w-12 h-12 text-[#009688] opacity-60 mb-2">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="3" />
          <path d="M50 30v40M30 50h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="text-[9px] font-bold text-[#009688]/75 text-center uppercase tracking-wider line-clamp-1 truncate max-w-full px-1">
          {product?.brand || "MediQuick"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden rounded-xl">
      {/* Skeleton loader overlay */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse rounded-xl" />
      )}
      
      <img
        src={src}
        alt={product?.medicine_name || "Medicine"}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
