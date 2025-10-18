import Fastify from 'fastify';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import cookie from '@fastify/cookie';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import candidateRoutes from './modules/candidates/candidate.routes.js'; // 👈 default export .js
import seedRoutes from './modules/candidates/seed.js';
import authRoutes from './modules/auth/auth.routes.js';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function buildApp() {
  const app = Fastify({
    logger: { transport: env.isDev ? { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } } : undefined }
  });


  app.decorate('config', env);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await connectDB();

 await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (env.allowedOrigins.length === 0 || env.allowedOrigins.includes(origin)) return cb(null, true);
    if (env.CORS_ORIGIN && origin === env.CORS_ORIGIN) return cb(null, true);
    cb(new Error('CORS not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // 👈 Añade esta línea
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // 👈 Y esta también
  preflightContinue: false,
  optionsSuccessStatus: 204
});

  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(multipart, { limits: { fileSize: env.maxUploadMB * 1024 * 1024 } });
  await app.register(cookie, {
    secret: env.cookieSignSecret,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      sameSite: env.cookieSameSite,
      secure: env.cookieSecure,
      domain: env.cookieDomain,
      path: '/',
    },
  });

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  app.get('/api/v1/health', async () => ({ ok: true, now: new Date().toISOString() }));

  // 👇 IMPORTANTE: prefixes
  await app.withTypeProvider<ZodTypeProvider>().register(authRoutes, { prefix: '/api/v1/auth' });
  app.log.info('authRoutes registered at /api/v1/auth');

  await app.withTypeProvider<ZodTypeProvider>().register(candidateRoutes, { prefix: '/api/v1' });
  app.log.info('candidateRoutes registered at /api/v1');

  if (env.isDev) await app.register(seedRoutes, { prefix: '/api/v1' });

  app.setNotFoundHandler(notFound);
  app.setErrorHandler(errorHandler);

  // (Opcional) Imprimir rutas cuando está listo
  app.ready((err) => {
    if (err) app.log.error(err);
    else app.printRoutes();
  });

  return app;
}
