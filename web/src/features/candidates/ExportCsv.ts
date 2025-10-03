import type { Candidate } from './schemas';

export function exportCsv(items: Candidate[]) {
  const header = ['fullName','email','phone','skills','status','source','createdAt'];
  const lines = [header.join(',')].concat(
    items.map(c =>
      [
        esc(c.fullName),
        esc(c.email),
        esc(c.phone ?? ''),
        esc(c.skills.join(' ')),
        esc(c.status),
        esc(c.source),
        esc(new Date(c.createdAt).toISOString()),
      ].join(',')
    )
  );
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'candidates.csv'; a.click();
  URL.revokeObjectURL(url);
}
function esc(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`;
}
