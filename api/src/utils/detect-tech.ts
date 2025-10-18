const TECH = [
  'react','typescript','node','express','fastify','mongodb','mongoose',
  'tailwind','aws','docker','kubernetes','jest','cypress','next.js','vite'
];
export function detectTechnologies(text: string): string[] {
  const low = text.toLowerCase();
  const out = new Set<string>();
  for (const t of TECH) if (low.includes(t)) out.add(t);
  return [...out];
}
