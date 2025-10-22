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

    // Cookie solo si está habilitado (guardar access token)
    const useCookie = env.useCookie || env.AUTH_COOKIE === 'true';
    if (useCookie) {
      const cookieName = env.cookieName || env.COOKIE_NAME || 'token';
      const isLocal = (env.CORS_ORIGIN || '').includes('http://localhost') || env.isDev;
      const secure = env.cookieSecure || (isProd && !isLocal);
      const sameSite: 'lax' | 'strict' | 'none' = secure ? 'none' : (env.cookieSameSite ?? 'lax');

      // Access token cookie (15 minutos)
      reply.setCookie(cookieName, result.accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: 15 * 60, // 15 minutos
        sameSite,
        secure,
        domain: env.cookieDomain,
      });

      // Refresh token cookie (7 días)
      reply.setCookie('refreshToken', result.refreshToken, {
        path: '/',
        httpOnly: true,
        maxAge: remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 días si remember, sino 7 días
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
      if (env.useCookie || env.AUTH_COOKIE === 'true') {
        reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
        reply.clearCookie('refreshToken', { path: '/' });
      }
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }

    const userId = (payload as any).sub;
    if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
      if (env.useCookie || env.AUTH_COOKIE === 'true') {
        reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
        reply.clearCookie('refreshToken', { path: '/' });
      }
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token subject' } });
    }

    const u = await UserModel.findById(userId).lean().exec();
    if (!u) {
      if (env.useCookie || env.AUTH_COOKIE === 'true') {
        reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
        reply.clearCookie('refreshToken', { path: '/' });
      }
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }

    return reply.status(200).send({
      id: String(u._id),
      email: u.email,
      name: (u as any).name ?? u.email,
      role: (u as any).role ?? 'user',
      tenantId: (u as any).tenantId
    });
  } catch (err: any) {
    req.log.error({ err, route: 'auth/me' }, 'auth.me failed');
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Auth me failed' } });
  }
}

export async function refreshHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    req.log.info({ route: 'auth/refresh' }, 'refresh request');

    // Obtener refresh token del body o cookie
    const body = (req as any).body as { refreshToken?: string };
    let refreshToken = body?.refreshToken;

    // Si no está en el body, intentar obtenerlo de las cookies
    if (!refreshToken && (env.useCookie || env.AUTH_COOKIE === 'true')) {
      refreshToken = req.cookies?.refreshToken;
    }

    if (!refreshToken) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Refresh token missing' } });
    }

    const result = await svc.refresh(refreshToken);
    if (!result) {
      if (env.useCookie || env.AUTH_COOKIE === 'true') {
        reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
        reply.clearCookie('refreshToken', { path: '/' });
      }
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' } });
    }

    // Actualizar cookies si está habilitado
    const useCookie = env.useCookie || env.AUTH_COOKIE === 'true';
    if (useCookie) {
      const cookieName = env.cookieName || env.COOKIE_NAME || 'token';
      const isLocal = (env.CORS_ORIGIN || '').includes('http://localhost') || env.isDev;
      const secure = env.cookieSecure || (isProd && !isLocal);
      const sameSite: 'lax' | 'strict' | 'none' = secure ? 'none' : (env.cookieSameSite ?? 'lax');

      // Nuevo access token
      reply.setCookie(cookieName, result.accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: 15 * 60, // 15 minutos
        sameSite,
        secure,
        domain: env.cookieDomain,
      });

      // Nuevo refresh token (rotación)
      reply.setCookie('refreshToken', result.refreshToken, {
        path: '/',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60, // 7 días
        sameSite,
        secure,
        domain: env.cookieDomain,
      });
    }

    return reply.status(200).send(result);
  } catch (err: any) {
    req.log.error({ err, route: 'auth/refresh' }, 'auth.refresh failed');
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Auth refresh failed' } });
  }
}

export async function logoutHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    // Intentar obtener el userId del token para limpiar el refresh token en BD
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload && (payload as any).sub) {
        await svc.logout((payload as any).sub);
      }
    }

    // Limpiar cookies
    if (env.useCookie || env.AUTH_COOKIE === 'true') {
      reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
      reply.clearCookie('refreshToken', { path: '/' });
    }

    return reply.status(200).send({ ok: true });
  } catch (err: any) {
    req.log.error({ err, route: 'auth/logout' }, 'auth.logout failed');
    // Aunque falle, limpiamos las cookies
    if (env.useCookie || env.AUTH_COOKIE === 'true') {
      reply.clearCookie(env.cookieName || env.COOKIE_NAME || 'token', { path: '/' });
      reply.clearCookie('refreshToken', { path: '/' });
    }
    return reply.status(200).send({ ok: true });
  }
}
