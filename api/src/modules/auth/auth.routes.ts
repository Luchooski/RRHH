import type { FastifyInstance } from 'fastify';
import { loginHandler, meHandler } from './auth.controller.js';
import { authGuard } from '../../middlewares/auth.js';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', loginHandler);
  app.get('/auth/me', { preHandler: authGuard() }, meHandler);
}
