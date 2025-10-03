import { CandidateCreateInput, CandidateOutput, CandidateQuery, CandidateUpdateInput } from './candidate.dto.js';
import { createCandidate, deleteCandidate, getCandidate, listCandidates, updateCandidate } from './candidate.service.js';

const mapOut = (raw: any) => {
  const out = {
    id: String(raw._id ?? raw.id),
    fullName: raw.fullName,
    email: raw.email,
    phone: raw.phone ?? null,
    skills: raw.skills ?? [],
    status: raw.status,
    source: raw.source,
    createdAt: new Date(raw.createdAt).toISOString(),
    updatedAt: new Date(raw.updatedAt).toISOString(),
  };
  const v = CandidateOutput.safeParse(out);
  if (!v.success) throw new Error('Output no cumple schema');
  return out;
};

export async function getCandidates(req: any, res: any) {
  const parsed = CandidateQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'BAD_QUERY', message: 'Parámetros inválidos', details: parsed.error.flatten() } });
  const data = await listCandidates(parsed.data);
  return res.json({ items: data.items.map(mapOut), total: data.total });
}

export async function getCandidateById(req: any, res: any) {
  const doc = await getCandidate(req.params.id);
  if (!doc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidato no encontrado' } });
  return res.json(mapOut(doc));
}

export async function postCandidate(req: any, res: any) {
  const parsed = CandidateCreateInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'BAD_INPUT', message: 'Payload inválido', details: parsed.error.flatten() } });
  const created = await createCandidate(parsed.data);
  return res.status(201).json(mapOut(created));
}

export async function patchCandidate(req: any, res: any) {
  const parsed = CandidateUpdateInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'BAD_INPUT', message: 'Payload inválido', details: parsed.error.flatten() } });
  const updated = await updateCandidate(req.params.id, parsed.data);
  if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidato no encontrado' } });
  return res.json(mapOut(updated));
}

export async function removeCandidate(req: any, res: any) {
  const ok = await deleteCandidate(req.params.id);
  if (!ok) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidato no encontrado' } });
  return res.status(204).send();
}
