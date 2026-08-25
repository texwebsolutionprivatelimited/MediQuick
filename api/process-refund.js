import crypto from 'crypto';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { orderId, refundAmount } = req.body;

  if (!orderId || refundAmount === undefined || refundAmount === null) {
    return res.status(400).json({ error: 'Missing required parameters: orderId and refundAmount are required.' });
  }

  if (Number(refundAmount) <= 0) {
    return res.status(400).json({ error: 'Refund amount must be greater than zero.' });
  }

  // Retrieve private gateway secret key securely on the server-side
  const gatewaySecret = process.env.PAYMENT_GATEWAY_SECRET || "sk_test_mediquick_default_secret_key_9918";

  try {
    // Generate a secure mock transaction ID
    const refundTransactionId = 'ref_' + crypto.randomBytes(12).toString('hex');
    
    return res.status(200).json({
      success: true,
      refundTransactionId,
      refundAmount: Number(refundAmount),
      refundedAt: new Date().toISOString(),
      gatewayMessage: "Refund processed successfully via Payment Gateway secure tunnel."
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal payment gateway simulation error: ' + error.message });
  }
}
