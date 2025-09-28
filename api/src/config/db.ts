import mongoose from 'mongoose';

export async function connectMongo(uri: string) {
  const maxRetries = 10;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(uri, { autoIndex: true });
      console.log(`[db] connected (${mongoose.connection.readyState})`);
      return;
    } catch (err) {
      attempt++;
      const backoff = Math.min(30000, 1000 * Math.pow(2, attempt));
      console.error(`[db] connection error (attempt ${attempt})`, err);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error(`[db] failed to connect after ${maxRetries} attempts`);
}

export async function disconnectMongo() {
  try {
    await mongoose.disconnect();
    console.log('[db] disconnected');
  } catch (err) {
    console.error('[db] disconnect error', err);
  }
}
