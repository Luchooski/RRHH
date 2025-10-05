// api/src/modules/candidates/candidate.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Candidate } from './candidate.model.js'; // ajusta si tu path difiere

const CandidateDTO = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  match: z.number(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ListOut = z.object({
  items: z.array(CandidateDTO),
  total: z.number().int().nonnegative(),
});

function mapOut(doc: any) {
  return {
    id: String(doc.id ?? doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    match: doc.match,
    status: doc.status,
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date(doc.createdAt).toISOString(),
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date(doc.updatedAt).toISOString(),
  };
}

const candidateRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // LIST
  r.route({
    method: 'GET',
    url: '/candidates',
    schema: { response: { 200: ListOut } },
    handler: async () => {
      const items = await Candidate.find().sort({ createdAt: -1 }).lean({ virtuals: true });
      const total = await Candidate.countDocuments({});
      return { items: items.map(mapOut), total };
    },
  });

  // DETAIL
  r.route({
    method: 'GET',
    url: '/candidates/:id',
    schema: { response: { 200: CandidateDTO, 404: z.object({ error: z.string() }) } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!Types.ObjectId.isValid(id)) return reply.code(404).send({ error: 'Not found' });
      const found = await Candidate.findById(id).lean({ virtuals: true });
      if (!found) return reply.code(404).send({ error: 'Not found' });
      return mapOut(found);
    },
  });

  // CREATE
  r.route({
    method: 'POST',
    url: '/candidates',
    schema: {
      body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.string(),
        match: z.number().min(0).max(100),
        status: z.string().default('Nuevo'),
      }),
      response: { 200: CandidateDTO },
    },
    handler: async (req) => {
      const doc = await Candidate.create(req.body);
      return mapOut(doc.toObject({ virtuals: true }));
    },
  });

  // UPDATE (PATCH)
  r.route({
    method: 'PATCH',
    url: '/candidates/:id',
    schema: {
      body: z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.string().optional(),
        match: z.number().min(0).max(100).optional(),
        status: z.string().optional(),
      }),
      response: { 200: CandidateDTO, 404: z.object({ error: z.string() }) },
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!Types.ObjectId.isValid(id)) return reply.code(404).send({ error: 'Not found' });
      const updated = await Candidate.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true })
        .lean({ virtuals: true });
      if (!updated) return reply.code(404).send({ error: 'Not found' });
      return mapOut(updated);
    },
  });

  // DELETE
  r.route({
    method: 'DELETE',
    url: '/candidates/:id',
    schema: { response: { 200: z.object({ ok: z.boolean() }), 404: z.object({ error: z.string() }) } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!Types.ObjectId.isValid(id)) return reply.code(404).send({ error: 'Not found' });
      const res = await Candidate.findByIdAndDelete(id);
      if (!res) return reply.code(404).send({ error: 'Not found' });
      return { ok: true };
    },
  });
};

export { candidateRoutes };
export default candidateRoutes;
