import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type JwtPayload = { sub: string; email: string; role: string; iat: number; exp: number };

// Extrae token desde Authorization: Bearer ... o cookie httpOnly
export function extractToken(req: FastifyRequest): string | null {
  const h = req.headers['authorization'];
  if (h && typeof h === 'string' && h.startsWith('Bearer ')) {
    return h.slice('Bearer '.length).trim();
  }
  if (env.useCookie) {
    // @fastify/cookie agrega req.cookies (tipado incluido)
    const name = env.cookieName;
    const fromCookie = (req.cookies?.[name] as string | undefined) || null;
    if (fromCookie) return fromCookie;
  }
  return null;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

// Guard opcional para rutas protegidas completas
export function authGuard() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const token = extractToken(req);
    if (!token) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
    (req as any).user = { id: payload.sub, email: payload.email, role: payload.role };
  };
}
