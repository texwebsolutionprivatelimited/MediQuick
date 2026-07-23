import fs from 'fs';
import path from 'path';

const medicinesPath = path.resolve('src/data/medicines.json');
const hfPath = path.resolve('scratch/hf_dataset.json');

const products = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
const hfDataset = JSON.parse(fs.readFileSync(hfPath, 'utf8'));

console.log(`Loaded ${products.length} products and ${hfDataset.length} Hugging Face items.`);

function normalize(name) {
  return name.toLowerCase()
    .replace(/tablet|capsule|syrup|gel|cream|suspension|drops|liquid|soap|shampoo|lotion|oil|powder|wipes|wash|cleanser|foam|serum|spray|balm/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let matchedCount = 0;
const unmatched = [];

products.forEach(p => {
  const pNorm = normalize(p.medicine_name);
  
  // Find a match in Hugging Face dataset
  let bestMatch = null;
  let exactMatch = hfDataset.find(hf => normalize(hf.name) === pNorm);
  
  if (exactMatch) {
    bestMatch = exactMatch;
  } else {
    // Try substring matching
    bestMatch = hfDataset.find(hf => {
      const hfNorm = normalize(hf.name);
      return hfNorm.includes(pNorm) || pNorm.includes(hfNorm);
    });
  }
  
  if (bestMatch) {
    matchedCount++;
    console.log(`Matched: "${p.medicine_name}" -> "${bestMatch.name}" | Image: ${bestMatch.image_url}`);
  } else {
    unmatched.push(p);
  }
});

console.log(`\nMatched ${matchedCount}/${products.length} products.`);
console.log(`Unmatched count: ${unmatched.length}`);
console.log("\nUnmatched products by category:");
const categories = {};
unmatched.forEach(p => {
  categories[p.category] = categories[p.category] || [];
  categories[p.category].push(p.medicine_name);
});

Object.entries(categories).forEach(([cat, list]) => {
  console.log(`\nCategory: ${cat} (${list.length} products)`);
  list.forEach(name => console.log(`  - ${name}`));
});
