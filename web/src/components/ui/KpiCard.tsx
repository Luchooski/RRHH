import type { ReactNode } from 'react';

type Tone = 'primary' | 'green' | 'amber' | 'purple';

type Props = {
  label: string;
  value: number | string;
  icon?: ReactNode;
  tone?: Tone;
  subtitle?: string;
  className?: string;
};

const toneRing: Record<Tone, string> = {
  primary: 'bg-blue-600/10 text-blue-600 ring-blue-500/30 dark:text-blue-400',
  green:   'bg-emerald-600/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400',
  amber:   'bg-amber-600/10 text-amber-600 ring-amber-500/30 dark:text-amber-400',
  purple:  'bg-violet-600/10 text-violet-600 ring-violet-500/30 dark:text-violet-400',
};

export function KpiCard({ label, value, icon, tone = 'primary', subtitle, className }: Props) {
  return (
    <div
      className={[
        'rounded-2xl border shadow-sm',
        'bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm',
        'border-zinc-200/80 dark:border-white/10',
        'p-4', className ?? '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-wide text-[--color-muted]">{label}</div>
          <div className="text-2xl font-semibold leading-tight">{value}</div>
          {subtitle && <div className="text-xs text-[--color-muted] mt-1">{subtitle}</div>}
        </div>
        {icon && (
          <div
            className={[
              'inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1',
              toneRing[tone],
            ].join(' ')}
            aria-hidden
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
