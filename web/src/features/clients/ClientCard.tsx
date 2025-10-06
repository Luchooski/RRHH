import type { ReactNode } from 'react';
import { Building2, Mail, Phone } from 'lucide-react';

type Props = {
  name: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  right?: ReactNode; // acciones (botones)
};

const sizeLabel: Record<NonNullable<Props['size']>, string> = {
  small: 'Pequeña',
  medium: 'Mediana',
  large: 'Grande'
};

export default function ClientCard({
  name, industry, size, contactName, contactEmail, contactPhone, right
}: Props) {
  return (
    <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10">
            <Building2 className="size-5 opacity-80" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{name}</div>
            <div className="text-xs text-[--color-muted] truncate">{industry ?? '—'}</div>
          </div>
        </div>
        {right}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {size && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20">
            {sizeLabel[size]}
          </span>
        )}
        {contactName && (
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-400/20">
            {contactName}
          </span>
        )}
        {contactEmail && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-violet-600/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/20">
            <Mail className="size-3" /> {contactEmail}
          </span>
        )}
        {contactPhone && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20">
            <Phone className="size-3" /> {contactPhone}
          </span>
        )}
      </div>
    </div>
  );
}
