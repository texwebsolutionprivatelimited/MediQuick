import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function main() {
  const query = 'Colgate Total Toothpaste';
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = res.data;
    console.log(`HTML Length: ${html.length}`);
    fs.writeFileSync(path.resolve('scratch/google_output.html'), html, 'utf-8');
    
    // Find all image source URLs. In Google Image search HTML, images often reside in src="http..." inside tags.
    const matches = [];
    const regex = /<img[^>]*src="([^"]*)"/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (match[1].startsWith('http') && !match[1].includes('google.com')) {
        matches.push(match[1]);
      }
    }
    
    console.log("Found matches:", matches.slice(0, 5));
  } catch (err) {
    console.error("Google query failed:", err.message);
  }
}

main();
