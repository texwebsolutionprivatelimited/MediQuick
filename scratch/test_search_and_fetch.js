import axios from 'axios';

async function searchYahoo(query) {
  const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = res.data;
    
    // Find all links
    const regex = /href="([^"]*)"/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null) {
      const link = match[1];
      if (link.includes('RU=')) {
        const ruMatch = link.match(/RU=([^/&?]*)/);
        if (ruMatch) {
          const targetUrl = decodeURIComponent(ruMatch[1]);
          if ((targetUrl.includes('1mg.com/drugs/') || targetUrl.includes('1mg.com/otc/')) && !targetUrl.includes('/drugs-substitutes/')) {
            urls.push(targetUrl);
          }
        }
      }
    }
    return [...new Set(urls)];
  } catch (err) {
    console.error(`Yahoo search failed for "${query}":`, err.message);
    return [];
  }
}

async function fetch1mgImage(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = res.data;
    
    // Find all gumlet.io URLs containing /cropped/ or /marketing/ or /diagnostics/
    const regex = /(https?:\/\/[^"'\s]*gumlet\.io\/[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi;
    let match;
    const gumletUrls = [];
    while ((match = regex.exec(html)) !== null) {
      gumletUrls.push(match[1]);
    }
    
    const uniqueUrls = [...new Set(gumletUrls)];
    
    // Filter and find the best one: preferably w_480 or w_380 and containing /cropped/
    let best = uniqueUrls.find(u => u.includes('/cropped/') && (u.includes('w_480') || u.includes('w_380')));
    if (!best) best = uniqueUrls.find(u => u.includes('/cropped/'));
    if (!best) best = uniqueUrls.find(u => (u.includes('w_480') || u.includes('w_380')) && !u.includes('logo') && !u.includes('icon'));
    if (!best) best = uniqueUrls.find(u => u.includes('gumlet.io') && !u.includes('logo') && !u.includes('icon'));
    
    return best || null;
  } catch (err) {
    console.error(`Fetch image failed for "${url}":`, err.message);
    return null;
  }
}

async function testProduct(name) {
  console.log(`\nTesting: "${name}"`);
  const searchResults = await searchYahoo(`site:1mg.com ${name}`);
  console.log(`Search Results for "${name}":`, searchResults);
  if (searchResults.length > 0) {
    const img = await fetch1mgImage(searchResults[0]);
    console.log(`Found Image: ${img}`);
  } else {
    console.log("No 1mg links found.");
  }
}

async function run() {
  await testProduct('Combiflam Tablet');
  await testProduct('Monocef 1g Injection');
  await testProduct('Colgate Total Toothpaste');
  await testProduct('Himalaya Baby Powder');
  await testProduct('Complete Blood Count (CBC) Test');
  await testProduct('Lipid Profile (Cholesterol) Test');
}

run();
