import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'src', 'data', 'medicines.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const categoryMap = {};
data.forEach(p => {
  if (!categoryMap[p.category]) {
    categoryMap[p.category] = [];
  }
  categoryMap[p.category].push({ id: p.id, name: p.medicine_name });
});

console.log("Distinct Categories:");
Object.keys(categoryMap).forEach(cat => {
  console.log(`- ${cat} (${categoryMap[cat].length} products)`);
});
