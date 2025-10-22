import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  loginHandler,
  meHandler,
  logoutHandler,
  refreshHandler,
  forgotPasswordHandler,
  resetPasswordHandler
} from './auth.controller.js';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function authRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post('/login', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        remember: z.boolean().optional()
      }),
      response: {
        200: z.object({
          accessToken: z.string(),
          refreshToken: z.string(),
          user: z.object({
            id: z.string(),
            email: z.string().email(),
            name: z.string(),
            role: z.string(),
            tenantId: z.string()
          }),
        }),
        400: z.any(),
        401: z.any(),
      },
    },
    handler: loginHandler,
  });

  r.get('/me', {
    schema: {
      response: {
        200: z.object({
          id: z.string(),
          email: z.string().email(),
          name: z.string(),
          role: z.string(),
          tenantId: z.string()
        }),
        401: z.any(),
      },
    },
    handler: meHandler,
  });

  r.post('/refresh', {
    schema: {
      body: z.object({
        refreshToken: z.string().optional()
      }).optional(),
      response: {
        200: z.object({
          accessToken: z.string(),
          refreshToken: z.string()
        }),
        401: z.any(),
      },
    },
    handler: refreshHandler,
  });

  r.post('/logout', {
    schema: { response: { 200: z.object({ ok: z.boolean() }) } },
    handler: logoutHandler,
  });

  r.post('/forgot-password', {
    schema: {
      body: z.object({
        email: z.string().email()
      }),
      response: {
        200: z.object({
          ok: z.boolean(),
          message: z.string()
        }),
        400: z.any(),
        500: z.any()
      }
    },
    handler: forgotPasswordHandler,
  });

  r.post('/reset-password', {
    schema: {
      body: z.object({
        token: z.string().min(10),
        newPassword: z.string().min(6)
      }),
      response: {
        200: z.object({
          ok: z.boolean(),
          message: z.string()
        }),
        400: z.any(),
        500: z.any()
      }
    },
    handler: resetPasswordHandler,
  });
}
