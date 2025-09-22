import type { FastifyInstance } from 'fastify';
import { loginHandler } from './auth.controller.js';

export default async function authRoutes(app: FastifyInstance) {
  // Importante: SIN /api/v1 acá (ya lo pusimos en app.ts)
  app.post('/auth/login', loginHandler);
}
