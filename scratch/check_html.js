import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function main() {
  const query = 'site:1mg.com Dolo 650';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    fs.writeFileSync(path.resolve('scratch/ddg_output.html'), res.data, 'utf-8');
    console.log("Saved HTML to scratch/ddg_output.html");
  } catch (err) {
    console.error("Search failed:", err.message);
  }
}

main();
