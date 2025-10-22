import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Interview } from './interview.model.js';
import {
  InterviewCreateInput, InterviewUpdateInput, InterviewQuery,
  InterviewOutput, InterviewListOutput
} from './interview.dto.js';
import { ErrorDTO, OkDTO } from '../_shared/dto.js';

const toOut = (d: any) => ({
  id: String(d._id),
  title: d.title,
  start: new Date(d.start).toISOString(),
  end: new Date(d.end).toISOString(),
  candidateId: d.candidateId,
  vacancyId: d.vacancyId,
  location: d.location ?? null,
  notes: d.notes ?? null,
  status: d.status,
  createdAt: new Date(d.createdAt).toISOString(),
  updatedAt: new Date(d.updatedAt).toISOString(),
});

export const interviewRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // LIST (rango opcional)
  r.route({
    method: 'GET',
    url: '/interviews',
    onRequest: [app.authGuard],
    schema: {
      querystring: InterviewQuery,
      response: { 200: InterviewListOutput },
      tags: ['interviews'],
    },
    handler: async (req) => {
      const tenantId = (req as any).user.tenantId;
      const { from, to, candidateId, vacancyId, page, limit } = req.query;
      const filter: any = { tenantId };
      if (from || to) {
        filter.start = {};
        if (from) filter.start.$gte = new Date(from);
        if (to) filter.start.$lte = new Date(to);
      }
      if (candidateId) filter.candidateId = candidateId;
      if (vacancyId) filter.vacancyId = vacancyId;

      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        Interview.find(filter).sort({ start: 1 }).skip(skip).limit(limit).lean(),
        Interview.countDocuments(filter),
      ]);
      return { items: items.map(toOut), total, page, pageSize: limit };
    },
  });

  // GET by id (opcional si lo necesitás)
  r.route({
    method: 'GET',
    url: '/interviews/:id',
    onRequest: [app.authGuard],
    schema: { params: z.object({ id: z.string() }), response: { 200: InterviewOutput, 404: ErrorDTO } },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const it = await Interview.findOne({ _id: req.params.id, tenantId }).lean();
      if (!it) return reply.code(404).send({ error: 'Not found' });
      return toOut(it);
    }
  });

  // CREATE
  r.route({
    method: 'POST',
    url: '/interviews',
    onRequest: [app.authGuard],
    schema: { body: InterviewCreateInput, response: { 201: InterviewOutput } },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const created = await Interview.create({
        ...req.body,
        tenantId,
        start: new Date(req.body.start),
        end: new Date(req.body.end),
      });
      return reply.code(201).send(toOut(created));
    },
  });

  // UPDATE
  r.route({
    method: 'PATCH',
    url: '/interviews/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: InterviewUpdateInput,
      response: { 200: InterviewOutput, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const changes: any = { ...req.body };
      if (changes.start) changes.start = new Date(changes.start);
      if (changes.end) changes.end = new Date(changes.end);
      const updated = await Interview.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { $set: changes },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Not found' });
      return toOut(updated);
    },
  });

  // DELETE
  r.route({
    method: 'DELETE',
    url: '/interviews/:id',
    onRequest: [app.authGuard],
    schema: { params: z.object({ id: z.string() }), response: { 200: OkDTO, 404: ErrorDTO } },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const deleted = await Interview.findOneAndDelete({ _id: req.params.id, tenantId }).lean();
      if (!deleted) return reply.code(404).send({ error: 'Not found' });
      return { ok: true as const };
    },
  });
};

export default interviewRoutes;
