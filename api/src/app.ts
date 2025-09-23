// api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie'; // <-- NUEVO

import { env, useCookie, isProd } from './config/env.js'; // <-- import helpers
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { authGuard } from './middlewares/auth.js';
import { ensureSeedAdmin } from './modules/auth/auth.service.js';
import { healthRoutes } from './modules/health/health.routes.js';

export function buildApp() {
  const app = Fastify({ logger: false });

  // CORS (incluye Authorization)
  app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    // credentials TRUE solo si vas a usar cookie httpOnly desde browser
    credentials: useCookie,
  });

  // Cookie plugin (solo si AUTH_COOKIE=true)
  if (useCookie) {
    app.register(cookie, {
      secret: env.COOKIE_SECRET,
      hook: 'onRequest',
      parseOptions: {
        sameSite: 'lax',
        secure: isProd, // en prod: true (HTTPS)
        path: '/',
      },
    });
  }

  // Rate limit
  app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: '1 minute' });

  // Health
  app.register(healthRoutes);

  // Auth con prefijo /api/v1
  app.register(authRoutes, { prefix: '/api/v1' });

  // Payrolls ya tienen URLs absolutas /api/v1/... => registrar sin prefijo adicional
  app.register(payrollRoutes);

  // Proteger /api/v1/payrolls* (todo ese árbol)
  app.addHook('preHandler', async (req, reply) => {
    if (req.url.startsWith('/api/v1/payrolls')) {
      await authGuard()(req, reply);
    }
  });

  // Errores y 404
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFound);

  // Seed admin (dev)
  ensureSeedAdmin().catch(console.error);

  return app;
}
