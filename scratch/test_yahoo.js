import axios from 'axios';

async function main() {
  const query = 'site:1mg.com Dolo 650';
  const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
    console.error("Yahoo query failed:", err.message);
  }
}

main();
