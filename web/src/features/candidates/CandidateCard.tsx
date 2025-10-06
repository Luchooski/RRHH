import type { ReactNode } from 'react';

type Props = {
  name: string;
  email?: string;
  location?: string;
  seniority?: string;
  skills?: string[];
  right?: ReactNode; // acciones (botones)
};

function initials(n: string) {
  return n.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
}

export default function CandidateCard({ name, email, location, seniority, skills = [], right }: Props) {
  return (
    <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10 font-semibold">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{name}</div>
            <div className="text-xs text-[--color-muted] truncate">{email ?? '—'}</div>
          </div>
        </div>
        {right}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {seniority && <span className="text-xs px-2 py-1 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20">{seniority}</span>}
        {location && <span className="text-xs px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-400/20">{location}</span>}
        {skills.slice(0,4).map(s => (
          <span key={s} className="text-xs px-2 py-1 rounded-full bg-violet-600/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/20">{s}</span>
        ))}
        {skills.length > 4 && <span className="text-xs text-[--color-muted]">+{skills.length - 4}</span>}
      </div>
    </div>
  );
}
