import { buildApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const app = buildApp();

connectDB()
  .then(() => app.listen({ port: env.PORT, host: '0.0.0.0' }))
  .then((addr) => console.log(`API listening on ${typeof addr === 'string' ? addr : `http://0.0.0.0:${env.PORT}`}`))
  .catch((err) => {
    console.error('Server startup error', err);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  try { await app.close(); } finally { process.exit(0); }
});
