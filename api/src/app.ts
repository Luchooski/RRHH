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
import vacancyRoutes from './modules/vacancy/vacancy.routes.js';
import interviewRoutes from './modules/interview/interview.routes.js';
import { applicationRoutes } from './modules/application/application.routes.js';
import employeeRoutes from './modules/employee/employee.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import clientRoutes from './modules/client/client.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import tenantRoutes from './modules/tenant/tenant.routes.js';
import employeePortalRoutes from './modules/employee-portal/employee-portal.routes.js';
import attachmentRoutes from './modules/attachment/attachment.routes.js';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { authGuard } from './middlewares/auth.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function buildApp() {
  const app = Fastify({
    logger: { transport: env.isDev ? { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } } : undefined }
  });


  app.decorate('config', env);
  app.decorate('authGuard', authGuard());

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

  await app.withTypeProvider<ZodTypeProvider>().register(tenantRoutes, { prefix: '/api/v1' });
  app.log.info('tenantRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(candidateRoutes, { prefix: '/api/v1' });
  app.log.info('candidateRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(vacancyRoutes, { prefix: '/api/v1' });
  app.log.info('vacancyRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(interviewRoutes, { prefix: '/api/v1' });
  app.log.info('interviewRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(applicationRoutes, { prefix: '/api/v1' });
  app.log.info('applicationRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(employeeRoutes, { prefix: '/api/v1' });
  app.log.info('employeeRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(payrollRoutes, { prefix: '/api/v1' });
  app.log.info('payrollRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(clientRoutes, { prefix: '/api/v1' });
  app.log.info('clientRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(reportsRoutes, { prefix: '/api/v1' });
  app.log.info('reportsRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(healthRoutes, { prefix: '/api/v1' });
  app.log.info('healthRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(attachmentRoutes, { prefix: '/api/v1' });
  app.log.info('attachmentRoutes registered at /api/v1');

  await app.withTypeProvider<ZodTypeProvider>().register(employeePortalRoutes, { prefix: '/api/v1' });
  app.log.info('employeePortalRoutes registered at /api/v1');

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
