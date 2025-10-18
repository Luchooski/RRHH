import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { autoIndex: env.isDev });
  mongoose.connection.on('error', (err) => console.error('[mongo] error', err));
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}
