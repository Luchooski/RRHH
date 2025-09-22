import { clsx } from 'clsx';

export default function StatusBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const map: Record<string, string> = {
    activo: 'bg-green-600/10 text-green-700 dark:text-green-300',
    entrevistado: 'bg-blue-600/10 text-blue-700 dark:text-blue-300',
    oferta: 'bg-violet-600/10 text-violet-700 dark:text-violet-300',
    rechazado: 'bg-red-600/10 text-red-700 dark:text-red-300',
    pausado: 'bg-zinc-600/10 text-zinc-700 dark:text-zinc-300'
  };
  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', map[v] ?? map['pausado'])}>
      {value}
    </span>
  );
}
