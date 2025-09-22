// api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';

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

  return app;
}
