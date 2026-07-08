import React, { useState, useEffect } from 'react';
import productsData from '../data/products.json';
import imageMappings from '../data/image_mappings.json';

const CATEGORY_FALLBACKS = {
  "Medicines": "https://images.unsplash.com/photo-584017911766-6477ef9798f1?auto=format&fit=crop&w=400&q=80",
  "Healthcare": "https://images.unsplash.com/photo-584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
  "Diabetes Care": "https://images.unsplash.com/photo-505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80",
  "Heart Care": "https://images.unsplash.com/photo-613243555011-5781fa7dec51?auto=format&fit=crop&w=400&q=80",
  "Personal Care": "https://images.unsplash.com/photo-608248597279-f99d160b2109?auto=format&fit=crop&w=400&q=80",
  "Baby Care": "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=400&q=80",
  "Skin Care": "https://images.unsplash.com/photo-5562290729-de4ee7079b93?auto=format&fit=crop&w=400&q=80",
  "Ayurveda": "https://images.unsplash.com/photo-540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80",
  "Medical Devices": "https://images.unsplash.com/photo-603398938378-e54eab4447b2?auto=format&fit=crop&w=400&q=80",
  "Vitamins": "https://images.unsplash.com/photo-6110784899350-1d84e82fda6e?auto=format&fit=crop&w=400&q=80",
  "Women's Health": "https://images.unsplash.com/photo-512290923902-8a9f81dc236c?auto=format&fit=crop&w=400&q=80",
  "Men's Health": "https://images.unsplash.com/photo-579684389782-64d84b5e901a?auto=format&fit=crop&w=400&q=80",
  "OTC Medicines": "https://images.unsplash.com/photo-584017911766-6477ef9798f1?auto=format&fit=crop&w=400&q=80"
};

export default function MedicineImage({ product, className = "w-full h-full object-contain" }) {
  const baseImgUrl = product?.image_url || "";
  
  // Construct primary ImageKit URLs with responsive size transformations
  const getResponsiveSrcSet = (url) => {
    if (!url || !url.includes("imagekit.io")) return null;
    return `
      ${url}?tr=w-200,q-80,f-webp 200w,
      ${url}?tr=w-300,q-80,f-webp 300w,
      ${url}?tr=w-400,q-80,f-webp 400w,
      ${url}?tr=w-500,q-80,f-webp 500w
    `.trim();
  };

  // State management
  const [src, setSrc] = useState(`${baseImgUrl}?tr=w-400,q-80,f-webp`);
  const [srcSet, setSrcSet] = useState(getResponsiveSrcSet(baseImgUrl));
  const [loaded, setLoaded] = useState(false);
  const [retryState, setRetryState] = useState(0); // 0: primary, 1: retry, 2: registry-exact, 3: same-generic, 4: same-brand, 5: category, 6: SVG

  // Re-sync if product changes
  useEffect(() => {
    setSrc(`${baseImgUrl}?tr=w-400,q-80,f-webp`);
    setSrcSet(getResponsiveSrcSet(baseImgUrl));
    setLoaded(false);
    setRetryState(0);
  }, [baseImgUrl]);

  // Helper to resolve real URLs from mapping registry
  const resolveBackupUrl = (prod) => {
    if (!prod || !prod.image_url) return null;
    const path = prod.image_url.replace("https://ik.imagekit.io/mediquick/", "");
    return imageMappings[path] || null;
  };

  const handleError = () => {
    console.warn(`[MedicineImage] Error loading image for ${product?.medicine_name} from: ${src} (State: ${retryState})`);

    // Priority 1: Primary ImageKit URL -> Retry once
    if (retryState === 0) {
      console.log(`[MedicineImage] Retrying primary load for ${product?.medicine_name}...`);
      setRetryState(1);
      setSrc(`${baseImgUrl}?tr=w-400,q-80,f-webp&retry=1`);
      return;
    }

    // Priority 1.5: Exact Backup mapping resolution
    if (retryState === 1) {
      const exactBackup = resolveBackupUrl(product);
      if (exactBackup) {
        console.log(`[MedicineImage] Exact backup URL found for ${product?.medicine_name}: ${exactBackup}`);
        setRetryState(2);
        setSrc(exactBackup);
        setSrcSet(null); // Clear ImageKit responsive srcSet
      } else {
        triggerSameGenericFallback();
      }
      return;
    }

    // Priority 2: Same medicine / composition match fallback
    if (retryState === 2) {
      triggerSameGenericFallback();
      return;
    }

    // Priority 3: Same brand fallback
    if (retryState === 3) {
      triggerSameBrandFallback();
      return;
    }

    // Priority 4: Category fallback
    if (retryState === 4) {
      triggerCategoryFallback();
      return;
    }

    // Priority 5: Fallback SVG placeholder (absolute backstop)
    console.error(`[MedicineImage] All loading strategies failed for ${product?.medicine_name}. Showing placeholder SVG.`);
    setRetryState(6);
    setLoaded(true);
  };

  const triggerSameGenericFallback = () => {
    const comp = product?.composition;
    if (comp) {
      // Find another product with the same composition/generic formula
      const genericMatch = productsData.find(p => 
        p.id !== product.id && 
        p.composition && 
        p.composition.toLowerCase() === comp.toLowerCase()
      );
      
      const genericBackupUrl = resolveBackupUrl(genericMatch);
      if (genericBackupUrl) {
        console.log(`[MedicineImage] Generic fallback image found via same composition (${comp}) for ${product?.medicine_name}: ${genericBackupUrl}`);
        setRetryState(3);
        setSrc(genericBackupUrl);
        setSrcSet(null);
        return;
      }
    }
    // If not found, skip directly to brand fallback
    triggerSameBrandFallback();
  };

  const triggerSameBrandFallback = () => {
    const brand = product?.brand;
    if (brand) {
      // Find another product from the same manufacturer brand
      const brandMatch = productsData.find(p => 
        p.id !== product.id && 
        p.brand && 
        p.brand.toLowerCase() === brand.toLowerCase()
      );
      
      const brandBackupUrl = resolveBackupUrl(brandMatch);
      if (brandBackupUrl) {
        console.log(`[MedicineImage] Brand fallback image found via manufacturer (${brand}) for ${product?.medicine_name}: ${brandBackupUrl}`);
        setRetryState(4);
        setSrc(brandBackupUrl);
        setSrcSet(null);
        return;
      }
    }
    // If not found, skip directly to category fallback
    triggerCategoryFallback();
  };

  const triggerCategoryFallback = () => {
    const category = product?.category || "Medicines";
    const catFallback = CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS["Medicines"];
    console.log(`[MedicineImage] Category fallback image loaded for category (${category}) on ${product?.medicine_name}: ${catFallback}`);
    setRetryState(5);
    setSrc(catFallback);
    setSrcSet(null);
  };

  if (retryState === 6) {
    // Professional SVG fallback placeholder (Only rendered if all endpoints fail)
    return (
      <div className="w-full h-full bg-[#E2F3F0]/20 flex flex-col items-center justify-center rounded-xl p-4 border border-primary/10 select-none">
        <svg viewBox="0 0 100 100" fill="none" className="w-12 h-12 text-primary opacity-60 mb-2">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="3" />
          <path d="M50 30v40M30 50h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="text-[9px] font-bold text-primary/75 text-center uppercase tracking-wider line-clamp-1 truncate max-w-full px-1">
          {product?.brand || "MediQuick"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden rounded-xl">
      {/* Skeleton loader overlay */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-dark/5 via-dark/10 to-dark/5 animate-pulse rounded-xl" />
      )}
      
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes={srcSet ? "(max-width: 640px) 200px, (max-width: 1024px) 300px, 400px" : undefined}
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
