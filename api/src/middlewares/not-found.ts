import type { FastifyReply, FastifyRequest } from 'fastify';
export function notFound(_req: FastifyRequest, reply: FastifyReply) {
  reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}
