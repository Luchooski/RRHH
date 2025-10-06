import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Application } from './application.model.js';
import { ApplicationDTO, ApplicationCreateInput } from './application.dto.js';

export const applicationRoutes: FastifyPluginAsync = async (app) => {
  const ErrorDTO = z.object({ error: z.string() });
  const r = app.withTypeProvider<ZodTypeProvider>();
  const map = (a: any) => ({
    id: String(a._id),
    candidateId: String(a.candidateId),
    vacancyId: String(a.vacancyId),
    status: a.status,
    notes: a.notes ?? null,
    createdAt: new Date(a.createdAt).toISOString(),
    updatedAt: new Date(a.updatedAt).toISOString(),
  });

  r.route({
    method: 'POST',
    url: '/applications',
    schema: { body: ApplicationCreateInput, response: { 200: ApplicationDTO } },
    handler: async (req) => {
      const created = await Application.create(req.body);
      const found = await Application.findById(created._id).lean({ virtuals: true });
      return map(found);
    }
  });

  r.route({
    method: 'GET',
    url: '/applications',
    schema: { response: { 200: z.object({ items: z.array(ApplicationDTO), total: z.number() }) } },
    handler: async () => {
      const items = await Application.find().sort({ createdAt: -1 }).lean();
      return { items: items.map(map), total: items.length };
    }
  });
  r.route({
  method: 'PATCH',
  url: '/applications/:id',
  schema: {
    body: z.object({ status: z.enum(['sent','interview','feedback','offer','hired','rejected']) }),
    response: {
      200: z.object({ id: z.string() }),
      404: ErrorDTO
    }
  },
  handler: async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const updated = await Application.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!updated) return reply.code(404).send({ error: 'Not found' });
    return { id: String(updated._id) };
  }
});
};
