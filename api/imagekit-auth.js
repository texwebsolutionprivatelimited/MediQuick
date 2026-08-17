import crypto from 'crypto';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Access the private key securely on server-side
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: 'IMAGEKIT_PRIVATE_KEY is not defined in Vercel environment variables.' });
  }

  // Generate tokens and signature
  const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes expiry

  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return res.status(200).json({ token, expire, signature });
}
