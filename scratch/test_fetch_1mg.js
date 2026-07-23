import axios from 'axios';

async function main() {
  const url = 'https://www.1mg.com/drugs/dolo-650-tablet-74467';
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
    
    // Find og:image and twitter:image
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i) || html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i);
    const twitterImageMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]*)"/i) || html.match(/<meta\s+content="([^"]*)"\s+name="twitter:image"/i);
    
    console.log("og:image:", ogImageMatch ? ogImageMatch[1] : null);
    console.log("twitter:image:", twitterImageMatch ? twitterImageMatch[1] : null);
  } catch (err) {
    console.error("Fetch 1mg page failed:", err.message);
  }
}

main();
