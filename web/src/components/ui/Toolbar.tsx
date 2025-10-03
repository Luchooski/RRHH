import type { ReactNode } from 'react';

export function Toolbar({ title, right }: { title: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {typeof title === 'string' ? <h1 className="text-xl font-semibold">{title}</h1> : title}
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
