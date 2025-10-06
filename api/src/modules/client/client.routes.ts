import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Client } from './client.model.js';
import {
  ClientCreateInput,
  ClientUpdateInput,
  ClientOutput,
  ClientListQuery,
  ClientListOutput,
} from './client.dto.js';
import { ErrorDTO, OkDTO } from '../_shared/dto.js';
import { z } from 'zod';

function toOut(d: any) {
  return {
    id: String(d._id),
    name: d.name,
    industry: d.industry,
    size: d.size,
    contactName: d.contactName,
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone ?? null,
    notes: d.notes ?? null,
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  };
}

export const clientRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // LIST
  r.route({
    method: 'GET',
    url: '/clients',
    schema: {
      querystring: ClientListQuery,
      response: { 200: ClientListOutput },
      tags: ['clients'],
    },
    handler: async (req) => {
      const { q, size, industry, page, limit } = req.query;
      const filter: any = {};
      if (q) {
        const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape RegExp
        filter.$or = [
          { name: re },
          { industry: re },
          { contactName: re },
          { contactEmail: re },
        ];
      }
      if (size) filter.size = size;
      if (industry && industry !== 'Todos') filter.industry = industry;

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Client.countDocuments(filter),
      ]);

      return {
        items: items.map(toOut),
        total,
        page,
        pageSize: limit,
      };
    },
  });

  // GET BY ID
  r.route({
    method: 'GET',
    url: '/clients/:id',
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: ClientOutput, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const c = await Client.findById(req.params.id).lean();
      if (!c) return reply.code(404).send({ error: 'Not found' });
      return toOut(c);
    },
  });

  // CREATE
  r.route({
    method: 'POST',
    url: '/clients',
    schema: {
      body: ClientCreateInput,
      response: { 201: ClientOutput },
    },
    handler: async (req, reply) => {
      const created = await Client.create(req.body);
      return reply.code(201).send(toOut(created));
    },
  });

  // UPDATE (PATCH)
  r.route({
    method: 'PATCH',
    url: '/clients/:id',
    schema: {
      params: z.object({ id: z.string() }),
      body: ClientUpdateInput,
      response: { 200: ClientOutput, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const updated = await Client.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Not found' });
      return toOut(updated);
    },
  });

  // DELETE
  r.route({
    method: 'DELETE',
    url: '/clients/:id',
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: OkDTO, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const deleted = await Client.findByIdAndDelete(req.params.id).lean();
      if (!deleted) return reply.code(404).send({ error: 'Not found' });
      return { ok: true as const };
    },
  });
};

export default clientRoutes;
