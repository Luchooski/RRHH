import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { loginHandler, meHandler, logoutHandler } from './auth.controller.js';

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

  app.post('/auth/logout', {
  schema: { response: { 200: z.object({ ok: z.boolean() }) } },
  handler: logoutHandler,
});
}
