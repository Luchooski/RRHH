import { useMemo, useState } from 'react';
import type { ApplicationDTO } from './vacancy.schema';

type ColKey = 'applied'|'interview'|'finalist'|'hired'|'rejected';
const COLS: { key: ColKey; title: string }[] = [
  { key: 'applied',   title: 'Aplicado' },
  { key: 'interview', title: 'Entrevista' },
  { key: 'finalist',  title: 'Finalista' },
  { key: 'hired',     title: 'Contratado' },
  { key: 'rejected',  title: 'Rechazado' },
];

type Props = {
  items?: ApplicationDTO[] | { items: ApplicationDTO[] };
  onMove: (id: string, to: ColKey) => void;
};

 export default function KanbanBoard({ items, onMove }: Props) {

  // Normalizamos: siempre un array
  const list: ApplicationDTO[] = useMemo(() => {
    const raw = Array.isArray(items) ? items : (items as any)?.items;
    return Array.isArray(raw) ? raw : [];
  }, [items]);

  const byCol = useMemo(() => {
    const map: Record<ColKey, ApplicationDTO[]> = { applied:[], interview:[], finalist:[], hired:[], rejected:[] };
    list.forEach(a => map[a.status as ColKey]?.push(a));
    return map;
  }, [list]);

  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {COLS.map(col => (
        <div
          key={col.key}
          className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm min-h-48"
          onDragOver={(e)=>e.preventDefault()}
          onDrop={()=>{ if (dragId) onMove(dragId, col.key); }}
          aria-label={`Columna ${col.title}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <span className="text-xs text-[--color-muted]">{byCol[col.key].length}</span>
          </div>
          <ul className="space-y-2">
            {byCol[col.key].map(a => (
              <li
                key={a.id}
                draggable
                onDragStart={()=>setDragId(a.id)}
                className="rounded-lg border px-3 py-2 bg-white/70 dark:bg-zinc-800/60 hover:bg-black/5 dark:hover:bg-white/5 cursor-grab"
                title={a.candidateName ?? a.candidateId}
              >
                <p className="font-medium truncate">{a.candidateName ?? a.candidateId}</p>
                {a.notes && <p className="text-xs text-[--color-muted] truncate">{a.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
