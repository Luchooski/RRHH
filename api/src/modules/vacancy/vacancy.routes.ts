import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Vacancy } from './vacancy.model.js';

/** Error genérico consistente */
const ErrorDTO = z.object({ error: z.string() });

/** DTOs de Vacante */
const VacancyOut = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['open', 'paused', 'closed']),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  seniority: z.enum(['jr', 'ssr', 'sr']).optional(),
  employmentType: z.enum(['fulltime', 'parttime', 'contract']).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
type VacancyOutT = z.infer<typeof VacancyOut>;

const VacancyListOut = z.object({
  items: z.array(VacancyOut),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const VacancyCreateIn = z.object({
  title: z.string().min(2),
  status: z.enum(['open', 'paused', 'closed']).default('open'),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  seniority: z.enum(['jr', 'ssr', 'sr']).optional(),
  employmentType: z.enum(['fulltime', 'parttime', 'contract']).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  description: z.string().optional(),
});

const VacancyPatchIn = VacancyCreateIn.partial();

/** Helpers de mapeo */
const mapVacancy = (v: any): VacancyOutT => ({
  id: String(v._id),
  title: v.title,
  status: v.status,
  companyId: v.companyId ? String(v.companyId) : undefined,
  companyName: v.companyName,
  location: v.location,
  seniority: v.seniority,
  employmentType: v.employmentType,
  salaryMin: typeof v.salaryMin === 'number' ? v.salaryMin : undefined,
  salaryMax: typeof v.salaryMax === 'number' ? v.salaryMax : undefined,
  description: v.description,
  createdAt: new Date(v.createdAt).toISOString(),
  updatedAt: new Date(v.updatedAt).toISOString(),
});

/** Checklist DTOs */
const ChecklistItemOut = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean(),
  updatedAt: z.string(),
});
const ChecklistListOut = z.object({ items: z.array(ChecklistItemOut) });

const ChecklistCreateIn = z.object({ label: z.string().min(2) });
const ChecklistPatchIn = z.object({
  label: z.string().min(2).optional(),
  done: z.boolean().optional(),
});

/** Map checklist */
const mapChecklist = (v: any) => ({
  items: (v?.checklist ?? []).map((i: any) => ({
    id: String(i._id),
    label: i.label,
    done: !!i.done,
    updatedAt: new Date(i.updatedAt).toISOString(),
  })),
});

const OkDTO = z.object({ ok: z.literal(true) });

/** Plugin de rutas */
const vacancyRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  /** LIST (paginado y filtro) */
  r.route({
    method: 'GET',
    url: '/vacancies',
    onRequest: [app.authGuard],
    schema: {
      querystring: z.object({
        status: z.enum(['open', 'paused', 'closed']).optional(),
        q: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      response: { 200: VacancyListOut },
    },
    handler: async (req) => {
      const tenantId = (req as any).user.tenantId;
      const { status, q, page, limit } = req.query;
      const filter: any = { tenantId };
      if (status) filter.status = status;
      if (q?.trim()) filter.$text = { $search: q.trim() };

      const [items, total] = await Promise.all([
        Vacancy.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Vacancy.countDocuments(filter),
      ]);

      return {
        items: items.map(mapVacancy),
        total,
        page,
        pageSize: limit,
      };
    },
  });

  /** GET by id */
  r.route({
    method: 'GET',
    url: '/vacancies/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: VacancyOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const v = await Vacancy.findOne({ _id: req.params.id, tenantId }).lean();
      if (!v) return reply.code(404).send({ error: 'Vacancy not found' });
      return mapVacancy(v);
    },
  });

  /** CREATE */
  r.route({
    method: 'POST',
    url: '/vacancies',
    onRequest: [app.authGuard],
    schema: {
      body: VacancyCreateIn,
      response: { 200: VacancyOut },
    },
    handler: async (req) => {
      const tenantId = (req as any).user.tenantId;
      const created = await Vacancy.create({ ...req.body, tenantId });
      const v = await Vacancy.findById(created._id).lean();
      return mapVacancy(v);
    },
  });

  /** PATCH */
  r.route({
    method: 'PATCH',
    url: '/vacancies/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: VacancyPatchIn,
      response: { 200: VacancyOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const updated = await Vacancy.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        req.body,
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Vacancy not found' });
      return mapVacancy(updated);
    },
  });

  /** DELETE */
  r.route({
    method: 'DELETE',
    url: '/vacancies/:id',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: OkDTO, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const res = await Vacancy.findOneAndDelete({ _id: req.params.id, tenantId }).lean();
      if (!res) return reply.code(404).send({ error: 'Vacancy not found' });
      return { ok: true as const };
    },
  });

  // =========================
  //  SUBRUTAS: CHECKLIST
  // =========================

  /** GET checklist */
  r.route({
    method: 'GET',
    url: '/vacancies/:id/checklist',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: ChecklistListOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const v = await Vacancy.findOne({ _id: req.params.id, tenantId }).lean();
      if (!v) return reply.code(404).send({ error: 'Vacancy not found' });
      return mapChecklist(v);
    },
  });

  /** POST checklist item */
  r.route({
    method: 'POST',
    url: '/vacancies/:id/checklist',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string() }),
      body: ChecklistCreateIn,
      response: { 200: ChecklistListOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const updated = await Vacancy.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { $push: { checklist: { label: req.body.label, done: false, updatedAt: new Date() } } },
        { new: true }
      ).lean();
      if (!updated) return reply.code(404).send({ error: 'Vacancy not found' });
      return mapChecklist(updated);
    },
  });

  /** PATCH checklist item */
  r.route({
    method: 'PATCH',
    url: '/vacancies/:id/checklist/:itemId',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string(), itemId: z.string() }),
      body: ChecklistPatchIn,
      response: { 200: ChecklistListOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const { id, itemId } = req.params;
      const set: any = {};
      if (typeof req.body.label !== 'undefined') set['checklist.$.label'] = req.body.label;
      if (typeof req.body.done !== 'undefined') set['checklist.$.done'] = req.body.done;
      set['checklist.$.updatedAt'] = new Date();

      const updated = await Vacancy.findOneAndUpdate(
        { _id: id, tenantId, 'checklist._id': itemId },
        { $set: set },
        { new: true }
      ).lean();

      if (!updated) return reply.code(404).send({ error: 'Vacancy or item not found' });
      return mapChecklist(updated);
    },
  });

  /** DELETE checklist item */
  r.route({
    method: 'DELETE',
    url: '/vacancies/:id/checklist/:itemId',
    onRequest: [app.authGuard],
    schema: {
      params: z.object({ id: z.string(), itemId: z.string() }),
      response: { 200: ChecklistListOut, 404: ErrorDTO },
    },
    handler: async (req, reply) => {
      const tenantId = (req as any).user.tenantId;
      const { id, itemId } = req.params;
      const updated = await Vacancy.findOneAndUpdate(
        { _id: id, tenantId },
        { $pull: { checklist: { _id: itemId as any } } },
        { new: true }
      ).lean();

      if (!updated) return reply.code(404).send({ error: 'Vacancy or item not found' });
      return mapChecklist(updated);
    },
  });
  // ---- DTOs para Notes ----
const NoteOut = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string().optional(),
  createdAt: z.string(),
});
const NotesListOut = z.object({ items: z.array(NoteOut) });

const NoteCreateIn = z.object({
  text: z.string().min(2),
  author: z.string().optional(),
});

const mapNotes = (v: any) => ({
  items: (v?.notes ?? []).map((n: any) => ({
    id: String(n._id),
    text: n.text,
    author: n.author || undefined,
    createdAt: new Date(n.createdAt).toISOString(),
  })),
});

// ============== SUBRUTAS: NOTAS ==============

// GET /vacancies/:id/notes
r.route({
  method: 'GET',
  url: '/vacancies/:id/notes',
  onRequest: [app.authGuard],
  schema: {
    params: z.object({ id: z.string() }),
    response: { 200: NotesListOut, 404: ErrorDTO },
  },
  handler: async (req, reply) => {
    const tenantId = (req as any).user.tenantId;
    const v = await Vacancy.findOne({ _id: req.params.id, tenantId }).lean();
    if (!v) return reply.code(404).send({ error: 'Vacancy not found' });
    return mapNotes(v);
  },
});

// POST /vacancies/:id/notes
r.route({
  method: 'POST',
  url: '/vacancies/:id/notes',
  onRequest: [app.authGuard],
  schema: {
    params: z.object({ id: z.string() }),
    body: NoteCreateIn,
    response: { 200: NotesListOut, 404: ErrorDTO },
  },
  handler: async (req, reply) => {
    const tenantId = (req as any).user.tenantId;
    const updated = await Vacancy.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $push: { notes: { text: req.body.text, author: req.body.author, createdAt: new Date() } } },
      { new: true }
    ).lean();
    if (!updated) return reply.code(404).send({ error: 'Vacancy not found' });
    return mapNotes(updated);
  },
});

// DELETE /vacancies/:id/notes/:noteId
r.route({
  method: 'DELETE',
  url: '/vacancies/:id/notes/:noteId',
  onRequest: [app.authGuard],
  schema: {
    params: z.object({ id: z.string(), noteId: z.string() }),
    response: { 200: NotesListOut, 404: ErrorDTO },
  },
  handler: async (req, reply) => {
    const tenantId = (req as any).user.tenantId;
    const updated = await Vacancy.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $pull: { notes: { _id: req.params.noteId as any } } },
      { new: true }
    ).lean();
    if (!updated) return reply.code(404).send({ error: 'Vacancy or note not found' });
    return mapNotes(updated);
  },
});
};

export default vacancyRoutes;
