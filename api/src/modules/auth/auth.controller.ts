import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { LoginInput, LoginOutput, MeOutput } from './auth.dto.js';
import * as svc from './auth.service.js';
import { UserModel } from '../user/user.model.js';

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = LoginInput.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Invalid payload' } });
  }
  const res = await svc.login(parsed.data);
  if (!res) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  return reply.status(200).send(LoginOutput.parse(res));
}

// 👇 NUEVO
export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any)?.user?.id as string | undefined;
  if (!userId) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  const u = await UserModel.findById(userId).lean().exec();
  if (!u) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  return reply.status(200).send(MeOutput.parse({ id: String(u._id), email: u.email, role: u.role }));
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', loginHandler);
}
