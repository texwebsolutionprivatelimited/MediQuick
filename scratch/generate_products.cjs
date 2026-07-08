const fs = require('fs');
const path = require('path');

// Ensure output directories exist
fs.mkdirSync(path.join(__dirname, '../src/data'), { recursive: true });

const MANUFACTURERS = [
  "Cipla Ltd", "Sun Pharmaceutical Industries", "Abbott India Ltd", 
  "Dr. Reddy's Laboratories", "Lupin Ltd", "Glenmark Pharmaceuticals", 
  "Cadila Healthcare", "Mankind Pharma", "Torrent Pharmaceuticals", 
  "Himalaya Wellness Company", "Dabur India Ltd", "Patanjali Ayurved"
];

const BRANDS = {
  "Medicines": ["Dolo", "Cipla", "Abbott", "Lupin", "Sun", "Zydus"],
  "Healthcare": ["Volini", "Vicks", "Dettol", "Revital", "Ensures", "Pediasure"],
  "Diabetes Care": ["Accu-Chek", "OneTouch", "Insulatard", "Glycomet", "Diabeta"],
  "Heart Care": ["Lipvas", "Cardivas", "Atorva", "Concor", "Lopresor"],
  "Personal Care": ["Himalaya", "Nivea", "Dove", "L'Oreal", "Parachute", "Santoor"],
  "Baby Care": ["Johnson's", "Himalaya Baby", "Pampers", "MamyPoko", "Sebamed"],
  "Skin Care": ["Cetaphil", "Neutrogena", "Lacto Calamine", "Biotique", "Nivea Skin"],
  "Ayurveda": ["Dabur", "Himalaya Herbals", "Baidyanath", "Zandu", "Patanjali"],
  "Medical Devices": ["Omron", "Dr. Trust", "Accu-Chek", "Rossmax", "Philips"],
  "Vitamins": ["Zincovit", "Becosules", "Limcee", "Evion", "Shelcal", "Calcirol"],
  "Women's Health": ["Sirona", "Whisper", "Stayfree", "Pee Safe", "Mankind Women"],
  "Men's Health": ["Man Matters", "Bold Care", "Beardo", "Mankind Men", "Sun Men"],
  "OTC Medicines": ["Dolo 650", "Paracetamol", "Cetirizine", "Digene", "Crocin", "Volini", "ORS", "Vicks Action 500"]
};

// Main category definitions with list of subcategories
const CATEGORY_MAP = [
  {
    category: "Medicines",
    subcategories: [
      { name: "Tablets", names: ["Paracetamol 650mg", "Amoxicillin 500mg", "Metformin 500mg", "Atorvastatin 10mg", "Azithromycin 500mg", "Pantoprazole 40mg", "Cetirizine 10mg", "Ibuprofen 400mg"], generic: "IP Compound", rx: true, image: "crocin" },
      { name: "Capsules", names: ["Omeprazole 20mg", "Amoxicillin 250mg", "Multivitamin Complex", "Probiotic Daily", "B-Complex Fortified", "Vitamin D3 60K"], generic: "USP Capsule", rx: true, image: "disprin" },
      { name: "Syrups", names: ["Cough Relief Syrup", "Digestive Enzyme Syrup", "Multivitamin Drops", "Iron Tonic Syrup", "Antacid Liquid gel", "Paracetamol Suspension"], generic: "Oral Liquid Suspension", rx: false, image: "dettol" },
      { name: "Injections", names: ["Insulin Glargine", "Ceftriaxone 1g", "Diclofenac Sodium", "Vitamin B12", "Pantoprazole IV"], generic: "Sterile Solution", rx: true, image: "dettol" },
      { name: "Ointments", names: ["Diclofenac Gel", "Clotrimazole Cream", "Betamethasone Cream", "Neomycin First Aid", "Povidone Iodine Cream"], generic: "Topical Ointment Cream", rx: false, image: "dettol" }
    ]
  },
  {
    category: "Healthcare",
    subcategories: [
      { name: "Healthcare Essentials", names: ["Digital Thermometer", "Hand Sanitizer 500ml", "Face Masks N95", "Cotton Roll 100g", "Adhesive Bandages 20s"], generic: "Medical Essential", rx: false, image: "device" },
      { name: "Immunity Boosters", names: ["Chyawanprash Special", "Giloy Tulsi Juice", "Vitamin C Zinc Tablets", "Amla Effervescent", "Ashwagandha Extract"], generic: "Herbal Supplement", rx: false, image: "vitamins" },
      { name: "Pain Relief", names: ["Diclofenac Pain Spray", "Fast Relief Gel", "Hot Water Bag Premium", "Pain Relief Patch", "Orthopedic Knee Support"], generic: "Pain Manager", rx: false, image: "dettol" }
    ]
  },
  {
    category: "Diabetes Care",
    subcategories: [
      { name: "Diabetes Medicines", names: ["Metformin HCL 1000mg", "Glimepiride 2mg", "Sitagliptin 50mg", "Voglibose 0.3mg", "Teneligliptin 20mg"], generic: "Antidiabetic Agent", rx: true, image: "crocin" },
      { name: "Glucometers", names: ["Digital Blood Glucose Monitor", "Wireless Glucometer Kit", "Smart Glucometer Kit"], generic: "Diagnostic Device", rx: false, image: "accuchek" },
      { name: "Test Strips", names: ["Glucose Test Strips 50s", "Glucose Test Strips 25s", "Lancets 100s"], generic: "Glucometer Accessory", rx: false, image: "accuchek" }
    ]
  },
  {
    category: "Heart Care",
    subcategories: [
      { name: "Blood Pressure Medicines", names: ["Telmisartan 40mg", "Amlodipine 5mg", "Metoprolol Succinate 25mg", "Ramipril 5mg", "Losartan Potassium 50mg"], generic: "Antihypertensive IP", rx: true, image: "crocin" },
      { name: "Cholesterol Medicines", names: ["Atorvastatin 20mg", "Rosuvastatin 10mg", "Fenofibrate 160mg", "Atorvastatin 40mg", "Rosuvastatin 20mg"], generic: "Lipid Lowering Agent", rx: true, image: "disprin" }
    ]
  },
  {
    category: "Personal Care",
    subcategories: [
      { name: "Face Wash", names: ["Neem Purifying Face Wash", "Vitamin C Brightening Wash", "Charcoal Deep Clean Wash", "Gentle Hydrating Cleanser"], generic: "Cosmetic Wash", rx: false, image: "personal" },
      { name: "Shampoo", names: ["Anti-Dandruff Shampoo", "Hair Fall Control Shampoo", "Onion Hair Shampoo", "Keratin Smooth Shampoo"], generic: "Hair Cleanser", rx: false, image: "personal" },
      { name: "Soap", names: ["Neem Turmeric Bathing Soap", "Moisturizing Cream Soap", "Sandalwood Fragrant Soap", "Antibacterial Protection Soap"], generic: "Bathing Bar", rx: false, image: "personal" },
      { name: "Body Lotion", names: ["Deep Moisture Cocoa Lotion", "Aloe Vera Cooling Lotion", "Ultra Hydrating Body Milk", "Shea Butter Rich Lotion"], generic: "Cosmetic Lotion", rx: false, image: "personal" },
      { name: "Hair Oil", names: ["Pure Coconut Hair Oil", "Onion Herbal Hair Oil", "Almond Nourishing Oil", "Amla Cool Mint Oil"], generic: "Hair Nourisher", rx: false, image: "personal" }
    ]
  },
  {
    category: "Baby Care",
    subcategories: [
      { name: "Baby Lotion", names: ["Gentle Baby Lotion 200ml", "Nourishing Baby Cream", "Baby Massage Oil Aloe"], generic: "Infant Care Lotion", rx: false, image: "baby" },
      { name: "Baby Soap", names: ["Mild Baby Bathing Bar", "Gentle Baby Wash Liquid", "Tear-Free Baby Bath Cream"], generic: "Mild Infant Bar", rx: false, image: "baby" },
      { name: "Baby Shampoo", names: ["Tear-Free Baby Shampoo", "Gentle Hair Baby Wash"], generic: "Mild Infant Shampoo", rx: false, image: "baby" },
      { name: "Baby Powder", names: ["Gentle Baby Powder 100g", "Cooling Baby Powder 200g"], generic: "Infant Talcum Powder", rx: false, image: "baby" },
      { name: "Diapers", names: ["Baby Diapers Pants Large 50s", "Baby Diapers Pants Medium 60s", "Baby Diapers Pants Small 44s", "Sensitive Baby Wipes 80s"], generic: "Infant Diaper Pants", rx: false, image: "baby" }
    ]
  },
  {
    category: "Skin Care",
    subcategories: [
      { name: "Creams", names: ["Anti-Acne Spot Gel", "Skin Brightening Cream", "Anti-Aging Night Cream", "Under Eye Recovery Gel"], generic: "Cosmetic Cream", rx: false, image: "personal" },
      { name: "Moisturizers", names: ["Ultra-Hydrating Moisturizer", "Oil-Free Face Moisturizer", "Dry Skin Intense Gel Cream"], generic: "Hydrating Moisturizer", rx: false, image: "personal" },
      { name: "Sunscreens", names: ["SPF 50 Matte Sunscreen Gel", "SPF 30 Dry Touch Block", "Broad Spectrum Tinted Sunscreen"], generic: "Sun Protection Gel", rx: false, image: "personal" }
    ]
  },
  {
    category: "Ayurveda",
    subcategories: [
      { name: "Herbal Syrups", names: ["Ayurvedic Cough Syrup", "Purifying Blood Syrup", "Liver Detox Syrup", "Brain Booster Tonic"], generic: "Ayurvedic Liquid Arishta", rx: false, image: "himalaya" },
      { name: "Herbal Tablets", names: ["Neem Tablets 60s", "Tulsi Tablets 60s", "Triphala Tablets 60s", "Spirulina Tablets 100s"], generic: "Ayurvedic Vati Tablet", rx: false, image: "himalaya" },
      { name: "Chyawanprash", names: ["Gold Chyawanprash 1kg", "Sugar-Free Chyawanprash 500g", "Double Immunity Chyawanprash 1kg"], generic: "Ayurvedic Rasayana Paste", rx: false, image: "himalaya" }
    ]
  },
  {
    category: "Medical Devices",
    subcategories: [
      { name: "BP Monitor", names: ["Digital Automatic BP Monitor", "Upper Arm BP Monitor Premium", "Wrist BP Monitor Compact"], generic: "Sphygmomanometer Device", rx: false, image: "bp" },
      { name: "Thermometer", names: ["Digital Thermometer Fast", "Infrared Non-Contact Thermometer", "Flexible Tip Thermometer"], generic: "Temperature Sensor", rx: false, image: "device" },
      { name: "Pulse Oximeter", names: ["Fingertip Pulse Oximeter", "OLED Pulse Oximeter Premium"], generic: "Oxygen Saturation Sensor", rx: false, image: "device" },
      { name: "Nebulizer", names: ["Compressor Nebulizer Machine", "Mesh Nebulizer Portable"], generic: "Inhalation Therapy Device", rx: false, image: "device" },
      { name: "Glucometer", names: ["Glucometer Machine and Strips Pack", "Smart Glucose Monitor Machine"], generic: "Glucose Sensor Device", rx: false, image: "accuchek" },
      { name: "Weighing Scale", names: ["Digital Body Weighing Scale", "Bluetooth Smart Body Fat Analyzer"], generic: "Weighing Machine", rx: false, image: "device" }
    ]
  },
  {
    category: "Vitamins",
    subcategories: [
      { name: "Vitamin A", names: ["Vitamin A 5000 IU Tablets", "Beta Carotene Capsules"], generic: "Retinol IP Capsule", rx: false, image: "vitamins" },
      { name: "Vitamin B Complex", names: ["Vitamin B Complex Fortified", "Cobalamin B12 Capsules", "Folic Acid 5mg Tablets"], generic: "B-Vitamins Fortified", rx: false, image: "vitamins" },
      { name: "Vitamin C", names: ["Vitamin C 500mg Chewable", "Ascorbic Acid Effervescent 1000mg"], generic: "Chewable Ascorbic Acid", rx: false, image: "vitamins" },
      { name: "Vitamin D", names: ["Vitamin D3 60000 IU Softgels", "Cholecalciferol Drops 15ml"], generic: "Cholecalciferol IP Softgel", rx: false, image: "vitamins" },
      { name: "Calcium", names: ["Calcium Carbonate & D3", "Calcium Citrate & Zinc Tablets"], generic: "Calcium Mineral Supplement", rx: false, image: "vitamins" },
      { name: "Zinc", names: ["Zinc Gluconate 50mg Tablets", "Zinc Ascorbate Supplements"], generic: "Zinc Elemental Supplement", rx: false, image: "vitamins" },
      { name: "Iron", names: ["Iron Carbonyl Capsules", "Ferrous Ascorbate & Folic Acid"], generic: "Iron Mineral Supplement", rx: false, image: "vitamins" },
      { name: "Multivitamins", names: ["Daily Multivitamins Men 60s", "Daily Multivitamins Women 60s", "Daily Multivitamins Kids 30s"], generic: "Multivitamin Mineral Supplement", rx: false, image: "vitamins" }
    ]
  },
  {
    category: "Women's Health",
    subcategories: [
      { name: "Women's Wellness Products", names: ["Women Multivitamin Softgels", "Iron & Folic Acid Forte", "Cranberry Extract Urinary Support", "Shatavari Hormone Balance Capsule", "Calcium Calcium D3 Women"], generic: "Women Health Supplement", rx: false, image: "vitamins" }
    ]
  },
  {
    category: "Men's Health",
    subcategories: [
      { name: "Men's Wellness Products", names: ["Men Performance Boosters 60s", "Testosterone Booster Natural", "Prostate Support Capsules", "Multi-Vitamins Active Sports Men", "Hair Regrowth Tonic Minoxidil"], generic: "Men Health Supplement", rx: false, image: "vitamins" }
    ]
  },
  {
    category: "OTC Medicines",
    subcategories: [
      { name: "Paracetamol", names: ["Paracetamol 650mg Tablets", "Paracetamol 500mg Tablets"], generic: "Paracetamol IP 650mg", rx: false, image: "crocin" },
      { name: "Cetirizine", names: ["Cetirizine HCL 10mg", "Cetirizine Syrup 60ml"], generic: "Cetirizine Hydrochloride", rx: false, image: "crocin" },
      { name: "Digene", names: ["Digene Antacid Mint Gel 200ml", "Digene Mixed Fruit Chewable 15s"], generic: "Magnesium Hydroxide Oral Liquid", rx: false, image: "dettol" },
      { name: "ORS", names: ["Electral ORS Powder 21g", "ORS Liquid Apple drink 200ml"], generic: "Oral Rehydration Salts USP", rx: false, image: "dettol" },
      { name: "Crocin", names: ["Crocin Pain Relief Tablets", "Crocin Advance Fast Pain Relief"], generic: "Paracetamol & Caffeine IP", rx: false, image: "crocin" },
      { name: "Dolo 650", names: ["Dolo 650 Fast Action Tablets"], generic: "Paracetamol IP 650mg Active", rx: false, image: "crocin" },
      { name: "Volini", names: ["Volini Pain Relief Spray 55g", "Volini Pain Relief Gel 30g"], generic: "Diclofenac Diethylamine Gel", rx: false, image: "dettol" },
      { name: "Vicks", names: ["Vicks Vaporub Balm 50g", "Vicks Inhaler Keychain", "Vicks Action 500 Extra"], generic: "Menthol Camphor Eucalyptus Balm", rx: false, image: "dettol" }
    ]
  }
];

// Generate products array
const products = [];
let idCounter = 1;

const totalTarget = 600;
const repetitions = Math.ceil(totalTarget / 115); // there are roughly 110 unique subcategory names

for (let r = 0; r < repetitions; r++) {
  CATEGORY_MAP.forEach((catObj) => {
    catObj.subcategories.forEach((subcat) => {
      subcat.names.forEach((baseName, index) => {
        if (products.length >= totalTarget) return;

        const id = `prod-${String(idCounter++).padStart(3, '0')}`;
        
        let variation = "";
        if (r > 0) {
          const variations = ["Forte", "Active", "Ultra", "Daily", "Max", "Premium", "Plus", "Advanced"];
          variation = " " + variations[(r + index) % variations.length];
        }

        const medicine_name = `${baseName}${variation}`;
        const generic_name = `${subcat.generic} Formula`;
        
        const brandList = BRANDS[catObj.category] || ["MediQuick"];
        const brand_name = brandList[(index + r) % brandList.length];
        const manufacturer = MANUFACTURERS[(index + r) % MANUFACTURERS.length];
        
        const description = `${medicine_name} is clinically evaluated by licensed labs to support recovery and promote body wellness. Suitable for daily care under guidance.`;
        const composition = `${subcat.generic} - 80%, Excipients - 20%`;
        const uses = `Helps treat symptoms related to ${subcat.name.toLowerCase()} and overall clinical health maintenance.`;
        
        const mrp = Math.round(40 + Math.random() * 400 + (r * 15));
        const discount_percentage = Math.round(15 + Math.random() * 20); // 15% to 35%
        const price = Math.round(mrp * (1 - discount_percentage / 100));
        const discount_price = mrp - price;
        
        const stock = Math.random() > 0.08 ? Math.round(5 + Math.random() * 150) : 0; // 8% out of stock
        const stockStatus = stock > 0 ? "In Stock" : "Out of Stock";
        
        const prescription_required = subcat.rx;
        const image = subcat.image;
        
        const packSizes = ["Strip of 10 Tablets", "Strip of 15 Tablets", "Bottle of 100ml", "Bottle of 200ml", "Bottle of 60 Capsules", "Pack of 1 Unit", "Box of 50 Strips"];
        const pack_size = packSizes[(index + r) % packSizes.length];

        products.push({
          id,
          medicine_name,
          generic_name,
          brand_name,
          manufacturer,
          description,
          composition,
          uses,
          category: catObj.category,
          subcategory: subcat.name,
          price,
          mrp,
          discount_price,
          discount_percentage,
          stock,
          stockStatus,
          prescription_required,
          image,
          pack_size
        });
      });
    });
  });
}

// Write file
const outputPath = path.join(__dirname, '../src/data/products.json');
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf8');

console.log(`Successfully generated ${products.length} products inside src/data/products.json!`);
