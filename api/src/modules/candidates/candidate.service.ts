import { Candidate } from './candidate.model';
import { CandidateInput } from './candidate.dto';

export async function listCandidates() {
  const docs = await Candidate.find().lean();
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

export async function updateCandidate(
  id: string,
  input: Partial<{
    name: string | undefined;
    email: string | undefined;
    role: string | undefined;
    match: number | undefined;
    status: string | undefined;
  }>
) {
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
