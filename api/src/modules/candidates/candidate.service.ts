import { Candidate } from '../candidates/candidate.model.js';
import type { FilterQuery, SortOrder } from 'mongoose';

export async function listCandidates(params: {
  limit: number; skip: number;
  q?: string; status?: string; role?: string;
  matchMin?: number; matchMax?: number;
  createdFrom?: Date; createdTo?: Date;
  sortField: 'createdAt'|'match'|'name'|'role'|'status';
  sortDir: 'asc'|'desc';
}) {
  const { limit, skip, q, status, role, matchMin, matchMax, createdFrom, createdTo, sortField, sortDir } = params;

  const filter: FilterQuery<typeof Candidate> = {};
  if (status) filter.status = status;
  if (role) filter.role = new RegExp(role, 'i');
  if (typeof matchMin === 'number' || typeof matchMax === 'number') {
    filter.match = {};
    if (typeof matchMin === 'number') filter.match.$gte = matchMin;
    if (typeof matchMax === 'number') filter.match.$lte = matchMax;
  }
  if (createdFrom || createdTo) {
    filter.createdAt = {};
    if (createdFrom) filter.createdAt.$gte = createdFrom;
    if (createdTo)   filter.createdAt.$lte = createdTo;
  }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { role: { $regex: q, $options: 'i' } },
      { status: { $regex: q, $options: 'i' } },
    ];
  }

  // Orden dinámico
  const sort: Record<string, SortOrder> = { [sortField]: sortDir === 'asc' ? 1 : -1 };

  const docs = await Candidate.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return docs.map(m => ({
    id: String(m._id),
    name: m.name,
    email: m.email,
    role: m.role,
    match: m.match ?? 0,
    status: m.status,
    createdAt: (m.createdAt as Date).toISOString(),
    updatedAt: (m.updatedAt as Date).toISOString()
  }));
}

export async function createCandidate(input: {
  name: string; email: string; role: string; match?: number; status?: string;
}) {
  const doc = await Candidate.create(input);
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    match: doc.match ?? 0,
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
    match: m.match ?? 0,
    status: m.status,
    createdAt: (m.createdAt as Date).toISOString(),
    updatedAt: (m.updatedAt as Date).toISOString()
  };
}

export async function updateCandidate(id: string, input: Partial<{
  name: string; email: string; role: string; match?: number; status?: string;
}>) {
  const doc = await Candidate.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    match: doc.match ?? 0,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

export async function deleteCandidate(id: string) {
  const res = await Candidate.findByIdAndDelete(id);
  return !!res;
}
