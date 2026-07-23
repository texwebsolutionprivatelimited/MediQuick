import fs from 'fs';
import path from 'path';

const medicinesPath = path.resolve('src/data/medicines.json');
const outputDir = path.resolve('public/images/medicines');

// Helper to slugify medicine name
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Wrap text helper for SVG
function wrapText(text, maxChars = 20) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = [];

  words.forEach(word => {
    const tempLine = [...currentLine, word].join(' ');
    if (tempLine.length > maxChars && currentLine.length > 0) {
      lines.push(currentLine.join(' '));
      currentLine = [word];
    } else {
      currentLine.push(word);
    }
  });
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }
  return lines;
}

// Icon path library
const ICONS = {
  tablet: `
    <!-- Blister Pack of 6 Tablets -->
    <g transform="translate(160, 60)">
      <rect x="0" y="0" width="80" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="4" />
      <line x1="40" y1="0" x2="40" y2="60" stroke="currentColor" stroke-width="2" stroke-dasharray="4" />
      <line x1="0" y1="30" x2="80" y2="30" stroke="currentColor" stroke-width="2" stroke-dasharray="4" />
      <!-- Pill 1 -->
      <rect x="10" y="8" width="20" height="14" rx="7" fill="currentColor" opacity="0.9" />
      <!-- Pill 2 -->
      <rect x="50" y="8" width="20" height="14" rx="7" fill="currentColor" opacity="0.9" />
      <!-- Pill 3 -->
      <rect x="10" y="38" width="20" height="14" rx="7" fill="currentColor" opacity="0.9" />
      <!-- Pill 4 -->
      <rect x="50" y="38" width="20" height="14" rx="7" fill="currentColor" opacity="0.9" />
    </g>
  `,
  capsule: `
    <!-- Capsule Pill -->
    <g transform="translate(165, 55)">
      <g transform="rotate(45 35 35)">
        <!-- Cap (top half) -->
        <path d="M 15,10 L 55,10 C 65,10 65,30 55,30 L 15,30" fill="none" stroke="currentColor" stroke-width="5" />
        <path d="M 35,10 L 55,10 C 65,10 65,30 55,30 L 35,30 Z" fill="currentColor" opacity="0.85" />
        <!-- Body (bottom half) -->
        <path d="M 35,10 L -5,10 C -15,10 -15,30 -5,30 L 35,30" fill="none" stroke="currentColor" stroke-width="5" />
        <path d="M 35,10 L -5,10 C -15,10 -15,30 -5,30 L 35,30 Z" fill="none" stroke="currentColor" stroke-dasharray="4 4" stroke-width="2" />
        <!-- Separation line -->
        <line x1="35" y1="10" x2="35" y2="30" stroke="currentColor" stroke-width="5" />
      </g>
    </g>
  `,
  syrup: `
    <!-- Medicine Bottle -->
    <g transform="translate(170, 50)">
      <!-- Neck -->
      <rect x="22" y="5" width="16" height="12" fill="none" stroke="currentColor" stroke-width="4" />
      <!-- Cap -->
      <rect x="18" y="0" width="24" height="6" rx="1" fill="currentColor" />
      <!-- Body -->
      <rect x="5" y="17" width="50" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="4" />
      <!-- Liquid Line inside -->
      <path d="M 7,50 L 53,50 L 53,70 C 53,74 49,75 45,75 L 15,75 C 11,75 7,74 7,70 Z" fill="currentColor" opacity="0.3" />
      <!-- Label -->
      <rect x="11" y="27" width="38" height="20" rx="2" fill="currentColor" opacity="0.9" />
      <!-- Plus on Label -->
      <path d="M 30,32v10M25,37h10" stroke="white" stroke-width="2.5" stroke-linecap="round" />
    </g>
  `,
  spray: `
    <!-- Aerosol Spray Can -->
    <g transform="translate(175, 45)">
      <!-- Can Body -->
      <rect x="10" y="20" width="30" height="65" rx="4" fill="none" stroke="currentColor" stroke-width="4" />
      <!-- Cap base -->
      <path d="M 12,20 C 12,12 38,12 38,20 Z" fill="currentColor" opacity="0.3" />
      <!-- Nozzle -->
      <rect x="22" y="8" width="6" height="12" fill="currentColor" />
      <path d="M 22,8 L 16,10 L 16,13 L 22,11 Z" fill="currentColor" />
      <!-- Spray Mist -->
      <circle cx="5" cy="11" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="-2" cy="7" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="-4" cy="15" r="2.5" fill="currentColor" opacity="0.4" />
    </g>
  `,
  inhaler: `
    <!-- Asthma Inhaler -->
    <g transform="translate(170, 50)">
      <!-- Canister -->
      <rect x="10" y="5" width="20" height="50" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="8" y="0" width="24" height="6" fill="currentColor" />
      <!-- L-Shaped Body -->
      <path d="M 22,12 L 42,12 L 42,50 L 58,58 L 58,72 L 32,72 L 22,50 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
      <circle cx="48" cy="65" r="3" fill="currentColor" />
    </g>
  `,
  device: `
    <!-- Digital Device (Thermometer/BP Monitor) -->
    <g transform="translate(160, 55)">
      <rect x="0" y="0" width="80" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="4" />
      <!-- Screen -->
      <rect x="10" y="10" width="60" height="28" rx="3" fill="currentColor" opacity="0.15" />
      <!-- Pulse Line -->
      <path d="M 15,24 L 28,24 L 33,15 L 38,33 L 43,21 L 46,24 L 65,24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Buttons -->
      <circle cx="25" cy="48" r="4" fill="currentColor" />
      <circle cx="55" cy="48" r="4" fill="currentColor" />
    </g>
  `,
  diagnostic: `
    <!-- Blood Tubes and Pipette -->
    <g transform="translate(165, 50)">
      <!-- Tube 1 (slanting) -->
      <g transform="rotate(-15 15 40)">
        <rect x="10" y="0" width="12" height="60" rx="6" fill="none" stroke="currentColor" stroke-width="4" />
        <rect x="8" y="0" width="16" height="6" fill="currentColor" />
        <!-- Fluid -->
        <rect x="12" y="25" width="8" height="30" rx="3" fill="currentColor" opacity="0.8" />
      </g>
      <!-- Tube 2 (vertical) -->
      <g transform="translate(30, 10)">
        <rect x="10" y="0" width="12" height="60" rx="6" fill="none" stroke="currentColor" stroke-width="4" />
        <rect x="8" y="0" width="16" height="6" fill="currentColor" opacity="0.5" />
        <!-- Fluid -->
        <rect x="12" y="35" width="8" height="20" rx="3" fill="currentColor" opacity="0.4" />
      </g>
    </g>
  `,
  cross: `
    <!-- Medical Cross -->
    <g transform="translate(160, 50)">
      <circle cx="40" cy="40" r="38" fill="none" stroke="currentColor" stroke-width="4" />
      <path d="M 40,20 v 40 M 20,40 h 40" stroke="currentColor" stroke-width="12" stroke-linecap="round" />
    </g>
  `
};

// Gradients by category
const GRADIENTS = {
  "Medicines": { from: "#009688", to: "#004D40", categoryText: "PRESCRIPTION MEDICINE" }, // Teal / Emerald
  "OTC Medicines": { from: "#1E88E5", to: "#0D47A1", categoryText: "GENERAL OTC REMEDY" }, // Blue / Indigo
  "Diabetes Care": { from: "#E53935", to: "#B71C1C", categoryText: "DIABETES CARE" }, // Red / Crimson
  "Heart Care": { from: "#C2185B", to: "#880E4F", categoryText: "CARDIOVASCULAR HEALTH" }, // Rose / Dark Red
  "Personal Care": { from: "#00ACC1", to: "#006064", categoryText: "PERSONAL CARE" }, // Cyan / Dark Teal
  "Baby Care": { from: "#EC407A", to: "#AD1457", categoryText: "BABY CARE PRODUCT" }, // Pink / Deep Rose
  "Ayurveda": { from: "#43A047", to: "#1B5E20", categoryText: "HERBAL AYURVEDA" }, // Green / Dark Green
  "Vitamins": { from: "#FF8F00", to: "#E65100", categoryText: "VITAMINS & SUPPLEMENTS" }, // Orange / Dark Amber
  "Medical Devices": { from: "#546E7A", to: "#263238", categoryText: "MEDICAL DEVICE" }, // Slate / Charcoal
  "Skin Care": { from: "#FF7043", to: "#D84315", categoryText: "DERMATOLOGY SKIN CARE" }, // Coral / Dark Orange
  "Lab Tests": { from: "#5E35B1", to: "#311B92", categoryText: "DIAGNOSTIC LAB TEST" }, // Violet / Royal Purple
  default: { from: "#009688", to: "#004D40", categoryText: "HEALTH & WELLNESS" }
};

// Map product properties to an icon key
function getIconKey(form, category) {
  const f = (form || "").toLowerCase();
  const c = (category || "").toLowerCase();
  
  if (f.includes("tablet") || f.includes("strip") || f.includes("pill")) return "tablet";
  if (f.includes("capsule") || f.includes("softgel")) return "capsule";
  if (f.includes("syrup") || f.includes("liquid") || f.includes("drops") || f.includes("suspension") || f.includes("wash") || f.includes("shampoo") || f.includes("lotion") || f.includes("oil") || f.includes("cleanser") || f.includes("solution")) return "syrup";
  if (f.includes("spray") || f.includes("aerosol")) return "spray";
  if (f.includes("inhaler")) return "inhaler";
  if (f.includes("device") || f.includes("monitor") || f.includes("thermometer") || f.includes("machine") || f.includes("strips") || f.includes("lancets") || c.includes("devices")) return "device";
  if (f.includes("test") || f.includes("profile") || f.includes("screening") || c.includes("tests")) return "diagnostic";
  
  return "cross";
}

// Generate the SVG file content
function generateSVG(product) {
  const name = product.medicine_name;
  const brand = product.brand || "MediQuick";
  const cat = product.category || "Medicines";
  const strength = product.strength || product.pack_size || "Standard Dosage";
  const form = product.form || "Tablet";
  
  const grad = GRADIENTS[cat] || GRADIENTS.default;
  const iconKey = getIconKey(form, cat);
  const iconMarkup = ICONS[iconKey] || ICONS.cross;
  
  // Wrap name into beautiful lines
  const wrappedLines = wrapText(name, 18);
  
  let nameGroupMarkup = "";
  if (wrappedLines.length === 1) {
    nameGroupMarkup = `<text x="200" y="240" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle">${wrappedLines[0]}</text>`;
  } else if (wrappedLines.length === 2) {
    nameGroupMarkup = `
      <text x="200" y="230" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle">${wrappedLines[0]}</text>
      <text x="200" y="258" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle">${wrappedLines[1]}</text>
    `;
  } else {
    nameGroupMarkup = `
      <text x="200" y="220" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">${wrappedLines[0]}</text>
      <text x="200" y="246" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">${wrappedLines[1]}</text>
      <text x="200" y="272" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">${wrappedLines[2]}</text>
    `;
  }
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="100%" height="100%" viewBox="0 0 400 400" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${grad.from}" />
      <stop offset="100%" stop-color="${grad.to}" />
    </linearGradient>
    
    <!-- White Card Shadow -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.12" />
    </filter>
  </defs>

  <!-- Card Base Background -->
  <rect width="400" height="400" rx="32" fill="url(#bg-grad)" />

  <!-- Modern Wave Overlay -->
  <path d="M 0,320 Q 100,280 200,320 T 400,320 L 400,400 L 0,400 Z" fill="#ffffff" fill-opacity="0.04" />
  <path d="M 0,350 Q 100,320 200,350 T 400,350 L 400,400 L 0,400 Z" fill="#ffffff" fill-opacity="0.04" />

  <!-- Circular Glow behind Icon -->
  <circle cx="200" cy="95" r="55" fill="#ffffff" fill-opacity="0.15" />

  <!-- Main White Circle containing Icon -->
  <circle cx="200" cy="90" r="42" fill="#ffffff" filter="url(#shadow)" />
  
  <!-- Icon Wrapper (colors mapped to category gradient) -->
  <g color="${grad.from}">
    ${iconMarkup}
  </g>

  <!-- Brand Label (Header) -->
  <text x="200" y="170" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="900" fill="#ffffff" fill-opacity="0.75" letter-spacing="3" text-anchor="middle">${grad.categoryText}</text>

  <!-- Product Name (wrapped dynamically) -->
  ${nameGroupMarkup}

  <!-- Dosage Strength / Pack Size -->
  <text x="200" y="315" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="600" fill="#ffffff" fill-opacity="0.9" text-anchor="middle">${strength}</text>

  <!-- Manufacturer Line -->
  <text x="200" y="340" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="500" fill="#ffffff" fill-opacity="0.6" text-anchor="middle">${brand}</text>

  <!-- Bottom Badging -->
  <g transform="translate(130, 360)">
    <circle cx="10" cy="10" r="8" fill="#ffffff" fill-opacity="0.2" />
    <path d="M6,10 l3,3 l5,-6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    <text x="24" y="14" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="700" fill="#ffffff" fill-opacity="0.8" letter-spacing="1">MEDIQUICK VERIFIED</text>
  </g>
</svg>
`;
}

// Main execution function
function run() {
  console.log("Generating local SVGs and updating medicines.json...");
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }

  const rawData = fs.readFileSync(medicinesPath, 'utf8');
  const products = JSON.parse(rawData);
  console.log(`Read ${products.length} products from ${medicinesPath}`);
  
  let filesGenerated = 0;
  
  const updatedProducts = products.map(p => {
    const slug = slugify(p.medicine_name);
    const filename = `${p.id}-${slug}.svg`; // Prepend ID to ensure absolute uniqueness
    const fileRelativePath = `/images/medicines/${filename}`;
    const fileAbsolutePath = path.join(outputDir, filename);
    
    // Generate SVG file content
    const svgContent = generateSVG(p);
    
    // Write SVG to disk
    fs.writeFileSync(fileAbsolutePath, svgContent, 'utf8');
    filesGenerated++;
    
    // Return updated product mapping
    return {
      ...p,
      image_url: fileRelativePath
    };
  });
  
  // Write updated products back to medicines.json
  fs.writeFileSync(medicinesPath, JSON.stringify(updatedProducts, null, 2), 'utf8');
  console.log(`Successfully generated ${filesGenerated} SVG files!`);
  console.log(`Updated medicines.json with new image paths.`);
}

run();
