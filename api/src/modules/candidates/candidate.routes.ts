import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  CandidateInputSchema,
  CandidateIdSchema,
  CandidateOutputSchema,
  CandidatesListSchema
} from './candidate.dto';
import { createCandidate, deleteCandidate, listCandidates, updateCandidate } from './candidate.service';
import { z } from 'zod';

export async function candidateRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/candidates',
    schema: { response: { 200: CandidatesListSchema } },
    handler: async () => listCandidates()
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/candidates',
    schema: { body: CandidateInputSchema, response: { 201: CandidateOutputSchema } },
    handler: async (req, reply) => {
      const created = await createCandidate(req.body);
      reply.code(201).send(created);
    }
  });

 type CandidateUpdate = z.input<typeof CandidateInputSchema.partial()>;


app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/api/v1/candidates/:id',
    schema: {
      params: CandidateIdSchema,
      body: CandidateInputSchema.partial(),
      response: { 200: CandidateOutputSchema.nullable() }
    },
    handler: async (req) => {
      const body = req.body as CandidateUpdate;
      return updateCandidate(req.params.id, body);
    }
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/api/v1/candidates/:id',
    schema: { params: CandidateIdSchema, response: { 200: { success: { type: 'boolean' } } } },
    handler: async (req) => ({ success: await deleteCandidate(req.params.id) })
  });
}

