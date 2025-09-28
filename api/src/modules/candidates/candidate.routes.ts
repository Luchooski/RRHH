import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  CandidateInputSchema,
  CandidateIdSchema,
  CandidateOutputSchema,
  CandidatesListSchema,
  CandidateQuerySchema,
  CandidateUpdateSchema,
} from './candidate.dto.js';
import { z } from 'zod';
import { authGuard } from '../../middlewares/auth.js';
import {
  listCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from './candidate.service.js';

export async function candidateRoutes(app: FastifyInstance) {
  // GET /api/v1/candidates (búsqueda avanzada)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/candidates',
    schema: {
      querystring: CandidateQuerySchema,
      response: { 200: CandidatesListSchema },
    },
    preHandler: authGuard(),
    handler: async (req) => {
      const q = req.query as z.infer<typeof CandidateQuerySchema>;
      // listCandidates AHORA espera UN objeto con todos los filtros
      return listCandidates({
        limit: q.limit,
        skip: q.skip,
        q: q.q,
        status: q.status,
        role: q.role,
        matchMin: q.matchMin,
        matchMax: q.matchMax,
        createdFrom: q.createdFrom, // ya viene coerceado a Date por Zod
        createdTo: q.createdTo,
        sortField: q.sortField,
        sortDir: q.sortDir,
      });
    },
  });

  // GET /api/v1/candidates/:id
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, response: { 200: CandidateOutputSchema.nullable() } },
    preHandler: authGuard(),
    handler: async (req) => {
      const { id } = req.params as z.infer<typeof CandidateIdSchema>;
      return getCandidateById(id);
    },
  });

  // POST /api/v1/candidates
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/candidates',
    schema: { body: CandidateInputSchema, response: { 201: CandidateOutputSchema } },
    preHandler: authGuard(),
    handler: async (req, reply) => {
      const body = req.body as z.infer<typeof CandidateInputSchema>;
      const created = await createCandidate(body);
      reply.code(201);
      return created;
    },
  });

  // PATCH /api/v1/candidates/:id
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, body: CandidateUpdateSchema, response: { 200: CandidateOutputSchema.nullable() } },
    preHandler: authGuard(),
    handler: async (req) => {
      const { id } = req.params as z.infer<typeof CandidateIdSchema>;
      const body = req.body as z.infer<typeof CandidateUpdateSchema>;
      return updateCandidate(id, body);
    },
  });

  // DELETE /api/v1/candidates/:id
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, response: { 200: z.object({ success: z.boolean() }) } },
    preHandler: authGuard(),
    handler: async (req) => {
      const { id } = req.params as z.infer<typeof CandidateIdSchema>;
      return { success: await deleteCandidate(id) };
    },
  });
}
