import json
import urllib.request
import os
import re

print("Starting ImageKit database builder v4...")

# Key specific product matches requested by user
SPECIFIC_BRANDS = [
  {
    "medicine_name": "Dolo 650",
    "brand": "Micro Labs",
    "strength": "650mg",
    "form": "Tablet",
    "category": "OTC Medicines",
    "subcategory": "Dolo 650",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/c773bc28-3c46-444a-b50a-f0f81395fa3d.jpeg",
    "price": 30, "mrp": 34, "stock": 120, "prescription_required": False,
    "description": "Dolo 650 Tablets contain Paracetamol, which helps provide fast relief from pain and reduces fever.",
    "generic_name": "Paracetamol (650mg)", "manufacturer": "Micro Labs Ltd",
    "composition": "Paracetamol IP - 650mg", "uses": "Treatment of Fever and Pain relief.",
    "discount_percentage": 11, "pack_size": "Strip of 15 Tablets"
  },
  {
    "medicine_name": "Crocin Advance",
    "brand": "GlaxoSmithKline",
    "strength": "500mg",
    "form": "Tablet",
    "category": "OTC Medicines",
    "subcategory": "Crocin",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/y0jmjvvh86ch0ivpgg4o.jpg",
    "price": 25, "mrp": 30, "stock": 140, "prescription_required": False,
    "description": "Crocin Advance is a fast-acting paracetamol formula for swift relief of headaches and body pain.",
    "generic_name": "Paracetamol Fast Release", "manufacturer": "GlaxoSmithKline Consumer Healthcare",
    "composition": "Paracetamol IP - 500mg Optizorb", "uses": "Relief from headache, toothache, and fever.",
    "discount_percentage": 16, "pack_size": "Strip of 15 Tablets"
  },
  {
    "medicine_name": "Calpol 650",
    "brand": "GlaxoSmithKline",
    "strength": "650mg",
    "form": "Tablet",
    "category": "OTC Medicines",
    "subcategory": "Paracetamol",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/c773bc28-3c46-444a-b50a-f0f81395fa3d.jpeg",
    "price": 24, "mrp": 28, "stock": 190, "prescription_required": False,
    "description": "Calpol 650 Tablets contain paracetamol to relieve pain and bring down high temperature.",
    "generic_name": "Paracetamol IP", "manufacturer": "GlaxoSmithKline India",
    "composition": "Paracetamol IP - 650mg", "uses": "Reducing fever and relief of body aches.",
    "discount_percentage": 14, "pack_size": "Strip of 15 Tablets"
  },
  {
    "medicine_name": "Augmentin 625 Duo",
    "brand": "GlaxoSmithKline",
    "strength": "625mg",
    "form": "Tablet",
    "category": "Medicines",
    "subcategory": "Tablets",
    "real_url": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/wy2y9bdipmh6rgkrj0zm.jpg",
    "price": 200, "mrp": 223, "stock": 110, "prescription_required": True,
    "description": "Augmentin 625 Duo Tablet is an antibiotic that helps your body fight infections caused by bacteria.",
    "generic_name": "Amoxycillin (500mg) + Clavulanic Acid (125mg)", "manufacturer": "GlaxoSmithKline India",
    "composition": "Amoxycillin (500mg) + Clavulanic Acid (125mg)", "uses": "Treatment of Bacterial infections.",
    "discount_percentage": 10, "pack_size": "Strip of 10 Tablets"
  },
  {
    "medicine_name": "Digene Gel",
    "brand": "Abbott",
    "strength": "200ml",
    "form": "Syrup",
    "category": "OTC Medicines",
    "subcategory": "Digene",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u0yjtcv5c7p7s8w2b3yd.jpg",
    "price": 130, "mrp": 150, "stock": 85, "prescription_required": False,
    "description": "Digene Mint Liquid gel provides quick relief from acidity, gas, heartburn, and stomach discomfort.",
    "generic_name": "Magnesium Hydroxide Oral Gel", "manufacturer": "Abbott India Ltd",
    "composition": "Magnesium Hydroxide, Aluminium Hydroxide, Simethicone", "uses": "Relief from acidity, flatulence, and bloating.",
    "discount_percentage": 13, "pack_size": "Bottle of 200ml"
  },
  {
    "medicine_name": "Volini Spray",
    "brand": "Sun Pharma",
    "strength": "55g",
    "form": "Spray",
    "category": "OTC Medicines",
    "subcategory": "Volini",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u6eov69dptd33kpejld6.jpg",
    "price": 180, "mrp": 210, "stock": 90, "prescription_required": False,
    "description": "Volini Spray is a quick-action pain relief spray that penetrates deep to relieve back pain, joint pain, and sprains.",
    "generic_name": "Diclofenac Aerosol Spray", "manufacturer": "Sun Pharmaceutical Industries",
    "composition": "Diclofenac Diethylamine, Methyl Salicylate, Menthol", "uses": "Relief from muscular pain, backache, and sprains.",
    "discount_percentage": 14, "pack_size": "Can of 55g"
  },
  {
    "medicine_name": "Vicks Vaporub",
    "brand": "Procter & Gamble",
    "strength": "50g",
    "form": "Balm",
    "category": "OTC Medicines",
    "subcategory": "Vicks",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/b6v4bcygsc5qj47fey9d.jpg",
    "price": 145, "mrp": 165, "stock": 110, "prescription_required": False,
    "description": "Vicks VapoRub uses cold-relief vapor formulations to clear blocked nose, relieve cough, and ease body ache.",
    "generic_name": "Menthol Camphor Balm", "manufacturer": "Procter & Gamble Hygiene",
    "composition": "Menthol, Camphor, Eucalyptus Oil", "uses": "Relief from nasal congestion and cold cough symptoms.",
    "discount_percentage": 12, "pack_size": "Jar of 50g"
  },
  {
    "medicine_name": "Electral ORS",
    "brand": "FDC",
    "strength": "21.8g",
    "form": "Powder",
    "category": "OTC Medicines",
    "subcategory": "ORS",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u9s8qjc56qj45h7fd9yd.jpg",
    "price": 20, "mrp": 22, "stock": 250, "prescription_required": False,
    "description": "Electral is a WHO-based oral rehydration salts formula to restore body electrolytes lost due to dehydration.",
    "generic_name": "Oral Rehydration Salts IP", "manufacturer": "FDC Limited",
    "composition": "Sodium Chloride, Potassium Chloride, Sodium Citrate, Dextrose Anhydrous", "uses": "Fluid and electrolyte restoration in dehydration.",
    "discount_percentage": 9, "pack_size": "Sachet of 21.8g"
  },
  {
    "medicine_name": "Accu-Chek Glucometer",
    "brand": "Roche",
    "strength": "Active Monitor",
    "form": "Device",
    "category": "Medical Devices",
    "subcategory": "Glucometer",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u8dcfvyv86ch0ivpgg4o.jpg",
    "price": 999, "mrp": 1299, "stock": 45, "prescription_required": False,
    "description": "Accu-Chek Active Blood Glucose Monitor provides highly accurate sugar level readings in just 5 seconds.",
    "generic_name": "Blood Glucose Monitor", "manufacturer": "Roche Diabetes Care",
    "composition": "Digital Glucometer Machine Kit", "uses": "Self-monitoring of blood glucose levels.",
    "discount_percentage": 23, "pack_size": "Pack of 1 Unit"
  },
  {
    "medicine_name": "Omron BP Monitor",
    "brand": "Omron",
    "strength": "HEM-7120",
    "form": "Device",
    "category": "Medical Devices",
    "subcategory": "BP Monitor",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/b6vcygsc5qj47fey9d3d.jpg",
    "price": 1850, "mrp": 2300, "stock": 35, "prescription_required": False,
    "description": "Omron HEM-7120 is a fully automatic blood pressure monitor operating on the oscillometric principle for precise readings.",
    "generic_name": "Digital Sphygmomanometer", "manufacturer": "Omron Healthcare",
    "composition": "Digital BP Monitor with Arm Cuff", "uses": "Monitoring blood pressure and pulse rate.",
    "discount_percentage": 19, "pack_size": "Pack of 1 Unit"
  },
  {
    "medicine_name": "Benadryl Syrup",
    "brand": "Kenvue",
    "strength": "100ml",
    "form": "Syrup",
    "category": "OTC Medicines",
    "subcategory": "Benadryl",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/hndjkvvy86ch0ivpgg4o.jpg",
    "price": 115, "mrp": 130, "stock": 95, "prescription_required": False,
    "description": "Benadryl Syrup provides fast-acting relief from wet cough, throat irritation, and common allergy symptoms.",
    "generic_name": "Diphenhydramine Oral Liquid", "manufacturer": "Kenvue Consumer Health",
    "composition": "Diphenhydramine Hydrochloride, Ammonium Chloride, Sodium Citrate", "uses": "Relief from cough and throat tickling.",
    "discount_percentage": 11, "pack_size": "Bottle of 100ml"
  },
  {
    "medicine_name": "Paracetamol 650mg",
    "brand": "Cipla",
    "strength": "650mg",
    "form": "Tablet",
    "category": "OTC Medicines",
    "subcategory": "Paracetamol",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/c773bc28-3c46-444a-b50a-f0f81395fa3d.jpeg",
    "price": 20, "mrp": 24, "stock": 200, "prescription_required": False,
    "description": "Standard Paracetamol tablets for reducing body temperature and relieving mild muscle aches.",
    "generic_name": "Paracetamol IP", "manufacturer": "Cipla Ltd",
    "composition": "Paracetamol IP - 650mg", "uses": "Fever reduction and basic analgesic relief.",
    "discount_percentage": 16, "pack_size": "Strip of 10 Tablets"
  },
  {
    "medicine_name": "Cetirizine 10mg",
    "brand": "Alkem",
    "strength": "10mg",
    "form": "Tablet",
    "category": "OTC Medicines",
    "subcategory": "Cetirizine",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/c773bc28-3c46-444a-b50a-f0f81395fa3d.jpg",
    "price": 18, "mrp": 22, "stock": 180, "prescription_required": False,
    "description": "Cetirizine is an antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, and sneezing.",
    "generic_name": "Cetirizine Hydrochloride", "manufacturer": "Alkem Laboratories",
    "composition": "Cetirizine HCL - 10mg", "uses": "Relief from allergic rhinitis and skin hives.",
    "discount_percentage": 18, "pack_size": "Strip of 10 Tablets"
  },
  {
    "medicine_name": "Revital H",
    "brand": "Sun Pharma",
    "strength": "Daily",
    "form": "Capsule",
    "category": "Vitamins",
    "subcategory": "Multivitamins",
    "real_url": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/xkg1pweump6uhajxdn7y.jpg",
    "price": 280, "mrp": 330, "stock": 80, "prescription_required": False,
    "description": "Revital H contains Ginseng, Vitamins, and Minerals that help boost active energy and improve focus.",
    "generic_name": "Ginseng Multivitamin Complex", "manufacturer": "Sun Pharmaceutical Industries",
    "composition": "Ginseng, 10 Vitamins, 9 Minerals", "uses": "Overall vitality, stress management and stamina booster.",
    "discount_percentage": 15, "pack_size": "Bottle of 30 Capsules"
  },
  {
    "medicine_name": "Zincovit",
    "brand": "Apex Labs",
    "strength": "Nutritional",
    "form": "Tablet",
    "category": "Vitamins",
    "subcategory": "Multivitamins",
    "real_url": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/fa7427131ec64163b5bbafb529df0736.jpg",
    "price": 105, "mrp": 120, "stock": 150, "prescription_required": False,
    "description": "Zincovit Tablet is a multivitamin and multimineral supplement containing essential nutrients to support immune health.",
    "generic_name": "Multivitamins with Zinc", "manufacturer": "Apex Laboratories Pvt Ltd",
    "composition": "Vitamins A, B-Complex, C, D3, E, Zinc, Selenium", "uses": "Immunity support and nutritional supplementation.",
    "discount_percentage": 12, "pack_size": "Strip of 15 Tablets"
  },
  {
    "medicine_name": "Ascoril Syrup",
    "brand": "Glenmark",
    "strength": "100ml",
    "form": "Syrup",
    "category": "Medicines",
    "subcategory": "Syrups",
    "real_url": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/3205599cc49d4073ae66cbb0dbfded86.jpg",
    "price": 118, "mrp": 130, "stock": 90, "prescription_required": True,
    "description": "Ascoril LS Syrup is a combination medicine used in the treatment of cough with mucus.",
    "generic_name": "Ambroxol + Levosalbutamol + Guaifenesin", "manufacturer": "Glenmark Pharmaceuticals",
    "composition": "Ambroxol (30mg) + Levosalbutamol (1mg) + Guaifenesin (50mg)", "uses": "Treatment of wet cough.",
    "discount_percentage": 9, "pack_size": "Bottle of 100ml"
  },
  {
    "medicine_name": "Soframycin",
    "brand": "Sanofi",
    "strength": "30g",
    "form": "Cream",
    "category": "OTC Medicines",
    "subcategory": "Ointments",
    "real_url": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cropped/gnsem6ircqxmwmjkprkw.jpg",
    "price": 52, "mrp": 60, "stock": 140, "prescription_required": False,
    "description": "Soframycin Skin Cream is a local antibiotic cream used for treating bacterial infections on cut skin.",
    "generic_name": "Framycetin Skin Cream", "manufacturer": "Sanofi India Ltd",
    "composition": "Framycetin Sulphate IP 1%", "uses": "Treatment of minor cuts, wounds, burns, and skin infections.",
    "discount_percentage": 13, "pack_size": "Tube of 30g"
  },
  {
    "medicine_name": "Boroline",
    "brand": "GD Pharmaceuticals",
    "strength": "20g",
    "form": "Cream",
    "category": "OTC Medicines",
    "subcategory": "Ointments",
    "real_url": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/612a8de029ee416ab320d109d19d2293.jpg",
    "price": 40, "mrp": 45, "stock": 200, "prescription_required": False,
    "description": "Boroline is an antiseptic Ayurvedic skin ointment used to heal cuts, dry skin, and chapped lips.",
    "generic_name": "Boric Acid Zinc Oxide Cream", "manufacturer": "GD Pharmaceuticals Pvt Ltd",
    "composition": "Boric Acid, Zinc Oxide, Anhydrous Lanolin", "uses": "Skin repair, antiseptic protection, and moisturizing.",
    "discount_percentage": 11, "pack_size": "Tube of 20g"
  }
]

SUPPLEMENTS = [
  {"name": "Baby Shampoo Extra Mild", "category": "Baby Care", "subcategory": "Baby Shampoo", "real_url": "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=400&q=80", "price": 190, "mrp": 230, "stock": 70, "prescription_required": False, "description": "Tear-free extra mild shampoo for baby's soft scalp.", "form": "Shampoo", "strength": "200ml"},
  {"name": "Baby Soft Bathing Soap", "category": "Baby Care", "subcategory": "Baby Soap", "real_url": "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=400&q=80", "price": 75, "mrp": 90, "stock": 85, "prescription_required": False, "description": "Pure moisturizing baby soap bar for sensitive baby skin.", "form": "Soap", "strength": "75g"},
  {"name": "Baby Nourishing Body Lotion", "category": "Baby Care", "subcategory": "Baby Lotion", "real_url": "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=400&q=80", "price": 220, "mrp": 260, "stock": 90, "prescription_required": False, "description": "Gentle baby lotion with aloe and milk cream.", "form": "Cream", "strength": "150ml"},
  {"name": "Baby Gentle Talcum Powder", "category": "Baby Care", "subcategory": "Baby Powder", "real_url": "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=400&q=80", "price": 110, "mrp": 130, "stock": 100, "prescription_required": False, "description": "Absorbent gentle talc keeps baby dry and fresh.", "form": "Powder", "strength": "100g"},
  {"name": "Sensitive Baby Diaper Wipes", "category": "Baby Care", "subcategory": "Baby Wipes", "real_url": "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=400&q=80", "price": 140, "mrp": 170, "stock": 155, "prescription_required": False, "description": "Water-based baby wipes enriched with vitamin E.", "form": "Wipes", "strength": "80 Sheets"},
  {"name": "Hydrating Purifying Face Wash", "category": "Personal Care", "subcategory": "Face Wash", "real_url": "https://images.unsplash.com/photo-608248597279-f99d160b2109?auto=format&fit=crop&w=400&q=80", "price": 160, "mrp": 190, "stock": 110, "prescription_required": False, "description": "Sulfate-free neem purifying facial cleanser.", "form": "Cream", "strength": "100ml"},
  {"name": "Onion Extract Hair Shampoo", "category": "Personal Care", "subcategory": "Shampoo", "real_url": "https://images.unsplash.com/photo-605264964528-06403738d6fd?auto=format&fit=crop&w=400&q=80", "price": 240, "mrp": 299, "stock": 65, "prescription_required": False, "description": "Anti-hairfall shampoo enriched with red onion extract.", "form": "Shampoo", "strength": "250ml"},
  {"name": "Neem Protection Bath Soap", "category": "Personal Care", "subcategory": "Soap", "real_url": "https://images.unsplash.com/photo-605264964528-06403738d6fd?auto=format&fit=crop&w=400&q=80", "price": 45, "mrp": 55, "stock": 210, "prescription_required": False, "description": "Antibacterial bathing bar with neem and basil oil.", "form": "Soap", "strength": "125g"},
  {"name": "Vitamin C Orange Active Bottle", "category": "Vitamins", "subcategory": "Vitamin C", "real_url": "https://images.unsplash.com/photo-6110784899350-1d84e82fda6e?auto=format&fit=crop&w=400&q=80", "price": 80, "mrp": 95, "stock": 130, "prescription_required": False, "description": "Chewable vitamin C tablets to build immunity support.", "form": "Tablet", "strength": "500mg"},
  {"name": "Vitamin D3 60K Immunity Bottle", "category": "Vitamins", "subcategory": "Vitamin D", "real_url": "https://images.unsplash.com/photo-6110784899350-1d84e82fda6e?auto=format&fit=crop&w=400&q=80", "price": 120, "mrp": 140, "stock": 90, "prescription_required": False, "description": "Vitamin D3 softgels for bone strength and calcium assimilation.", "form": "Capsule", "strength": "60000IU"}
]

# Fetch real products from Hugging Face REST API to populate the catalog
real_products = []
for offset in range(0, 700, 100):
  url = f"https://datasets-server.huggingface.co/rows?dataset=dmedhi/indian-medicines&config=default&split=train&offset={offset}&limit=100"
  try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
      res_data = json.loads(response.read().decode('utf-8'))
      rows = res_data.get('rows', [])
      for r in rows:
        row_data = r.get('row', {})
        name = row_data.get('name')
        image = row_data.get('image_url')
        if name and image and image.startswith("http"):
          real_products.append({
            "name": name,
            "image": image,
            "composition": row_data.get('composition', ''),
            "uses": row_data.get('uses', 'General recovery and health booster.'),
            "side_effects": row_data.get('side_effects', 'No common side effects.')
          })
  except Exception as e:
    print(f"Error fetching offset {offset}: {e}")

# Build final collections
final_products = []
image_mappings = {}
id_counter = 1

def clean_filename(name):
  return "".join([c.lower() for c in name if c.isalnum()])

# Helper to parse strength and form from product parameters
def parse_strength_and_form(name, comp):
  # Form
  text = (name + " " + comp).lower()
  form = "Tablet"
  if "tablet" in text or "tab" in text:
    form = "Tablet"
  elif "capsule" in text or "cap" in text:
    form = "Capsule"
  elif "syrup" in text or "suspension" in text or "drops" in text or "susp" in text:
    form = "Syrup"
  elif "injection" in text or "inj" in text:
    form = "Injection"
  elif "cream" in text or "gel" in text or "ointment" in text or "cream" in text:
    form = "Cream"
  elif "spray" in text:
    form = "Spray"
  elif "powder" in text or "sachet" in text:
    form = "Powder"
  elif "balm" in text:
    form = "Balm"
  elif "device" in text or "monitor" in text or "glucometer" in text or "thermometer" in text:
    form = "Device"
  
  # Strength
  strength_match = re.search(r"(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|gm|iu|%|v))", name + " " + comp, re.IGNORECASE)
  strength = strength_match.group(1) if strength_match else "Standard"
  
  return strength, form

# 1. Map premium brand list
for idx, b in enumerate(SPECIFIC_BRANDS):
  filename = f"{clean_filename(b['medicine_name'])}.webp"
  image_url = f"https://ik.imagekit.io/mediquick/products/{filename}"
  
  image_mappings[f"products/{filename}"] = b["real_url"]
  
  final_products.append({
    "id": f"prod-{str(id_counter).zfill(3)}",
    "medicine_name": b["medicine_name"],
    "brand": b["brand"],
    "strength": b["strength"],
    "form": b["form"],
    "category": b["category"],
    "subcategory": b["subcategory"],
    "image_url": image_url,
    "price": b["price"],
    "mrp": b["mrp"],
    "stock": b["stock"],
    "prescription_required": b["prescription_required"],
    "description": b["description"],
    "generic_name": b["generic_name"],
    "manufacturer": b["manufacturer"],
    "composition": b["composition"],
    "uses": b["uses"],
    "discount_percentage": b["discount_percentage"],
    "pack_size": b["pack_size"]
  })
  id_counter += 1

# 2. Map dynamic supplements
for idx, s in enumerate(SUPPLEMENTS):
  filename = f"{clean_filename(s['name'])}.webp"
  image_url = f"https://ik.imagekit.io/mediquick/products/{filename}"
  
  image_mappings[f"products/{filename}"] = s["real_url"]
  
  disc = 15
  price = int(s["mrp"] * (1 - disc/100))
  final_products.append({
    "id": f"prod-{str(id_counter).zfill(3)}",
    "medicine_name": s["name"],
    "brand": s["name"].split()[0],
    "strength": s["strength"],
    "form": s["form"],
    "category": s["category"],
    "subcategory": s["subcategory"],
    "image_url": image_url,
    "price": price,
    "mrp": s["mrp"],
    "stock": s["stock"],
    "prescription_required": s["prescription_required"],
    "description": s["description"],
    "generic_name": s["subcategory"],
    "manufacturer": "MediQuick Essentials Ltd",
    "composition": s["subcategory"] + " concentrated extracts",
    "uses": "Wellness and skin support.",
    "discount_percentage": disc,
    "pack_size": "Bottle of 100ml" if "Lotion" in s["name"] or "Shampoo" in s["name"] else "Pack of 1 Unit"
  })
  id_counter += 1

# 3. Map real medicines from Hugging Face dataset
for idx, item in enumerate(real_products):
  if len(final_products) >= 600:
    break
    
  name = item["name"]
  comp = item["composition"]
  
  filename = f"med_{clean_filename(name)[:20]}_{id_counter}.webp"
  image_url = f"https://ik.imagekit.io/mediquick/products/{filename}"
  
  image_mappings[f"products/{filename}"] = item["image"]
  
  # Parse strength and form
  strength, form = parse_strength_and_form(name, comp)
  
  # Determine category & prescription requirements based on composition
  category = "Medicines"
  prescription_required = False
  subcategory = "Tablets"
  
  if form == "Injection":
    subcategory = "Injections"
    prescription_required = True
  elif form == "Syrup":
    subcategory = "Syrups"
  elif form == "Cream":
    subcategory = "Ointments"
  
  comp_lower = comp.lower()
  # Diabetes checking
  if "insulin" in comp_lower or "metformin" in comp_lower or "glimepiride" in comp_lower or "gliptin" in comp_lower:
    category = "Diabetes Care"
    prescription_required = True
    
  # Heart checking
  elif "telmisartan" in comp_lower or "amlodipine" in comp_lower or "metoprolol" in comp_lower or "atorvastatin" in comp_lower or "rosuvastatin" in comp_lower or "clonidine" in comp_lower:
    category = "Heart Care"
    prescription_required = True

  # Antibiotic check
  elif "amoxicillin" in comp_lower or "amoxycillin" in comp_lower or "azithromycin" in comp_lower or "ciprofloxacin" in comp_lower or "moxifloxacin" in comp_lower:
    prescription_required = True

  # Price mapping
  mrp = int(80 + (hash(name) % 350))
  disc_pct = int(10 + (hash(name) % 20))
  price = int(mrp * (1 - disc_pct / 100))
  stock = int(10 + (hash(name) % 150)) if hash(name) % 10 != 0 else 0
  
  brand = name.split()[0]
  
  final_products.append({
    "id": f"prod-{str(id_counter).zfill(3)}",
    "medicine_name": name,
    "brand": brand,
    "strength": strength,
    "form": form,
    "category": category,
    "subcategory": subcategory,
    "image_url": image_url,
    "price": price,
    "mrp": mrp,
    "stock": stock,
    "prescription_required": prescription_required,
    "description": f"{name} is a clinically formulated pharmaceutical agent for recovery and wellness.",
    "generic_name": comp,
    "manufacturer": "Dr. Reddy's Laboratories" if id_counter % 2 == 0 else "Cipla Ltd",
    "composition": comp,
    "uses": item["uses"],
    "discount_percentage": disc_pct,
    "pack_size": "Strip of 10 Tablets" if form == "Tablet" else "Bottle of 100ml" if form == "Syrup" else "Pack of 1 Unit"
  })
  id_counter += 1

# Re-map IDs sequentially to avoid gaps
for idx, p in enumerate(final_products):
  p["id"] = f"prod-{str(idx + 1).zfill(3)}"

# Save final products
products_path = r"c:\new project anti\src\data\products.json"
with open(products_path, "w", encoding="utf-8") as pf:
  json.dump(final_products, pf, indent=2, ensure_ascii=False)

# Save image mappings
mappings_path = r"c:\new project anti\src\data\image_mappings.json"
with open(mappings_path, "w", encoding="utf-8") as mf:
  json.dump(image_mappings, mf, indent=2, ensure_ascii=False)

print(f"Generated products database v4 at: {products_path}")
print(f"Generated backup image mappings registry v4 at: {mappings_path}")
print(f"Wrote {len(final_products)} products total!")
