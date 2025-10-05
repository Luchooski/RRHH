import { config } from 'dotenv';
config();

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',

  // ← NUEVO: HOST
  HOST: process.env.HOST ?? '0.0.0.0',

  PORT: Number(process.env.PORT ?? 4000),

  MONGODB_URI: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/match_hire'),

  CORS_ORIGIN: required('CORS_ORIGIN', 'http://localhost:5173'),

  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? 300),

  PAYROLLS_COLL: required('PAYROLLS_COLL', 'payrolls'),

  JWT_SECRET: required('JWT_SECRET', 'CHANGE_ME_IN_PROD'),

  AUTH_HEADER: (process.env.AUTH_HEADER ?? 'true').toString(),
  AUTH_COOKIE: (process.env.AUTH_COOKIE ?? 'true').toString(),

  COOKIE_NAME: process.env.COOKIE_NAME ?? 'token',
  COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'devcookiesecret', // en prod cambiá esto
};

export const useHeader = env.AUTH_HEADER !== 'false';
export const useCookie = env.AUTH_COOKIE === 'true';
export const isProd = env.NODE_ENV === 'production';
