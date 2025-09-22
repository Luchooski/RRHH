import { config } from 'dotenv';
config();

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/match_hire'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? 300)
};
