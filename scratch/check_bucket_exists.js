import https from 'https';

function checkBucket(bucketName) {
  return new Promise((resolve) => {
    const url = `https://storage.googleapis.com/${bucketName}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\nBucket: ${bucketName}`);
        console.log(`HTTP Status: ${res.statusCode}`);
        console.log("Body:", data);
        resolve();
      });
    }).on('error', (err) => {
      console.error(`Error checking ${bucketName}:`, err.message);
      resolve();
    });
  });
}

async function run() {
  await checkBucket("mediquick-b110b.firebasestorage.app");
  await checkBucket("mediquick-b110b.appspot.com");
}

run();
