import { type FastifyRequest, type FastifyReply } from 'fastify';
import { env, isProd } from '../../config/env.js';
import * as svc from './auth.service.js';
import { extractToken, verifyToken } from '../../middlewares/auth.js';
import { UserModel } from '../user/user.model.js';
import mongoose from 'mongoose';

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req as any).body as { email?: string; password?: string };
    req.log.info({ route: 'auth/login', email: body?.email }, 'login request');

    const email = (body?.email || '').trim();
    const password = body?.password || '';
    if (!email || !password) {
      return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Email and password are required' } });
    }

    const result = await svc.login({ email, password });
    if (!result) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });

    if (env.AUTH_COOKIE === 'true') {
      const cookieName = env.COOKIE_NAME || 'token';
      const isLocal = (env.CORS_ORIGIN || '').includes('http://localhost');
      const secure = isProd && !isLocal;
      reply.setCookie(cookieName, result.token, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 8,
        sameSite: secure ? 'none' : 'lax',
        secure,
      });
    }

    return reply.status(200).send(result);
  } catch (err: any) {
    req.log.error({ err, route: 'auth/login' }, 'auth.login failed');
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Auth login failed' } });
  }
}

export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    req.log.info({ route: 'auth/me' }, 'me request');

    const token = extractToken(req);
    if (!token) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });

    const payload = verifyToken(token);
    if (!payload) {
      if (env.AUTH_COOKIE === 'true') reply.clearCookie(env.COOKIE_NAME || 'token', { path: '/' });
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }

    const userId = (payload as any).sub;
    if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
      if (env.AUTH_COOKIE === 'true') reply.clearCookie(env.COOKIE_NAME || 'token', { path: '/' });
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token subject' } });
    }

    const u = await UserModel.findById(userId).lean().exec();
    if (!u) {
      if (env.AUTH_COOKIE === 'true') reply.clearCookie(env.COOKIE_NAME || 'token', { path: '/' });
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }

    return reply.status(200).send({ id: String(u._id), email: u.email, role: (u as any).role ?? 'user' });
  } catch (err: any) {
    req.log.error({ err, route: 'auth/me' }, 'auth.me failed');
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Auth me failed' } });
  }
}

export async function logoutHandler(_req: FastifyRequest, reply: FastifyReply) {
  if (env.AUTH_COOKIE === 'true') {
    reply.clearCookie(env.COOKIE_NAME || 'token', { path: '/' });
  }
  return reply.status(200).send({ ok: true });
}
