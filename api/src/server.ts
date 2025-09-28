import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo, disconnectMongo } from './config/db.js';

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
  // No matamos el proceso en dev, pero logueamos todo.
});

const app = buildApp();

async function start() {
  try {
    await connectMongo(env.MONGODB_URI);
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`✅ API listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
  } catch (err) {
    app.log.error(err, '❌ Error starting server');
    process.exit(1);
  }
}

async function shutdown() {
  try {
    await app.close();
    await disconnectMongo();
  } catch (err) {
    console.error('shutdown error', err);
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
