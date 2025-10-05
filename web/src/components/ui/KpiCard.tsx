import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
};

export function KpiCard({ label, value, hint, icon, tone = 'default', className }: Props) {
  const toneClasses =
    tone === 'primary'
      ? 'ring-blue-500/25 bg-blue-600/[.12]'
      : tone === 'success'
      ? 'ring-emerald-500/25 bg-emerald-600/[.12]'
      : tone === 'danger'
      ? 'ring-red-500/25 bg-red-600/[.12]'
      : tone === 'warning'
      ? 'ring-amber-500/25 bg-amber-600/[.12]'
      : 'ring-[--color-border] bg-[--color-card]';

  return (
    <div
      className={cn(
        'rounded-2xl p-4 ring-1',
        'text-[--color-fg] shadow-sm',
        tone === 'default' ? '' : 'text-white',
        toneClasses,
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon ? (
          <div className={cn('shrink-0 h-9 w-9 rounded-xl flex items-center justify-center',
            tone === 'default' ? 'bg-[--color-muted-bg]' : 'bg-black/15')}>
            {icon}
          </div>
        ) : null}
        <div className="flex-1">
          <div className="text-xs opacity-75">{label}</div>
          <div className="text-2xl font-semibold leading-tight">{value}</div>
          {hint ? <div className="text-xs opacity-80 mt-1">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}
