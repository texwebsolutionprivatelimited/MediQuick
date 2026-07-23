import fs from 'fs';
import path from 'path';

const medicinesPath = path.resolve('src/data/medicines.json');
const rawData = fs.readFileSync(medicinesPath, 'utf8');
const products = JSON.parse(rawData);

console.log(`Total Products: ${products.length}`);
const imageCounts = {};
products.forEach(p => {
  imageCounts[p.image_url] = (imageCounts[p.image_url] || 0) + 1;
});

const duplicateImages = Object.entries(imageCounts).filter(([url, count]) => count > 1);
console.log(`Unique Image URLs: ${Object.keys(imageCounts).length}`);
console.log(`Duplicate Image URLs count: ${duplicateImages.length}`);
console.log("Duplicate URLs and their counts:");
duplicateImages.forEach(([url, count]) => {
  const matchingProds = products.filter(p => p.image_url === url).map(p => `${p.id}: ${p.medicine_name} (${p.category})`);
  console.log(`- ${url} (count: ${count}):`);
  matchingProds.forEach(mp => console.log(`    * ${mp}`));
});
