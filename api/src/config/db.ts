import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
  mongoose.connection.on('error', (err) => {
    console.error('[mongoose] error', err);
  });
  console.log('[mongoose] connected');
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
