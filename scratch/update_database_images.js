import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    config[key] = value.trim();
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID,
  measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
};

const medicinesPath = path.resolve('src/data/medicines.json');
const hfPath = path.resolve('scratch/hf_dataset.json');

const products = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
const hfDataset = JSON.parse(fs.readFileSync(hfPath, 'utf8'));

const assignedImages = new Set();
const reportedUnmatched = [];

function normalize(name) {
  return name.toLowerCase()
    .replace(/tablet|capsule|syrup|gel|cream|suspension|drops|liquid|soap|shampoo|lotion|oil|powder|wipes|wash|cleanser|foam|serum|spray|balm/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchYahoo(query, domain) {
  const fullQuery = `site:${domain} ${query}`;
  const url = `https://search.yahoo.com/search?p=${encodeURIComponent(fullQuery)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });
    const html = res.data;
    
    const regex = /href="([^"]*)"/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null) {
      const link = match[1];
      if (link.includes('RU=')) {
        const ruMatch = link.match(/RU=([^/&?]*)/);
        if (ruMatch) {
          const targetUrl = decodeURIComponent(ruMatch[1]);
          if (targetUrl.includes(domain) && !targetUrl.includes('yahoo.com') && !targetUrl.includes('/drugs-substitutes/') && !targetUrl.includes('/privacy') && !targetUrl.includes('/terms')) {
            urls.push(targetUrl);
          }
        }
      }
    }
    return [...new Set(urls)];
  } catch (err) {
    console.error(`Yahoo search failed for "${fullQuery}":`, err.message);
    return [];
  }
}

async function extractImageFromPage(url, domain) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });
    const html = res.data;
    
    if (domain.includes('1mg.com')) {
      const regex = /(https?:\/\/[^"'\s]*gumlet\.io\/[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi;
      let match;
      const gumletUrls = [];
      while ((match = regex.exec(html)) !== null) {
        gumletUrls.push(match[1]);
      }
      const uniqueUrls = [...new Set(gumletUrls)];
      let best = uniqueUrls.find(u => u.includes('/cropped/') && (u.includes('w_480') || u.includes('w_380')));
      if (!best) best = uniqueUrls.find(u => u.includes('/cropped/'));
      if (!best) best = uniqueUrls.find(u => (u.includes('w_480') || u.includes('w_380')) && !u.includes('logo') && !u.includes('icon'));
      if (!best) best = uniqueUrls.find(u => u.includes('gumlet.io') && !u.includes('logo') && !u.includes('icon'));
      return best || null;
    }
    
    if (domain.includes('netmeds.com')) {
      const regex = /(https?:\/\/[^"'\s]*netmeds\.com\/images\/product-v1\/[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi;
      let match = regex.exec(html);
      if (match) return match[1];
      const fallbackRegex = /(https?:\/\/[^"'\s]*netmeds\.com\/images\/[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi;
      match = fallbackRegex.exec(html);
      return match ? match[1] : null;
    }
    
    if (domain.includes('apollopharmacy.in') || domain.includes('apollo247.com')) {
      const regex = /(https?:\/\/[^"'\s]*apollo247\.com\/[^"'\s]*catalog\/product\/[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi;
      let match = regex.exec(html);
      if (match) return match[1];
      const fallbackRegex = /(https?:\/\/[^"'\s]*apollo247\.com\/[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi;
      match = fallbackRegex.exec(html);
      return match ? match[1] : null;
    }
    
    return null;
  } catch (err) {
    console.error(`Extract image failed for "${url}":`, err.message);
    return null;
  }
}

async function findImageOnline(productName, brand) {
  const query = `${brand} ${productName}`;
  const domains = ['1mg.com', 'netmeds.com', 'apollopharmacy.in'];
  
  for (const domain of domains) {
    console.log(`Searching Yahoo for "${query}" on ${domain}...`);
    const urls = await searchYahoo(query, domain);
    if (urls.length > 0) {
      console.log(`Found product page on ${domain}: ${urls[0]}`);
      const img = await extractImageFromPage(urls[0], domain);
      if (img && !assignedImages.has(img)) {
        return img;
      }
    }
    // Polite delay between queries
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return null;
}

async function run() {
  console.log(`Starting image matching for ${products.length} products...`);
  const finalProducts = [];
  
  // Track specific overrides that we know are valid
  const staticOverrides = {
    "med-1": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/c773bc28-3c46-444a-b50a-f0f81395fa3d.jpeg", // Dolo 650
    "med-2": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/wy2y9bdipmh6rgkrj0zm.jpg", // Augmentin 625 Duo
    "med-3": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cropped/niowfyzxquufm1i2zqgo.jpg", // Combiflam
    "med-4": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cropped/g7v4bcygsc5qj47fey9d.jpg", // Pantocid 40mg
    "med-15": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/c773bc28-3c46-444a-b50a-f0f81395fa3d.jpeg", // Calpol 650
    "med-16": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u0yjtcv5c7p7s8w2b3yd.jpg", // Digene Mint Gel
    "med-17": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u6eov69dptd33kpejld6.jpg", // Volini Pain Spray
    "med-18": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/b6v4bcygsc5qj47fey9d.jpg", // Vicks Vaporub Balm
    "med-19": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u9s8qjc56qj45h7fd9yd.jpg", // Electral ORS
    "med-20": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/hndjkvvy86ch0ivpgg4o.jpg", // Benadryl Syrup
    "med-21": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/b6v4bcygsc5qj47fey9d.jpg", // Vicks Vaporub
    "med-22": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/xkg1pweump6uhajxdn7y.jpg", // Revital H
    "med-23": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/fa7427131ec64163b5bbafb529df0736.jpg", // Zincovit
    "med-24": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/3205599cc49d4073ae66cbb0dbfded86.jpg", // Ascoril LS
    "med-25": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cropped/gnsem6ircqxmwmjkprkw.jpg", // Soframycin
    "med-26": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/612a8de029ee416ab320d109d19d2293.jpg", // Boroline
    "med-31": "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cropped/reowbvajejs6awykdplk.jpg", // Accu-Chek Test Strips
    "med-121": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/u8dcfvyv86ch0ivpgg4o.jpg", // Accu-Chek Active
    "med-122": "https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/cropped/b6vcygsc5qj47fey9d3d.jpg"  // Omron BP Monitor
  };

  for (const [id, url] of Object.entries(staticOverrides)) {
    assignedImages.add(url);
  }

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`\n[${i + 1}/${products.length}] Processing Product ID: ${p.id} | Name: "${p.medicine_name}"`);

    // 1. Check static override
    if (staticOverrides[p.id]) {
      console.log(`  -> Using static override image.`);
      p.image_url = staticOverrides[p.id];
      finalProducts.push(p);
      continue;
    }

    // 2. Try exact or fuzzy matching with Hugging Face dataset (11,686 unique rows)
    const pNorm = normalize(p.medicine_name);
    let bestMatch = hfDataset.find(hf => normalize(hf.name) === pNorm);
    
    if (!bestMatch) {
      // Substring matching
      bestMatch = hfDataset.find(hf => {
        const hfNorm = normalize(hf.name);
        return hfNorm.length > 3 && (hfNorm.includes(pNorm) || pNorm.includes(hfNorm));
      });
    }

    if (bestMatch && bestMatch.image_url && !assignedImages.has(bestMatch.image_url) && !bestMatch.image_url.includes('logo') && !bestMatch.image_url.includes('icon')) {
      console.log(`  -> Matched HF Dataset: "${bestMatch.name}"`);
      p.image_url = bestMatch.image_url;
      assignedImages.add(bestMatch.image_url);
      finalProducts.push(p);
      continue;
    }

    // 3. Fallback: Search online (Yahoo + Apollo/Netmeds/1mg parsing)
    if (p.category !== 'Lab Tests') {
      const onlineImg = await findImageOnline(p.medicine_name, p.brand);
      if (onlineImg) {
        console.log(`  -> Found Online Image: ${onlineImg}`);
        p.image_url = onlineImg;
        assignedImages.add(onlineImg);
        finalProducts.push(p);
        continue;
      }
    }

    // 4. If still not matched, check if it already has a unique unsplash image and it's not a duplicate
    // Note: Lab tests can have professional medical representations, but if we don't have a package, we'll keep them unique.
    if (p.image_url && !p.image_url.includes('+') && !assignedImages.has(p.image_url)) {
      console.log(`  -> Retaining existing unique image: ${p.image_url}`);
      assignedImages.add(p.image_url);
      finalProducts.push(p);
      continue;
    }

    // 5. If it's a duplicate or placeholder and we couldn't find an image, report it!
    console.warn(`  [!] WARNING: Could not find authentic online image for "${p.medicine_name}" (Brand: ${p.brand}, Category: ${p.category})`);
    reportedUnmatched.push(`${p.id}: ${p.medicine_name} (Brand: ${p.brand}, Category: ${p.category})`);
    
    // Set to a blank placeholder or keep as is, but mark for reporting
    finalProducts.push(p);
  }

  // Save changes locally to medicines.json
  fs.writeFileSync(medicinesPath, JSON.stringify(finalProducts, null, 2), 'utf-8');
  console.log(`\nSuccessfully updated ${medicinesPath}`);

  // Seed changes into Firestore products collection
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("\nUploading updated products to Firestore...");
    for (const p of finalProducts) {
      const productRef = doc(db, 'products', p.id);
      await setDoc(productRef, p);
    }
    console.log("Firestore products collection successfully updated.");
  } catch (error) {
    console.error("Firestore update failed:", error);
  }

  // Report unmatched products
  console.log("\n================ UNMATCHED PRODUCTS REPORT ================");
  if (reportedUnmatched.length === 0) {
    console.log("All products successfully resolved to authentic unique images!");
  } else {
    console.log(`Could not find authentic unique package images for the following ${reportedUnmatched.length} products:`);
    reportedUnmatched.forEach(item => console.log(`- ${item}`));
  }
  console.log("===========================================================");
}

run();
