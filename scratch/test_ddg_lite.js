import axios from 'axios';

async function main() {
  const query = 'site:1mg.com Dolo 650';
  const url = `https://lite.duckduckgo.com/lite/`;
  try {
    const res = await axios.post(url, `q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const html = res.data;
    console.log(`HTML Length: ${html.length}`);
    
    // Find all links containing 1mg.com
    const matches = [];
    const regex = /href="([^"]*1mg\.com[^"]*)"/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1]);
    }
    
    console.log("Found links:", [...new Set(matches)]);
  } catch (err) {
    console.error("DDG Lite failed:", err.message);
  }
}

main();
