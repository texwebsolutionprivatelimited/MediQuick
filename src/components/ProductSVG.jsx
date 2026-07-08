import React from 'react';

export default function ProductSVG({ type, className = "w-full h-full" }) {
  switch (type) {
    case 'crocin':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#F0F4F8" />
          <rect x="15" y="25" width="130" height="70" rx="4" fill="#0D47A1" />
          <path d="M15 25 L85 25 L55 95 L15 95 Z" fill="#1E88E5" />
          <circle cx="120" cy="50" r="14" fill="#E53935" opacity="0.9" />
          <rect x="105" y="48" width="30" height="4" fill="#FFFFFF" transform="rotate(45 120 50)" />
          <rect x="118" y="35" width="4" height="30" fill="#FFFFFF" transform="rotate(45 120 50)" />
          <text x="30" y="55" fill="#FFFFFF" fontSize="16" fontWeight="bold" fontFamily="sans-serif">CROCIN</text>
          <text x="30" y="70" fill="#E3F2FD" fontSize="8" letterSpacing="1.5" fontFamily="sans-serif">ADVANCE</text>
          <rect x="30" y="80" width="35" height="5" rx="1" fill="#FFD54F" />
        </svg>
      );
    case 'disprin':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#F0F8F5" />
          <rect x="15" y="25" width="130" height="70" rx="4" fill="#00838F" />
          <path d="M15 25 L75 25 L45 95 L15 95 Z" fill="#00ACC1" />
          <ellipse cx="115" cy="55" rx="16" ry="16" fill="#80DEEA" opacity="0.6" />
          <text x="30" y="55" fill="#FFFFFF" fontSize="16" fontWeight="bold" fontFamily="sans-serif">DISPRIN</text>
          <text x="30" y="70" fill="#E0F7FA" fontSize="8" letterSpacing="1" fontFamily="sans-serif">SOLUBLE ASPIRIN</text>
        </svg>
      );
    case 'dettol':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#FFF8E1" />
          <rect x="73" y="15" width="14" height="15" fill="#B2DFDB" />
          <rect x="68" y="30" width="24" height="12" fill="#E0F2F1" />
          <path d="M50 42 C50 42, 60 42, 70 42 L90 42 C100 42, 110 42, 110 42 L110 105 C110 108, 107 110, 104 110 H56 C53 110, 50 108, 50 105 Z" fill="#EF6C00" />
          <rect x="60" y="55" width="40" height="45" fill="#FFFFFF" rx="2" />
          <circle cx="80" cy="72" r="10" fill="#2E7D32" />
          <rect x="78" y="66" width="4" height="12" fill="#FFFFFF" />
          <rect x="74" y="70" width="12" height="4" fill="#FFFFFF" />
          <text x="68" y="94" fill="#2E7D32" fontSize="5" fontWeight="bold">Dettol</text>
        </svg>
      );
    case 'accuchek':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#ECEFF1" />
          <rect x="25" y="25" width="60" height="80" rx="12" fill="#37474F" />
          <rect x="33" y="33" width="44" height="30" rx="4" fill="#CFD8DC" />
          <text x="38" y="52" fill="#263238" fontSize="12" fontWeight="bold" fontFamily="monospace">104</text>
          <text x="38" y="60" fill="#37474F" fontSize="5" fontFamily="monospace">mg/dL</text>
          <circle cx="55" cy="80" r="8" fill="#1E88E5" />
          <rect x="42" y="77" width="6" height="6" rx="1" fill="#78909C" />
          <rect x="62" y="77" width="6" height="6" rx="1" fill="#78909C" />
          <rect x="95" y="40" width="40" height="65" rx="3" fill="#1565C0" />
          <rect x="95" y="50" width="40" height="10" fill="#FFFFFF" />
          <text x="98" y="58" fill="#1565C0" fontSize="6" fontWeight="bold">ACTIVE</text>
        </svg>
      );
    case 'himalaya':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#F1F8E9" />
          <rect x="68" y="20" width="24" height="10" rx="2" fill="#004D40" />
          <rect x="55" y="30" width="50" height="75" rx="8" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1" />
          <rect x="55" y="45" width="50" height="42" fill="#81C784" />
          <text x="60" y="58" fill="#FFFFFF" fontSize="9" fontWeight="bold">Himalaya</text>
          <text x="68" y="72" fill="#004D40" fontSize="11" fontWeight="bold">Liv.52</text>
          <rect x="55" y="80" width="50" height="3" fill="#FFD54F" />
        </svg>
      );
    case 'protein':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#F3E5F5" />
          <rect x="50" y="20" width="60" height="85" rx="8" fill="#1A237E" />
          <rect x="58" y="12" width="44" height="10" rx="2" fill="#D50000" />
          <rect x="50" y="45" width="60" height="40" fill="#FFFFFF" />
          <text x="56" y="60" fill="#1A237E" fontSize="12" fontWeight="bold">WHEY</text>
          <text x="56" y="74" fill="#D50000" fontSize="10" fontWeight="bold">PROTEIN</text>
        </svg>
      );
    case 'bp':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#E8EAF6" />
          <rect x="25" y="25" width="70" height="70" rx="8" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="2" />
          <rect x="33" y="33" width="54" height="35" rx="3" fill="#CFD8DC" />
          <text x="38" y="48" fill="#212121" fontSize="11" fontWeight="bold">120 / 80</text>
          <text x="38" y="58" fill="#546E7A" fontSize="6">SYS/DIA mmHg</text>
          <circle cx="60" cy="82" r="6" fill="#D50000" />
          <rect x="105" y="35" width="32" height="60" rx="4" fill="#78909C" />
          <line x1="95" y1="82" x2="105" y2="82" stroke="#546E7A" strokeWidth="3" />
        </svg>
      );
    case 'vitamins':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#E3F2FD" />
          <rect x="68" y="20" width="24" height="10" rx="2" fill="#FF6D00" />
          <rect x="58" y="30" width="44" height="75" rx="6" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1" />
          <rect x="58" y="45" width="44" height="38" fill="#FFAB40" />
          <text x="63" y="58" fill="#FFFFFF" fontSize="8" fontWeight="bold">MULTIVIT</text>
          <text x="68" y="70" fill="#3E2723" fontSize="10" fontWeight="bold">A to Z</text>
        </svg>
      );
    case 'baby':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#FCE4EC" />
          <circle cx="80" cy="50" r="18" fill="#F8BBD0" />
          <rect x="65" y="68" width="30" height="38" rx="6" fill="#FFFFFF" stroke="#F48FB1" strokeWidth="1" />
          <path d="M72 82 C72 80, 88 80, 88 82 L88 95 L72 95 Z" fill="#F8BBD0" />
          <text x="73" y="90" fill="#C2185B" fontSize="6" fontWeight="bold">BABY</text>
        </svg>
      );
    case 'personal':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#E0F2F1" />
          <path d="M60 30 C60 30, 80 15, 100 30 L110 100 H50 Z" fill="#FFFFFF" stroke="#004D40" strokeWidth="1" />
          <rect x="62" y="52" width="36" height="28" fill="#80CBC4" />
          <text x="65" y="68" fill="#FFFFFF" fontSize="6" fontWeight="bold">GENTLE CARE</text>
        </svg>
      );
    case 'device':
    default:
      return (
        <svg viewBox="0 0 160 120" fill="none" className={className}>
          <rect width="160" height="120" rx="8" fill="#E6EBEB" />
          <circle cx="80" cy="60" r="16" fill="#009688" opacity="0.2" />
          <path d="M80 50v20M70 60h20" stroke="#009688" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
}
