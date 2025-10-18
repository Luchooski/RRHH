import type { CandidateOut } from '../schemas';
import { toCsv, downloadCsv } from '@/features/candidates/csv';

export function exportCandidatesCsv(rows: CandidateOut[], filename = 'candidates.csv') {
  if (!rows.length) return;
  const mapped = rows.map(r => ({
    name: r.name,
    email: r.email,
    phone: r.phone ?? '',
    location: r.location ?? '',
    seniority: r.seniority ?? '',
    skills: (r.skills ?? []).join(' '),
    tags: (r.tags ?? []).join(' '),
    salaryExpectation: r.salaryExpectation ?? '',
    resumeUrl: r.resumeUrl ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  const csv = toCsv(mapped);
  downloadCsv(filename, csv);
}
