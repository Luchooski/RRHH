import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { loginHandler, meHandler, logoutHandler } from './auth.controller.js';

import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env, isProd } from '../../config/env.js';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', {
    schema: {
      body: z.object({ email: z.string().email(), password: z.string().min(6) }),
      response: {
        200: z.object({
          token: z.string(),
          user: z.object({ id: z.string(), email: z.string().email(), role: z.string() }),
        }),
        400: z.any(), 401: z.any(),
      },
    },
    handler: loginHandler,
  });

  app.get('/auth/me', {
    schema: {
      response: {
        200: z.object({ id: z.string(), email: z.string().email(), role: z.string() }),
        401: z.any(),
      },
    },
    handler: meHandler,
  });

  // 👇 Logout relativo (sin /api/v1)
app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/auth/logout',
    schema: { response: { 200: z.object({ ok: z.boolean() }) } },
    // no necesitamos authGuard estricto: siempre respondemos 200 y limpiamos cookie si existe
    handler: async (req, reply) => {
      // Si usás cookie httpOnly
      if (env.AUTH_COOKIE) {
        reply.clearCookie('token', {
          path: '/',
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
        });
      }
      // Para Bearer no hay estado que invalidar en server; el cliente borra el token.
      return { ok: true };
    },
      });
}