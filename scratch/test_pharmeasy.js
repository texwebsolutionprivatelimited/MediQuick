import axios from 'axios';

async function main() {
  const query = 'Colgate';
  const url = `https://api.pharmeasy.in/api/v1/search/suggestions?q=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Response Status:", res.status);
    console.log("Response Data:", JSON.stringify(res.data).slice(0, 1000));
  } catch (err) {
    console.error("PharmEasy query failed:", err.message);
  }
}

main();
