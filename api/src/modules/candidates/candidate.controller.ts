import { CandidateCreateInput, CandidateOut, CandidateQuery, CandidateUpdateInput } from './candidate.dto.js';
import { createCandidate, deleteCandidateById, getCandidateById, listCandidates, updateCandidate } from './candidate.service.js';

const mapOut = (raw: any): CandidateOut => {
  const out = {
    id: String(raw._id ?? raw.id),
    name: raw.name ?? raw.fullName, // compat si quedaron docs viejos
    email: raw.email,
    phone: raw.phone ?? undefined,
    city: raw.city ?? undefined,
    country: raw.country ?? undefined,
    seniority: raw.seniority ?? undefined,
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    salary: typeof raw.salary === 'number' ? raw.salary : undefined,
    avatarUrl: raw.avatarUrl ?? undefined,
    resume: raw.resume
      ? {
          filename: raw.resume.filename,
          mimetype: raw.resume.mimetype,
          size: raw.resume.size,
          url: raw.resume.url,
        }
      : undefined,
    notes: raw.notes ?? undefined,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    links: Array.isArray(raw.links) ? raw.links : [],
    status: raw.status ?? 'new',
    pipelineHistory: (raw.pipelineHistory ?? []).map((p: any) => ({
      stage: p?.stage ?? 'new',
      at: new Date(p?.at ?? Date.now()).toISOString(),
      by: p?.by ?? undefined,
      note: p?.note ?? undefined,
    })),
    comments: (raw.comments ?? [])
      .map((c: any) => ({
        by: c?.by ?? undefined,
        text: String(c?.text ?? ''),
        at: new Date(c?.at ?? Date.now()).toISOString(),
      }))
      .filter((c: any) => c.text.length > 0),
    reminders: (raw.reminders ?? []).map((r: any) => ({
      at: new Date(r?.at ?? Date.now()).toISOString(),
      note: String(r?.note ?? ''),
      done: Boolean(r?.done),
    })),
    customFields: raw.customFields ?? undefined,
    archivedAt: raw.archivedAt ? new Date(raw.archivedAt).toISOString() : null,
    source: raw.source ?? 'manual',
    createdAt: new Date(raw.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(raw.updatedAt ?? Date.now()).toISOString(),
  };
  const v = CandidateOut.safeParse(out);
  if (!v.success) throw new Error('Output no cumple schema');
  return v.data;
};

export async function getCandidatesHandler(req: any, res: any) {
  const parsed = CandidateQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'BAD_QUERY', message: 'Parámetros inválidos', details: parsed.error.flatten() } });
  const data = await listCandidates(parsed.data);
  return res.json({ items: data.items.map(mapOut), total: data.total });
}

export async function getCandidateByIdHandler(req: any, res: any) {
  const doc = await getCandidateById(req.params.id);
  if (!doc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidato no encontrado' } });
  return res.json(mapOut(doc));
}

export async function postCandidate(req: any, res: any) {
  const parsed = CandidateCreateInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'BAD_INPUT', message: 'Payload inválido', details: parsed.error.flatten() } });
  const created = await createCandidate(parsed.data as any);
  return res.status(201).json(mapOut(created));
}

export async function patchCandidateHandler(req: any, res: any) {
  const parsed = CandidateUpdateInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'BAD_INPUT', message: 'Payload inválido', details: parsed.error.flatten() } });
  const updated = await updateCandidate(req.params.id, parsed.data);
  if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidato no encontrado' } });
  return res.json(mapOut(updated));
}

export async function removeCandidateHandler(req: any, res: any) {
  const ok = await deleteCandidateById(req.params.id);
  if (!ok) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidato no encontrado' } });
  return res.status(204).send();
}
