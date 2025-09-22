// api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';

import authRoutes from './modules/auth/auth.routes.js';
import { authGuard } from './middlewares/auth.js';
import { ensureSeedAdmin } from './modules/auth/auth.service.js';

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'production'
      ? true
      : { transport: { target: 'pino-pretty' } }
  });

    app.register(cors, {
    origin: env.CORS_ORIGIN,         // p.ej. http://localhost:5173
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    exposedHeaders: ['Content-Disposition'] // para export.csv
  });

  app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: '1 minute' });

  app.get('/api/v1/health', async () => ({ ok: true, uptime: process.uptime() }));

  app.register(payrollRoutes);

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFound);

  // auth (público)
  app.register(authRoutes, { prefix: '/api/v1' });

  // payrolls protegido (ejemplo): antes de registrar sus rutas
app.addHook('preHandler', async (req, reply) => {
  // protege todo lo que pegue al prefijo /api/v1/payrolls
  if (req.url.startsWith('/api/v1/payrolls')) {
    await authGuard()(req, reply);
  }
});

  // seed (una sola vez al levantar en dev)
  ensureSeedAdmin().catch(console.error);


  return app;
}
