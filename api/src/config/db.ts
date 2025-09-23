// api/src/config/db.ts
import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

type ConnectOptions = {
  maxRetries?: number;
  initialDelayMs?: number;
};

export async function connectDB(opts: ConnectOptions = {}) {
  const maxRetries = opts.maxRetries ?? 5;
  const initialDelayMs = opts.initialDelayMs ?? 500;

  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI no está definido en el entorno');
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      attempt++;
      console.info(`[db] connecting to ${redactUri(uri)} (attempt ${attempt}/${maxRetries + 1})…`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
        retryWrites: true,
      });
      console.info('[db] connected');
      bindGracefulShutdown();
      return;
    } catch (err) {
      const delay = attempt > maxRetries ? 0 : backoffDelay(initialDelayMs, attempt);
      console.error(`[db] connection error: ${(err as Error).message}`);
      if (attempt > maxRetries) {
        console.error('[db] giving up after max retries');
        throw err;
      }
      console.info(`[db] retrying in ${Math.round(delay)}ms…`);
      await sleep(delay);
    }
  }
}

function backoffDelay(base: number, attempt: number) {
  // exponencial con jitter
  const exp = base * Math.pow(2, attempt - 1);
  const jitter = Math.random() * base;
  return exp + jitter;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function bindGracefulShutdown() {
  const close = async (signal: string) => {
    try {
      console.info(`[db] received ${signal}, closing mongoose…`);
      await mongoose.connection.close();
      console.info('[db] mongoose closed. Bye!');
      process.exit(0);
    } catch (e) {
      console.error('[db] error on close', e);
      process.exit(1);
    }
  };
  process.once('SIGINT', () => close('SIGINT'));
  process.once('SIGTERM', () => close('SIGTERM'));
}

function redactUri(uri: string) {
  // oculta credenciales en logs
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    if (u.password) u.password = '***';
    if (u.username) u.username = '***';
    return uri.startsWith('mongodb+srv://')
      ? 'mongodb+srv://' + u.host + u.pathname
      : 'mongodb://' + u.host + u.pathname;
  } catch {
    return uri;
  }
}
