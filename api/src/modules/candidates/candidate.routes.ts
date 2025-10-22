import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Candidate } from './candidate.model.js';
import { CandidateCreateInput, CandidateUpdateInput, CandidateQuery, CandidateOut, Stage } from './candidate.dto.js';
import { detectTechnologies } from '../../utils/detect-tech.js';
import mammoth from 'mammoth';
import fs from 'node:fs/promises';
import path from 'node:path';

// Mapeo de valores legacy a nuevos valores
const statusLegacyMap: Record<string, any> = {
  'Activo': 'new',
  'En Proceso': 'screening',
  'Entrevista': 'interview',
  'Oferta': 'offer',
  'Contratado': 'hired',
  'Rechazado': 'rejected'
};

// Función helper para convertir documento de DB a DTO
function toOut(c: any): CandidateOut {
  // Normalizar status legacy
  let normalizedStatus = c.status;
  if (c.status && statusLegacyMap[c.status]) {
    normalizedStatus = statusLegacyMap[c.status];
  }
  
  const out = {
    id: String(c._id),
    name: c.name,
    email: c.email,
    phone: c.phone ?? undefined,
    city: c.city ?? undefined,
    country: c.country ?? undefined,
    seniority: c.seniority ?? undefined,
    skills: c.skills ?? [],
    languages: c.languages ?? [],
    salary: c.salary ?? undefined,
    avatarUrl: c.avatarUrl ?? undefined,
    resume: c.resume ? {
      filename: c.resume.filename,
      mimetype: c.resume.mimetype,
      size: c.resume.size,
      url: c.resume.url
    } : undefined,
    notes: c.notes ?? undefined,
    tags: c.tags ?? [],
    links: c.links ?? [],
    status: normalizedStatus ?? 'new', // default a 'new' si no hay status
    pipelineHistory: (c.pipelineHistory ?? []).map((p: any) => ({
      ...p,
      at: new Date(p.at).toISOString()
    })),
    comments: (c.comments ?? []).map((p: any) => ({
      ...p,
      at: new Date(p.at).toISOString()
    })),
    reminders: (c.reminders ?? []).map((p: any) => ({
      ...p,
      at: new Date(p.at).toISOString()
    })),
    customFields: c.customFields ?? undefined,
    archivedAt: c.archivedAt ? new Date(c.archivedAt).toISOString() : null,
    source: c.source,
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: new Date(c.updatedAt).toISOString()
  };
  const parsed = CandidateOut.safeParse(out);
  if (!parsed.success) {
    console.error('❌ Schema validation error:', JSON.stringify(parsed.error.format(), null, 2));
    console.error('📦 Data being validated:', JSON.stringify(out, null, 2));
    throw new Error(`Output schema mismatch: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
  }
  return out;
}

const ErrorDTO = z.object({ error: z.string() });

const ListOut = z.object({
  items: z.array(CandidateOut),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

const routes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  app.log.info('candidateRoutes loaded');

  // ✅ LIST
  r.route({
    method: 'GET',
    url: '/candidates',
    onRequest: [app.authGuard],
    schema: {
      querystring: z.object({
        q: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        seniority: z.enum(['jr', 'ssr', 'sr']).optional(),
        status: z.string().optional(),
        role: z.string().optional(),
        sort: z.string().optional().default('-createdAt'),
      }),
      response: { 200: ListOut, 500: ErrorDTO },
    },
    handler: async (req, reply) => {
      try {
        const tenantId = (req as any).user.tenantId;
        const { q, page, limit, seniority } = req.query;

        const cond: any = { tenantId };
        if (q?.trim()) {
          const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          cond.$or = [{ name: re }, { email: re }, { skills: re }, { tags: re }];
        }
        if (seniority) cond.seniority = seniority;

        const [items, total] = await Promise.all([
          Candidate.find(cond).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
          Candidate.countDocuments(cond),
        ]);

        return reply.send({ items: items.map(toOut), total, page, limit });
      } catch (err: any) {
        req.log.error({ err, route: 'GET /candidates' }, 'candidates.list failed');
        return reply.code(500).send({ error: 'Internal error' });
      }
    },
  });

  // GET ONE
  r.route({
    method: 'GET',
    url: '/candidates/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: CandidateOut, 404: z.object({ error: z.string() }) }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const c = await Candidate.findOne({ _id: req.params.id, tenantId }).lean();
      if (!c) return reply.code(404).send({ error: 'Candidate not found' });
      return toOut(c);
    }
  });

  // CREATE
  r.route({
    method: 'POST',
    url: '/candidates',
    onRequest: [app.authGuard],
    schema: { body: CandidateCreateInput, response: { 201: CandidateOut } },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const body = req.body as z.infer<typeof CandidateCreateInput>;
      const created = await Candidate.create({
        ...body,
        tenantId,
        pipelineHistory: [{ stage: req.body.status ?? 'new', at: new Date(), by: 'system' }]
      });
      reply.code(201);
      return toOut(created);
    }
  });

  // UPDATE parcial
  r.route({
    method: 'PATCH',
    url: '/candidates/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: CandidateUpdateInput,
      response: { 200: CandidateOut, 404: z.object({ error: z.string() }) }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const body = req.body as z.infer<typeof CandidateUpdateInput>;
      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        body,
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      return toOut(updated);
    }
  });

  // ARCHIVE
  r.route({
    method: 'POST',
    url: '/candidates/:id/archive',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({ ok: z.literal(true), archivedAt: z.string() }),
        404: z.object({ error: z.string() })
      }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const now = new Date();
      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { archivedAt: now },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      return { ok: true as const, archivedAt: now.toISOString() };
    }
  });

  // RESTORE
  r.route({
    method: 'POST',
    url: '/candidates/:id/restore',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: z.object({ ok: z.literal(true) }), 404: z.object({ error: z.string() }) }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { archivedAt: null },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      return { ok: true as const };
    }
  });

  // DELETE
  r.route({
    method: 'DELETE',
    url: '/candidates/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({ ok: z.literal(true) }),
        404: z.object({ error: z.string() })
      }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const deleted = await Candidate.findOneAndDelete({ _id: req.params.id, tenantId });
      if (!deleted) return reply.code(404).send({ error: 'Candidate not found' });
      return { ok: true as const };
    }
  });

  // COMMENTS
  r.route({
    method: 'POST',
    url: '/candidates/:id/comments',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ by: z.string().optional(), text: z.string().min(1) }),
      response: { 201: CandidateOut, 404: z.object({ error: z.string() }) }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { $push: { comments: { ...req.body, at: new Date() } } },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      reply.code(201);
      return toOut(updated);
    }
  });

  // STAGE MOVE
  r.route({
    method: 'POST',
    url: '/candidates/:id/stage',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ stage: Stage, note: z.string().optional(), by: z.string().optional() }),
      response: { 201: CandidateOut, 404: z.object({ error: z.string() }) }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const { stage, note, by } = req.body;
      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { $set: { status: stage }, $push: { pipelineHistory: { stage, at: new Date(), by, note } } },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      reply.code(201);
      return toOut(updated);
    }
  });

  // REMINDERS
  r.route({
    method: 'POST',
    url: '/candidates/:id/reminders',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ at: z.coerce.date(), note: z.string().min(1) }),
      response: { 201: CandidateOut, 404: z.object({ error: z.string() }) }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { $push: { reminders: { ...req.body, done: false } } },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      reply.code(201);
      return toOut(updated);
    }
  });

  // UPLOAD CV
  r.route({
    method: 'POST',
    url: '/candidates/:id/upload/cv',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: CandidateOut,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
      }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const parts = req.parts();
      const file = await parts.next();
      if (!file || file.done || file.value.type !== 'file') {
        return reply.code(400).send({ error: 'No file provided' });
      }

      const f = file.value;
      const buffers: Buffer[] = [];
      for await (const chunk of f.file) buffers.push(chunk as Buffer);
      const buf = Buffer.concat(buffers);

      const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowed.includes(f.mimetype)) {
        return reply.code(400).send({ error: 'Unsupported file type (only PDF/DOCX)' });
      }

      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `${req.params.id}_cv_${Date.now()}.${f.filename.split('.').pop()}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buf);

      let textExcerpt = '';
      let technologies: string[] = [];
      let pages: number | undefined;

      if (f.mimetype === 'application/pdf') {
        const pdfMod = await import('pdf-parse' as any);
        const pdfParse = (pdfMod as any).default ?? pdfMod;
        const res = await pdfParse(buf);
        textExcerpt = (res.text ?? '').slice(0, 1200);
        pages = res.numpages;
      } else {
        const res = await mammoth.extractRawText({ buffer: buf });
        textExcerpt = (res.value ?? '').slice(0, 1200);
      }
      technologies = detectTechnologies(textExcerpt);

      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        {
          resume: {
            filename: f.filename,
            mimetype: f.mimetype,
            size: buf.length,
            url: `/uploads/${filename}`,
            analysis: { textExcerpt, technologies, pages }
          }
        },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      return toOut(updated);
    }
  });

  // UPLOAD Avatar
  r.route({
    method: 'POST',
    url: '/candidates/:id/upload/avatar',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: CandidateOut,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
      }
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const parts = req.parts();
      const file = await parts.next();
      if (!file || file.done || file.value.type !== 'file') {
        return reply.code(400).send({ error: 'No file provided' });
      }

      const f = file.value;
      const buffers: Buffer[] = [];
      for await (const chunk of f.file) buffers.push(chunk as Buffer);
      const buf = Buffer.concat(buffers);

      const allowed = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowed.includes(f.mimetype)) {
        return reply.code(400).send({ error: 'Unsupported image type' });
      }
      const max = Number(process.env.MAX_UPLOAD_MB ?? '10') * 1024 * 1024;
      if (buf.length > max) {
        return reply.code(400).send({ error: 'File too large' });
      }

      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `${req.params.id}_avatar_${Date.now()}.${f.filename.split('.').pop()}`;
      await fs.writeFile(path.join(uploadsDir, filename), buf);

      const updated = await Candidate.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { avatarUrl: `/uploads/${filename}` },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Candidate not found' });
      return toOut(updated);
    }
  });
};

export default routes;