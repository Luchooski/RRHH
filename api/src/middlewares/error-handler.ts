// api/src/middlewares/error-handler.ts
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function errorHandler(
  err: FastifyError & { name?: string },
  _req: FastifyRequest,
  reply: FastifyReply
) {
  // CastError -> 400
  if (err?.name === 'CastError') {
    return reply.status(400).send({ error: { code: 'CastError', message: 'Invalid ObjectId' } });
  }

  const status = typeof err.statusCode === 'number' && err.statusCode >= 400
    ? err.statusCode
    : 500;

  reply.status(status).send({
    error: {
      code: err.code || 'InternalError',
      message: err.message || 'Unexpected error'
    }
  });
}
