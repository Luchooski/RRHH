import 'dotenv/config';

function req(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production', // 👈 agregado
  port: Number(req('PORT', '4000')),
  mongoUri: req('MONGODB_URI'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
  maxUploadMB: Number(process.env.MAX_UPLOAD_MB ?? '10'),

  // === Auth / Cookies (compat + camelCase) ===
  // Compat con tu código existente:
  AUTH_COOKIE: process.env.AUTH_COOKIE ?? 'true',
  COOKIE_NAME: process.env.COOKIE_NAME || 'token',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  JWT_SECRET: req('JWT_SECRET', 'change-me'),

  // Aliases consistentes para nuevo código:
  useCookie: /^true$/i.test(process.env.AUTH_COOKIE ?? 'true'),
  cookieName: process.env.COOKIE_NAME || 'token',
  jwtSecret: req('JWT_SECRET', 'change-me'),
  // Normalizamos a minúsculas para que encaje con el tipo de fastify-cookie
  cookieSameSite: (() => {
    const v = (process.env.COOKIE_SAMESITE ?? 'lax').toString().toLowerCase();
    return (v === 'lax' || v === 'strict' || v === 'none') ? v : 'lax';
  })() as 'lax' | 'strict' | 'none',
  cookieSecure: /^true$/i.test(process.env.COOKIE_SECURE ?? 'false'),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookieSignSecret: process.env.COOKIE_SIGN_SECRET || undefined,
};

export const isProd = env.isProd; // 👈 para compat con tus imports
