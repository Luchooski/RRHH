import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  listCandidates, getCandidateById, createCandidate, updateCandidate, removeCandidate,
} from './candidate.service.js';

const Candidate = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  role: z.string(),
  match: z.number().int().min(0).max(100),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ListQuery = z.object({
  q: z.string().optional(),
  sortField: z.string().optional().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().positive().max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

const ListOut = z.object({
  items: z.array(Candidate),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  skip: z.number().int().min(0),
  sort: z.string().optional(),
});

const CreateBody = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  role: z.string().min(2),
  match: z.number().int().min(0).max(100).optional(),
  status: z.string().optional(),
});

const UpdateBody = CreateBody.partial();

const candidateRoutes: FastifyPluginAsync = async (app) => {
  app.get('/candidates', {
    schema: { querystring: ListQuery, response: { 200: ListOut } },
    handler: async (req) => listCandidates(req.query as any),
  });

  app.get('/candidates/:id', {
    schema: { response: { 200: Candidate } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const found = await getCandidateById(id);
      if (!found) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
      return found;
    },
  });

  app.post('/candidates', {
    schema: { body: CreateBody, response: { 201: Candidate } },
    handler: async (req, reply) => {
      const created = await createCandidate(req.body as any);
      reply.code(201);
      return created;
    },
  });

  app.patch('/candidates/:id', {
    schema: { body: UpdateBody, response: { 200: Candidate } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const updated = await updateCandidate(id, req.body as any);
      if (!updated) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
      return updated;
    },
  });

  app.delete('/candidates/:id', {
    schema: { response: { 200: z.object({ ok: z.boolean() }) } },
    handler: async (req) => {
      const { id } = req.params as { id: string };
      return removeCandidate(id);
    },
  });
};

export default candidateRoutes;
