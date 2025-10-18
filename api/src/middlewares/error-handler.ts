import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  err: FastifyError & { statusCode?: number; validation?: unknown },
  _req: FastifyRequest,
  reply: FastifyReply
) {
  const status = err.statusCode ?? 500;
  reply.status(status).send({
    error: {
      code: err.code ?? (status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR'),
      message: err.message,
      details: err.validation ?? undefined,
    },
  });
}
