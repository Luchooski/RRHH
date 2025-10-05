import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Props = HTMLAttributes<HTMLDivElement> & { value: number };

export function StatBar({ value, className, ...rest }: Props) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      {...rest}
      className={cn('h-2 w-full rounded-full bg-[--color-muted-bg] overflow-hidden', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label="Progreso"
    >
      <div
        className={[
          'h-full transition-[width] duration-300',
          'bg-blue-500/80 dark:bg-blue-400/80',
        ].join(' ')}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
