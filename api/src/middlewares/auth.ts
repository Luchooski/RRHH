import { type FastifyRequest, type FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authGuard() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    }
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role?: string };
      (req as any).user = { id: payload.sub, role: payload.role ?? 'hr' };
    } catch {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
  };
}
