import axios from 'axios';

async function main() {
  const url = "https://datasets-server.huggingface.co/rows?dataset=dmedhi/indian-medicines&config=default&split=train&offset=0&limit=100";
  try {
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const rows = response.data.rows;
    console.log(`Fetched ${rows.length} rows`);
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i].row;
      console.log(`- Name: ${row.name}`);
      console.log(`  Image: ${row.image_url}`);
      console.log(`  Composition: ${row.composition}`);
    }
  } catch (error) {
    console.error("Error fetching dataset:", error.message);
  }
}

main();
