import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

export default function MedicineImage({ product, medicine, className = "w-full h-full object-contain", enableLightbox = false }) {
  const activeProduct = product || medicine;
  const [src, setSrc] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    let url = activeProduct?.image_url || "/images/default-medicine.png";
    if (url && activeProduct?.last_updated && url.startsWith('http')) {
      let time;
      if (typeof activeProduct.last_updated.toDate === 'function') {
        time = activeProduct.last_updated.toDate().getTime();
      } else if (activeProduct.last_updated.seconds) {
        time = activeProduct.last_updated.seconds * 1000;
      } else {
        time = new Date(activeProduct.last_updated).getTime();
      }
      
      if (!isNaN(time)) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}t=${time}`;
      }
    }
    
    setSrc(prev => {
      if (prev === url) {
        return prev;
      }
      setFallbackAttempted(false);
      setLoaded(false);
      return url;
    });
  }, [activeProduct?.id, activeProduct?.image_url, activeProduct?.last_updated]);

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

  // Prevent background scrolling when image viewer is open
  useEffect(() => {
    if (enableLightbox && isViewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [enableLightbox, isViewerOpen]);

  // Press ESC to close image viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsViewerOpen(false);
      }
    };
    if (enableLightbox && isViewerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableLightbox, isViewerOpen]);

  const handleOpenViewer = (e) => {
    if (!enableLightbox) return;
    e.stopPropagation();
    e.preventDefault();
    setIsViewerOpen(true);
  };

  const handleCloseViewer = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsViewerOpen(false);
  };

  function renderViewer(imageUrl) {
    if (!enableLightbox) return null;
    return createPortal(
      <AnimatePresence>
        {isViewerOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-zoom-out bg-black/85 backdrop-blur-[3px]"
              onClick={handleCloseViewer}
            />

            {/* Close (X) button */}
            <button
              onClick={handleCloseViewer}
              className="absolute top-4 right-4 z-[10000] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer focus:outline-none hover:scale-105 active:scale-95"
              aria-label="Close image viewer"
            >
              <MdClose className="text-2xl" />
            </button>

            {/* Centered enlarged image with drag-down-to-dismiss for mobile/touch interaction */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={(event, info) => {
                if (Math.abs(info.offset.y) > 120) {
                  setIsViewerOpen(false);
                }
              }}
              className="relative max-w-[95vw] max-h-[85vh] z-10 flex items-center justify-center p-2 cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageUrl}
                alt={activeProduct?.medicine_name || "Medicine"}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white p-2 select-none pointer-events-none"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  if (!src) {
    // Beautiful medical placeholder backstop with brand colors
    return (
      <>
        <div 
          onClick={enableLightbox ? handleOpenViewer : undefined}
          className={`w-full h-full bg-[#E2F3F0]/20 flex flex-col items-center justify-center rounded-xl p-4 border border-primary/10 select-none ${enableLightbox ? 'cursor-zoom-in hover:bg-[#E2F3F0]/30 transition-colors' : ''}`}
        >
          <svg viewBox="0 0 100 100" fill="none" className="w-12 h-12 text-[#009688] opacity-60 mb-2">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="3" />
            <path d="M50 30v40M30 50h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span className="text-[9px] font-bold text-[#009688]/75 text-center uppercase tracking-wider line-clamp-1 truncate max-w-full px-1">
            {activeProduct?.brand || "MediQuick"}
          </span>
        </div>
        {enableLightbox && renderViewer("/images/default-medicine.png")}
      </>
    );
  }

  return (
    <>
      <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden rounded-xl">
        {/* Skeleton loader overlay */}
        {!loaded && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse rounded-xl" />
        )}
        
        <img
          src={src}
          alt={activeProduct?.medicine_name || "Medicine"}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          onClick={enableLightbox ? handleOpenViewer : undefined}
          className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${enableLightbox ? 'cursor-zoom-in hover:opacity-95' : ''}`}
        />
      </div>
      {enableLightbox && renderViewer(src)}
    </>
  );
}
