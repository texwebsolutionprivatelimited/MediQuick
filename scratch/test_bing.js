import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function main() {
  const query = 'site:1mg.com Dolo 650';
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = res.data;
    console.log(`HTML Length: ${html.length}`);
    
    // Find image URLs. In Bing Images, the images are often in a JSON-like string in the HTML, e.g. murl:"..."
    const murls = [];
    const regex = /murl&quot;:&quot;(https?:[^&]*)&quot;/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      murls.push(match[1]);
    }
    
    console.log("Found murls:", murls.slice(0, 5));
  } catch (err) {
    console.error("Search failed:", err.message);
  }
}

main();
