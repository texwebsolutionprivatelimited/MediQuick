import axios from 'axios';

async function main() {
  const query = 'Colgate';
  const url = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = res.data;
    console.log(`HTML Length: ${html.length}`);
    
    // Find all image URLs. Apollo images often reside on their CDN, e.g. newassets.apollo247.com/pub/media/catalog/product/...
    const matches = [];
    const regex = /(https?:\/\/[^"'\s]*apollo247\.com\/[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1]);
    }
    
    console.log("Found matches:", [...new Set(matches)]);
  } catch (err) {
    console.error("Apollo query failed:", err.message);
  }
}

main();
