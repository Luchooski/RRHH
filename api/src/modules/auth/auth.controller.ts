import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { LoginInput, LoginOutput } from './auth.dto.js';
import * as svc from './auth.service.js';

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = LoginInput.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Invalid payload' } });
  }
  const res = await svc.login(parsed.data);
  if (!res) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  return reply.status(200).send(LoginOutput.parse(res));
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', loginHandler);
}

