import type { FastifyInstance } from 'fastify';
import { loginHandler, meHandler } from './auth.controller.js';
import { authGuard } from '../../middlewares/auth.js';

export default async function authRoutes(app: FastifyInstance) {
  // SIN /api/v1 acá si se usa prefix en app.ts
  app.post('/auth/login', loginHandler);
  app.get('/auth/me', { preHandler: authGuard() }, meHandler);
}
