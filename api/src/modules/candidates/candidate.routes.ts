import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  CandidateInputSchema,
  CandidateIdSchema,
  CandidateOutputSchema,
  CandidatesListSchema,
  CandidateQuerySchema,
  CandidateUpdateSchema
} from './candidate.dto.js';
import { createCandidate, deleteCandidate, listCandidates, updateCandidate, getCandidateById } from './candidate.service.js';
import { z } from 'zod';
import { authGuard } from '../../middlewares/auth.js';

export async function candidateRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/candidates',
    schema: { querystring: CandidateQuerySchema, response: { 200: CandidatesListSchema } },
    preHandler: authGuard(),
    handler: async (req) => {
      const { limit, skip, q, status } = req.query as z.infer<typeof CandidateQuerySchema>;
      return listCandidates(limit, skip, q, status);
    }
  });

    // NUEVO: Get by id
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, response: { 200: CandidateOutputSchema.nullable() } },
    preHandler: authGuard(),
    handler: async (req) => getCandidateById((req.params as { id: string }).id)
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/candidates',
    schema: { body: CandidateInputSchema, response: { 201: CandidateOutputSchema } },
    preHandler: authGuard(),
    handler: async (req, reply) => {
      const created = await createCandidate(req.body);
      reply.code(201).send(created);
    }
  });

app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, body: CandidateUpdateSchema, response: { 200: CandidateOutputSchema.nullable() } },
    preHandler: authGuard(),
    handler: async (req) => updateCandidate((req.params as { id: string }).id, req.body as z.infer<typeof CandidateUpdateSchema>)
  });

    app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, body: CandidateUpdateSchema, response: { 200: CandidateOutputSchema.nullable() } },
    preHandler: authGuard(),
    handler: async (req) => updateCandidate((req.params as { id: string }).id, req.body as z.infer<typeof CandidateUpdateSchema>)
   });

   app.withTypeProvider<ZodTypeProvider>().route({
     method: 'DELETE',
     url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, response: { 200: z.object({ success: z.boolean() }) } },
    preHandler: authGuard(),
    handler: async (req) => ({ success: await deleteCandidate((req.params as { id: string }).id) })
  });
}

