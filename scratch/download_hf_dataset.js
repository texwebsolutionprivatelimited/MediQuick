import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function main() {
  const allRows = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  
  console.log("Downloading dmedhi/indian-medicines dataset from Hugging Face...");
  
  while (hasMore) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=dmedhi/indian-medicines&config=default&split=train&offset=${offset}&limit=${limit}`;
    try {
      console.log(`Fetching offset ${offset}...`);
      const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const rows = response.data.rows;
      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }
      rows.forEach(r => {
        if (r.row) {
          allRows.push({
            name: r.row.name,
            image_url: r.row.image_url,
            composition: r.row.composition,
            uses: r.row.uses,
            side_effects: r.row.side_effects
          });
        }
      });
      offset += limit;
      // Sleep a bit to be polite to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching offset ${offset}:`, error.message);
      hasMore = false;
    }
  }
  
  console.log(`Fetched ${allRows.length} total rows.`);
  const outputPath = path.resolve('scratch/hf_dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(allRows, null, 2), 'utf-8');
  console.log(`Saved dataset to ${outputPath}`);
}

main();
