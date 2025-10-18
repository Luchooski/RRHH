import { type FastifyRequest, type FastifyReply } from 'fastify';
import { env, isProd } from '../../config/env.js';
import * as svc from './auth.service.js';
import { extractToken, verifyToken } from '../../middlewares/auth.js';
import { UserModel } from '../user/user.model.js';
import mongoose from 'mongoose';

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req as any).body as { email?: string; password?: string; remember?: boolean };
    req.log.info({ route: 'auth/login', email: body?.email }, 'login request');

    const email = (body?.email || '').trim();
    const password = body?.password || '';
    const remember = Boolean(body?.remember);
    if (!email || !password) {
      return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Email and password are required' } });
    }

    const result = await svc.login({ email, password });
    if (!result) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });

    // Cookie solo si está habilitado
    const useCookie = env.useCookie || env.AUTH_COOKIE === 'true';
    if (useCookie) {
      const cookieName = env.cookieName || env.COOKIE_NAME || 'token';
      const isLocal = (env.CORS_ORIGIN || '').includes('http://localhost') || env.isDev;
      const secure = env.cookieSecure || (isProd && !isLocal);
      // Si secure=true y necesitás third-party, sameSite debe ser 'none'; sino, usá el del env (minúsculas)
      const sameSite: 'lax' | 'strict' | 'none' = secure ? 'none' : (env.cookieSameSite ?? 'lax');
      reply.setCookie(cookieName, result.token, {
        path: '/',
        httpOnly: true,
        maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
        //sameSite: secure ? 'none' : (env.cookieSameSite ?? 'lax'),
        sameSite,
        secure,
        domain: env.cookieDomain,
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
      if (env.useCookie || env.AUTH_COOKIE === 'true') reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }

    const userId = (payload as any).sub;
    if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
      if (env.useCookie || env.AUTH_COOKIE === 'true') reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token subject' } });
    }

    const u = await UserModel.findById(userId).lean().exec();
    if (!u) {
      if (env.useCookie || env.AUTH_COOKIE === 'true') reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }

    return reply.status(200).send({ id: String(u._id), email: u.email, role: (u as any).role ?? 'user' });
  } catch (err: any) {
    req.log.error({ err, route: 'auth/me' }, 'auth.me failed');
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Auth me failed' } });
  }
}

export async function logoutHandler(_req: FastifyRequest, reply: FastifyReply) {
  if (env.useCookie || env.AUTH_COOKIE === 'true') {
    reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
  }
  return reply.status(200).send({ ok: true });
}
