import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'src', 'data', 'medicines.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

data.forEach((p, idx) => {
  console.log(`[${idx + 1}] ID: ${p.id} | Name: "${p.medicine_name}" | Brand: "${p.brand}" | Current Cat: "${p.category}"`);
});
