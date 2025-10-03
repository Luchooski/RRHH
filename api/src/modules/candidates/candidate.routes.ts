// api/src/modules/candidates/candidate.routes.ts
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  getCandidates,
  getCandidateById,
  postCandidate,
  patchCandidate,
  removeCandidate,
} from './candidate.controller.js';
import { seedCandidates } from './seed.js';

function buildCompatReqRes(request: FastifyRequest, reply: FastifyReply) {
  // Normalizamos query para compatibilidad con controllers "Express-like"
  const q: Record<string, any> = { ...(request.query as any) };

  // Compat: si llegan sortField/sortDir, armamos "sort" = "field:dir"
  const sortField = typeof q.sortField === 'string' ? q.sortField : undefined;
  const sortDir = q.sortDir === 'desc' || q.sortDir === 'asc' ? q.sortDir : undefined;
  if (!q.sort && sortField) {
    q.sort = `${sortField}:${sortDir ?? 'asc'}`; // ej: "createdAt:desc"
  }

  // Compat: aseguramos limit/skip como *string*, como haría Express (por si el controller hace parseInt)
  if (typeof q.limit !== 'string' && typeof q.limit !== 'undefined') q.limit = String(q.limit);
  if (typeof q.skip !== 'string' && typeof q.skip !== 'undefined') q.skip = String(q.skip);

  const reqLike = {
    method: request.method,
    url: request.url,
    originalUrl: request.url,
    headers: request.headers as any,
    params: request.params as any,
    query: q,
    body: request.body as any,
  };

  const resLike = {
    status(code: number) {
      reply.status(code);
      return resLike;
    },
    json(payload: any) {
      reply.send(payload);
      return resLike;
    },
    send(payload: any) {
      reply.send(payload);
      return resLike;
    },
    setHeader(name: string, value: any) {
      reply.header(name, value);
      return resLike;
    },
  };

  return { reqLike, resLike };
}

const candidateRoutes: FastifyPluginAsync = async (app) => {
  const wrap = (handler: (req: any, res: any) => any | Promise<any>) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { reqLike, resLike } = buildCompatReqRes(request, reply);
      try {
        const result = await handler(reqLike, resLike);
        if (!reply.sent && typeof result !== 'undefined') reply.send(result);
      } catch (err: any) {
        app.log.error({ err }, 'candidates handler error');
        if (!reply.sent) {
          reply.status(500).send({
            error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Unexpected error' },
          });
        }
      }
    };

  // ¡Rutas RELATIVAS! El /api/v1 lo aporta app.register(..., { prefix:'/api/v1' })
  app.get('/candidates', wrap(getCandidates));
  app.get('/candidates/:id', wrap(getCandidateById));
  app.post('/candidates', wrap(postCandidate));
  app.patch('/candidates/:id', wrap(patchCandidate));
  app.delete('/candidates/:id', wrap(removeCandidate));
  app.post('/candidates/seed', wrap(seedCandidates)); // dev only
};

export default candidateRoutes;
