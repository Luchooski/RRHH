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

  // DB
  MONGODB_URI: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/match_hire'),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  // Rate limit
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? 300),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET ?? 'Crea_una_frase_larga_aleatoria',

  // Auth toggles
  AUTH_HEADER: (process.env.AUTH_HEADER ?? 'true').toLowerCase(),   // 'true' | 'false'
  AUTH_COOKIE: (process.env.AUTH_COOKIE ?? 'false').toLowerCase(),  // 'true' | 'false'

  // Cookie config
  COOKIE_NAME: process.env.COOKIE_NAME ?? 'token',
  COOKIE_SECRET: process.env.COOKIE_SECRET ?? '',
};

// Helpers
export const useHeader = env.AUTH_HEADER !== 'false';
export const useCookie = env.AUTH_COOKIE === 'true';
export const isProd = env.NODE_ENV === 'production';

// Validación adicional
if (useCookie && !env.COOKIE_SECRET) {
  throw new Error('COOKIE_SECRET is required when AUTH_COOKIE=true');
}
