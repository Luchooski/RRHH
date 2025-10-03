import { CandidateModel, type CandidateDoc } from './candidate.model.js';

export type ListParams = {
  q?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
};

function toSort(sortField = 'createdAt', sortDir: 'asc' | 'desc' = 'desc') {
  return { [sortField]: sortDir === 'desc' ? -1 : 1 } as Record<string, 1 | -1>;
}

function mapDoc(doc: CandidateDoc) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email ?? undefined,
    role: doc.role,
    match: doc.match ?? 0,
    status: doc.status ?? 'new',
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function listCandidates(params: ListParams) {
  const { q, sortField, sortDir, limit = 20, skip = 0 } = params;
  const filter = q
    ? { $or: [
        { name:   { $regex: q, $options: 'i' } },
        { email:  { $regex: q, $options: 'i' } },
        { role:   { $regex: q, $options: 'i' } },
      ] }
    : {};
  const [items, total] = await Promise.all([
    CandidateModel.find(filter).sort(toSort(sortField, sortDir)).skip(skip).limit(limit).lean(),
    CandidateModel.countDocuments(filter),
  ]);
  return {
    items: items.map((d) => mapDoc(d as any)),
    total,
    limit,
    skip,
    sort: `${sortField ?? 'createdAt'}:${sortDir ?? 'desc'}`,
  };
}

export async function getCandidateById(id: string) {
  const d = await CandidateModel.findById(id).lean();
  return d ? mapDoc(d as any) : null;
}

export async function createCandidate(input: {
  name: string; email?: string; role: string; match?: number; status?: string;
}) {
  const created = await CandidateModel.create(input);
  return mapDoc(created.toObject() as any);
}

export async function updateCandidate(id: string, input: Partial<{
  name: string; email?: string; role: string; match?: number; status?: string;
}>) {
  const updated = await CandidateModel.findByIdAndUpdate(id, input, { new: true }).lean();
  return updated ? mapDoc(updated as any) : null;
}

export async function removeCandidate(id: string) {
  await CandidateModel.findByIdAndDelete(id);
  return { ok: true };
}
