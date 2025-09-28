import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  err: FastifyError & { code?: string; validation?: unknown },
  req: FastifyRequest,
  reply: FastifyReply
) {
  const status = (err.statusCode as number) || 500;
  const name = (err as any).name || 'Error';

  req.log.error(
    {
      errName: name,
      errCode: err.code,
      status,
      route: `${req.method} ${req.url}`,
      msg: err.message,
      stack: err.stack,
    },
    'Unhandled error'
  );

  if (name === 'CastError' || name === 'ValidationError') {
    return reply.status(400).send({ error: { code: name.toUpperCase(), message: err.message || 'Bad request' } });
  }
  if ((err as any).validation) {
    return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } });
  }
  return reply.status(status).send({
    error: { code: err.code || 'INTERNAL', message: err.message || 'Unexpected error' },
  });
}
