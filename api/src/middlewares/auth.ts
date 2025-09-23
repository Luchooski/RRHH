import { type FastifyRequest, type FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function getTokenFromHeader(req: FastifyRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function getTokenFromCookie(req: FastifyRequest): string | null {
  // Fastify cookie plugin debe estar registrado en app.ts (ya suele estar)
  const cookieName = env.COOKIE_NAME || 'token';
  const token = req.cookies?.[cookieName];
  return token || null;
}

export function authGuard() {
  const allowHeader = env.AUTH_HEADER !== 'false';
  const allowCookie = env.AUTH_COOKIE === 'true';

  return async (req: FastifyRequest, reply: FastifyReply) => {
    let token: string | null = null;

    if (allowHeader) token = getTokenFromHeader(req);
    if (!token && allowCookie) token = getTokenFromCookie(req);

    if (!token) {
      req.log?.info({ path: req.url }, 'auth: missing token'); // log amigable
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role?: string };
      (req as any).user = { id: payload.sub, role: payload.role ?? 'hr' };
    } catch (e) {
      req.log?.warn({ err: e, path: req.url }, 'auth: invalid token');
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
  };
}
