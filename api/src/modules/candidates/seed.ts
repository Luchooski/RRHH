import { Candidate } from './candidate.model.js';

const skillsPool = ['react','node','typescript','mongodb','express','tailwind','aws','jest','docker'];

export async function seedCandidates(req: any, res: any) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Seed solo en desarrollo' } });
  }
  const count = Number(req.query.count ?? 50);
  const docs = Array.from({ length: count }).map((_, i) => ({
    fullName: `Candidato ${i + 1}`,
    email: `candidato${i + 1}@example.com`,
    phone: `+54 9 351 ${String(100000 + i).padStart(6, '0')}`,
    skills: sample(skillsPool, 2 + Math.floor(Math.random() * 3)),
    status: pick(['applied','screening','interview','offer','hired','rejected']),
    source: 'import',
    notes: null,
  }));
  await Candidate.insertMany(docs, { ordered: false });
  return res.status(201).json({ ok: true, inserted: docs.length });
}

function sample<T>(arr: T[], n: number): T[] {
  return arr.slice().sort(() => 0.5 - Math.random()).slice(0, n);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
