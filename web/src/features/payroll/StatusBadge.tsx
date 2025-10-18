import type { Status } from './dto';

export function StatusBadge({ status }: { status: Status }) {
  const cls = 'px-2 py-1 rounded-full border text-xs';
  const map: Record<string,string> = {
    pendiente: 'bg-yellow-50 border-yellow-300 text-yellow-900',
    aprobada: 'bg-blue-50 border-blue-300 text-blue-900',
    pagada: 'bg-green-50 border-green-300 text-green-900',
    anulada: 'bg-red-50 border-red-300 text-red-900',
    Borrador: 'bg-slate-50 border-slate-300 text-slate-900',
    Aprobado: 'bg-blue-50 border-blue-300 text-blue-900',
  };
  return <span className={`${cls} ${map[status] ?? ''}`}>{status}</span>;
}
