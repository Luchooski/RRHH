import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Candidate } from './candidate.model.js';

const ErrorDTO = z.object({ error: z.string() });

const Link = z.object({ label: z.string().optional(), url: z.string().url() });
const CandidateIn = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  seniority: z.enum(['jr', 'ssr', 'sr']).optional(),
  skills: z.array(z.string()).default([]),
  salaryExpectation: z.number().int().positive().optional(),
  resumeUrl: z.string().url().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  links: z.array(Link).default([]),
});
const CandidateOut = CandidateIn.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ListOut = z.object({
  items: z.array(CandidateOut),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

function toOut(c: any) {
  return {
    id: String(c._id),
    name: c.name,
    email: c.email,
    phone: c.phone ?? undefined,
    location: c.location ?? undefined,
    seniority: c.seniority ?? undefined,
    skills: c.skills ?? [],
    salaryExpectation: c.salaryExpectation ?? undefined,
    resumeUrl: c.resumeUrl ?? undefined,
    notes: c.notes ?? undefined,
    tags: c.tags ?? [],
    links: c.links ?? [],
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: new Date(c.updatedAt).toISOString(),
  };
}

const candidateRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // LIST
  r.route({
    method: 'GET',
    url: '/candidates',
    schema: {
      querystring: z.object({
        q: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        seniority: z.enum(['jr','ssr','sr']).optional(),
      }),
      response: { 200: ListOut },
    },
    handler: async (req) => {
      const { q, page, limit, seniority } = req.query;
      const cond: any = {};
      if (q?.trim()) {
        cond.$text = { $search: q.trim() };
      }
      if (seniority) cond.seniority = seniority;

      const [items, total] = await Promise.all([
        Candidate.find(cond).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Candidate.countDocuments(cond),
      ]);

      return { items: items.map(toOut), total, page, limit };
    },
  });

  // GET ONE
  r.route({
    method: 'GET',
    url: '/candidates/:id',
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: CandidateOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const c = await Candidate.findById(req.params.id).lean();
      if (!c) return reply.code(404).send({ error: 'Candidate not found' });
      return toOut(c);
    },
  });

  // CREATE
  r.route({
    method: 'POST',
    url: '/candidates',
    schema: {
      body: CandidateIn,
      response: { 200: CandidateOut },
    },
    handler: async (req) => {
      const created = await Candidate.create(req.body);
      return toOut(created);
    },
  });

  // UPDATE (PUT completo)
  r.route({
    method: 'PUT',
    url: '/candidates/:id',
    schema: {
      params: z.object({ id: z.string() }),
      body: CandidateIn,
      response: { 200: CandidateOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const updated = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      return toOut(updated);
    },
  });

  // DELETE
  r.route({
    method: 'DELETE',
    url: '/candidates/:id',
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: z.object({ ok: z.literal(true) }), 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const del = await Candidate.findByIdAndDelete(req.params.id).lean();
      if (!del) return reply.code(404).send({ error: 'Candidate not found' });
      return { ok: true as const };
    },
  });
};

export default candidateRoutes;
