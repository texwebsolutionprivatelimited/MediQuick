import axios from 'axios';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve('scratch/hf_dataset.json');

async function main() {
  let allRows = [];
  if (fs.existsSync(outputPath)) {
    try {
      allRows = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      console.log(`Loaded ${allRows.length} existing rows from ${outputPath}`);
    } catch (e) {
      console.warn("Could not parse existing hf_dataset.json, starting fresh.");
    }
  }

  // Set offset to the next 100 block
  let offset = Math.floor(allRows.length / 100) * 100;
  const limit = 100;
  let hasMore = true;
  let consecutiveErrors = 0;

  console.log(`Starting/resuming download of dmedhi/indian-medicines from offset ${offset}...`);

  while (hasMore) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=dmedhi/indian-medicines&config=default&split=train&offset=${offset}&limit=${limit}`;
    try {
      console.log(`Fetching offset ${offset}...`);
      const response = await axios.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
      });
      const rows = response.data.rows;
      if (!rows || rows.length === 0) {
        hasMore = false;
        console.log("No more rows returned by API.");
        break;
      }

      // Merge new rows, avoiding duplicates by checking name
      const existingNames = new Set(allRows.map(r => r.name.toLowerCase()));
      let newCount = 0;
      rows.forEach(r => {
        if (r.row && r.row.name && r.row.image_url) {
          const lowerName = r.row.name.toLowerCase();
          if (!existingNames.has(lowerName)) {
            allRows.push({
              name: r.row.name,
              image_url: r.row.image_url,
              composition: r.row.composition || '',
              uses: r.row.uses || '',
              side_effects: r.row.side_effects || ''
            });
            newCount++;
          }
        }
      });

      console.log(`Added ${newCount} new rows. Total unique rows: ${allRows.length}`);
      
      // Save progress to file immediately
      fs.writeFileSync(outputPath, JSON.stringify(allRows, null, 2), 'utf-8');
      
      offset += limit;
      consecutiveErrors = 0;

      // Sleep 2 seconds between successful requests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      consecutiveErrors++;
      const status = error.response ? error.response.status : null;
      console.error(`Error fetching offset ${offset} (status ${status}):`, error.message);
      
      if (status === 429) {
        // Rate limit hit. Wait longer.
        const waitTime = Math.min(30000, 5000 * Math.pow(2, consecutiveErrors));
        console.log(`Rate limit hit (429). Waiting ${waitTime / 1000} seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (status === 404) {
        // End of dataset or invalid split
        console.log("Got 404. Assuming end of dataset.");
        hasMore = false;
      } else {
        // General error, wait 5 seconds and retry
        if (consecutiveErrors > 5) {
          console.error("Too many consecutive errors. Exiting loop.");
          hasMore = false;
        } else {
          console.log("Waiting 5 seconds before retry...");
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }

  console.log(`Finished download. Total unique rows saved: ${allRows.length}`);
}

main();
