import 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: typeof env;
    authGuard: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
