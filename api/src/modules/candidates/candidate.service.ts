import { CandidateModel } from './candidate.model.js';
import type { CandidateCreateInput, CandidateQuery, CandidateUpdateInput } from './candidate.dto.js';

export async function listCandidates(qs: CandidateQuery) {
  const filter: any = {};
  if (qs.q) {
    filter.$or = [
      { fullName: { $regex: qs.q, $options: 'i' } },
      { email: { $regex: qs.q, $options: 'i' } },
      { skills: { $elemMatch: { $regex: qs.q, $options: 'i' } } },
    ];
  }
  if (qs.skills) {
    const wanted = qs.skills.split(',').map(s => s.trim()).filter(Boolean);
    filter.skills = { $all: wanted };
  }
  if (qs.status) {
    const statuses = qs.status.split(',').map(s => s.trim()).filter(Boolean);
    filter.status = { $in: statuses };
  }

  const sort: any = {};
  const s = qs.sort.startsWith('-') ? qs.sort.slice(1) : qs.sort;
  sort[s] = qs.sort.startsWith('-') ? -1 : 1;

  const [items, total] = await Promise.all([
    CandidateModel.find(filter).sort(sort).skip(qs.skip).limit(qs.limit).lean(),
    CandidateModel.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getCandidate(id: string) {
  const doc = await CandidateModel.findById(id).lean();
  return doc;
}

export async function createCandidate(input: CandidateCreateInput) {
  const doc = await CandidateModel.create(input);
  return doc.toObject();
}

export async function updateCandidate(id: string, input: CandidateUpdateInput) {
  const doc = await CandidateModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean();
  return doc;
}

export async function deleteCandidate(id: string) {
  const res = await CandidateModel.findByIdAndDelete(id).lean();
  return !!res;
}
