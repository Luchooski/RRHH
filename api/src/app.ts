// api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { env, useCookie, isProd } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { healthRoutes } from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';
import { employeeRoutes } from './modules/employee/employee.routes.js';
import { authGuard } from './middlewares/auth.js';
import { ensureSeedAdmin } from './modules/auth/auth.service.js';

import { candidateRoutes } from './modules/candidates/candidate.routes.js';


export function buildApp() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
    trustProxy: true,
  }).withTypeProvider<ZodTypeProvider>();

  // Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Seguridad
  app.register(helmet, { contentSecurityPolicy: false });

  // Rate limit
  app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: '1 minute' });

  // CORS
  const origins = env.CORS_ORIGIN.split(',').map((s) => s.trim());
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = origins.includes(origin);
      cb(ok ? null : new Error('CORS not allowed'), ok);
    },
    credentials: useCookie,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    maxAge: 86400,
  });

  // Cookies si corresponde
  if (useCookie) {
    app.register(cookie, {
      secret: env.COOKIE_SECRET,
      hook: 'onRequest',
    });
  }

  // Rutas
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api/v1' });
  app.register(payrollRoutes);
  app.register(employeeRoutes);
  app.register(candidateRoutes);

  // Proteger árboles
  app.addHook('preHandler', async (req, reply) => {
    if (req.url.startsWith('/api/v1/payrolls') || req.url.startsWith('/api/v1/employees')) {
      await authGuard()(req, reply);
    }
  });

  // Errores
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFound);

  // Seed admin en dev
  if (!isProd) ensureSeedAdmin().catch(app.log.error.bind(app.log));

  app.ready().then(() => {
  app.log.info('\n' + app.printRoutes());
});

  return app;
}
