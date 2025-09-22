import { clsx } from 'clsx';

export default function StatusPill({ status }: { status: 'Programada' | 'Completada' | 'Cancelada' | 'Pendiente' }) {
  const map = {
    Programada: 'bg-blue-600/10 text-blue-700 dark:text-blue-200',
    Completada: 'bg-green-600/10 text-green-700 dark:text-green-200',
    Cancelada:  'bg-red-600/10 text-red-700 dark:text-red-200',
    Pendiente:  'bg-zinc-600/10 text-zinc-700 dark:text-zinc-300'
  } as const;
  return <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', map[status])}>{status}</span>;
}
