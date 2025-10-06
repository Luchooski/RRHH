import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { SortableItem } from './SortableItem';
import { clsx } from 'clsx';

type Status = 'sent'|'interview'|'feedback'|'offer'|'hired'|'rejected';

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'sent',       label: 'Enviado' },
  { id: 'interview',  label: 'Entrevista' },
  { id: 'feedback',   label: 'Feedback' },
  { id: 'offer',      label: 'Oferta' },
  { id: 'hired',      label: 'Contratado' },
  { id: 'rejected',   label: 'Rechazado' },
];

export type BoardItem = {
  id: string;
  candidateName: string;
  status: Status;
};

type Props = {
  items: BoardItem[];
  onMove: (id: string, to: Status) => void;
  onReorder?: (changes: { id: string; status: Status; order: number }[]) => void;
};

export default function KanbanBoard({ items, onMove, onReorder }: Props) {
  const [state, setState] = useState(() => groupByStatus(items));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // sync externo → interno
  const grouped = useMemo(() => groupByStatus(items), [items]);
  useMemo(() => setState(grouped), [grouped]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    // 👇 Forzar a string para que respete nuestro parser
    const activeKey = String(active.id);
    const overKey   = String(over.id);

    const [fromCol, fromIdx] = parseKey(activeKey);
    const [toCol, toIdx]     = parseKey(overKey);

    if (!fromCol || !toCol) return;

    const copy = new Map(state);
    const fromList = [...(copy.get(fromCol) ?? [])];
    const toList   = fromCol === toCol ? fromList : [...(copy.get(toCol) ?? [])];

    const moved = fromList.splice(fromIdx, 1)[0];
    if (!moved) return;

    if (fromCol === toCol) {
      toList.splice(toIdx, 0, moved);
      copy.set(toCol, toList);
      setState(copy);
      if (onReorder) {
        const changes = toList.map((it, idx) => ({ id: it.id, status: toCol, order: idx }));
        onReorder(changes);
      }
    } else {
      moved.status = toCol as Status;
      toList.splice(toIdx, 0, moved);
      copy.set(fromCol, fromList);
      copy.set(toCol, toList);
      setState(copy);
      onMove(moved.id, toCol as Status);
      if (onReorder) {
        const changes = [
          ...toList.map((it, idx) => ({ id: it.id, status: toCol as Status, order: idx })),
          ...fromList.map((it, idx) => ({ id: it.id, status: fromCol as Status, order: idx })),
        ];
        onReorder(changes);
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {COLUMNS.map(col => {
          const list = state.get(col.id) ?? [];
          return (
            <div key={col.id} className="rounded-xl border p-2 bg-white/40 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-[--color-muted]">{list.length}</span>
              </div>
              <SortableContext
                // aseguramos keys string
                items={list.map((_, idx) => keyFor(col.id, idx))}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2 min-h-[60px]">
                  {list.map((it, idx) => (
                    <SortableItem key={keyFor(col.id, idx)} id={keyFor(col.id, idx)}>
                      <li className={clsx(
                        'rounded-lg border bg-white dark:bg-zinc-900 px-3 py-2 shadow-sm',
                        'hover:bg-black/5 dark:hover:bg-white/5'
                      )}>
                        <p className="text-sm font-medium truncate">{it.candidateName}</p>
                      </li>
                    </SortableItem>
                  ))}
                </ul>
              </SortableContext>
            </div>
          );
        })}
      </DndContext>
    </div>
  );
}

function groupByStatus(items: BoardItem[]) {
  const map = new Map<Status, BoardItem[]>();
  for (const c of ['sent','interview','feedback','offer','hired','rejected'] as Status[]) {
    map.set(c, []);
  }
  if (Array.isArray(items)) {
    items.forEach(it => {
      const arr = map.get(it.status as Status);
      if (arr) arr.push({ ...it });
    });
  }
  return map;
}

function keyFor(col: string, idx: number) {
  return `${col}:${idx}`; // siempre string
}

function parseKey(id: string): [Status|null, number] {
  const [col, idxStr] = id.split(':');
  const idx = Number(idxStr);
  const okCol = ['sent','interview','feedback','offer','hired','rejected'].includes(col);
  if (!okCol || Number.isNaN(idx)) return [null, -1];
  return [col as Status, idx];
}
