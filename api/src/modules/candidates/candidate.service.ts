import { Candidate } from './candidate.model.js';
import { CandidateInput, CandidateUpdate } from './candidate.dto.js';
import type { FilterQuery } from 'mongoose';

export async function listCandidates(limit = 50, skip = 0, q?: string, status?: string) {
  const filter: FilterQuery<typeof Candidate> = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { role: { $regex: q, $options: 'i' } },
    ];
  }
  const docs = await Candidate.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return docs.map(m => ({
    id: String(m._id),
    name: m.name,
    email: m.email,
    role: m.role,
    match: m.match,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString()
  }));
}

export async function createCandidate(input: CandidateInput) {
  const doc = await Candidate.create(input);
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    match: doc.match,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

export async function getCandidateById(id: string) {
  const m = await Candidate.findById(id).lean();
  if (!m) return null;
  return {
    id: String(m._id),
    name: m.name,
    email: m.email,
    role: m.role,
    match: m.match,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString()
  };
}

export async function updateCandidate(id: string, input: CandidateUpdate) {
  const doc = await Candidate.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    match: doc.match,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}
export async function deleteCandidate(id: string) {
  const res = await Candidate.findByIdAndDelete(id);
  return !!res;
}
