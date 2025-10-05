import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function PeriodPicker({
  className, label = 'Período', ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs text-[--color-muted]">{label}</label>
      <input
        type="month"
        className="w-full rounded-lg border border-[--color-border] bg-[--color-card] text-[--color-fg] px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        {...props}
      />
    </div>
  );
}
