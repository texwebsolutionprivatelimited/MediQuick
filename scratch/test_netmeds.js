import axios from 'axios';

async function main() {
  const query = 'Combiflam';
  const url = `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = res.data;
    console.log(`HTML Length: ${html.length}`);
    
    // Find all image URLs containing netmeds.com/images/product-v1/
    const matches = [];
    const regex = /(https?:\/\/[^"'\s]*netmeds\.com\/images\/product-v1\/[^"'\s]*)/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1]);
    }
    
    console.log("Found matches:", [...new Set(matches)]);
  } catch (err) {
    console.error("Netmeds query failed:", err.message);
  }
}

main();
