import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Toolbar({ title, right, className }:{
  title: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-3',
      'rounded-2xl border border-[--color-border] bg-[--color-card] px-4 py-3',
      className,
    )}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
