import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'crypto'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'imagekit-auth-server',
        configureServer(server) {
          server.middlewares.use('/api/imagekit-auth', (req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');

            if (req.method !== 'GET') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            const privateKey = env.IMAGEKIT_PRIVATE_KEY || env.VITE_IMAGEKIT_URL_ENDPOINT;
            if (!privateKey) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'IMAGEKIT_PRIVATE_KEY or VITE_IMAGEKIT_URL_ENDPOINT is not defined in environment variables.' }));
              return;
            }

            const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
            const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes expiry

            const signature = crypto
              .createHmac('sha1', privateKey)
              .update(token + expire)
              .digest('hex');

            res.statusCode = 200;
            res.end(JSON.stringify({ token, expire, signature }));
          });
        }
      }
    ]
  };
})

