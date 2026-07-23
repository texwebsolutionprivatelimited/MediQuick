import axios from 'axios';

async function main() {
  const query = 'site:1mg.com Dolo 650';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = res.data;
    console.log(`HTML Length: ${html.length}`);
    
    // Find all hrefs
    const hrefs = [];
    const regex = /href="([^"]*)"/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (match[1].includes('1mg.com')) {
        hrefs.push(match[1]);
      }
    }
    console.log("Hrefs containing 1mg.com:", [...new Set(hrefs)]);
  } catch (err) {
    console.error("Search failed:", err.message);
  }
}

main();
