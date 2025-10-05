import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

type Variant = 'muted' | 'ok' | 'warn';

const styles: Record<Variant, string> = {
  muted: 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700',
  ok:    'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50',
  warn:  'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50',
};

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const variant = (props as any).variant ?? 'muted';
  const { variant: _v, ...rest } = props as any;
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', styles[variant], className)}
      {...rest}
    />
  );
}
