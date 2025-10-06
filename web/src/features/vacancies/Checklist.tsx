import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Trash2, Loader2 } from 'lucide-react';
import { getChecklist, addChecklistItem, updateChecklistItem, removeChecklistItem } from './api';

type Props = { vacancyId: string };

export default function Checklist({ vacancyId }: Props) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['vacancy:checklist', vacancyId],
    queryFn: () => getChecklist(vacancyId)
  });

  const [text, setText] = useState('');

  const mAdd = useMutation({
    mutationFn: () => addChecklistItem(vacancyId, text.trim()),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['vacancy:checklist', vacancyId] }); }
  });

  const mToggle = useMutation({
    mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) => updateChecklistItem(vacancyId, itemId, { done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancy:checklist', vacancyId] })
  });

  const mDelete = useMutation({
    mutationFn: (itemId: string) => removeChecklistItem(vacancyId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancy:checklist', vacancyId] })
  });

  return (
    <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Checklist</h3>
        {q.isFetching && <Loader2 className="size-4 animate-spin opacity-60" aria-label="cargando" />}
      </div>

      {/* Añadir */}
      <form
        className="flex gap-2 mb-3"
        onSubmit={(e)=>{ e.preventDefault(); if (text.trim().length >= 2) mAdd.mutate(); }}
      >
        <input
          className="input flex-1"
          placeholder="Agregar tarea (ej. Agendar entrevista técnica)"
          value={text}
          onChange={e=>setText(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={mAdd.isPending || text.trim().length < 2}>
          <Plus className="size-4 mr-1" /> Añadir
        </button>
      </form>

      {/* Lista */}
      {q.isLoading ? (
        <ul className="space-y-2" aria-busy>
          <li className="h-10 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
          <li className="h-10 rounded-lg animate-pulse bg-black/5 dark:bg:white/5" />
        </ul>
      ) : q.data?.items?.length ? (
        <ul className="space-y-1">
          {q.data.items.map(it => (
            <li key={it.id} className="group flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
              <button
                type="button"
                aria-label={it.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
                className={[
                  'inline-flex h-5 w-5 items-center justify-center rounded-md ring-1',
                  it.done
                    ? 'bg-green-600/20 text-green-600 ring-green-600/40'
                    : 'bg-zinc-500/10 text-zinc-400 ring-zinc-400/30'
                ].join(' ')}
                onClick={()=>mToggle.mutate({ itemId: it.id, done: !it.done })}
              >
                <Check className="size-3" />
              </button>
              <span className={['text-sm flex-1 truncate', it.done ? 'line-through opacity-60' : ''].join(' ')}>
                {it.label}
              </span>
              <button className="btn btn-ghost opacity-0 group-hover:opacity-100" onClick={()=>mDelete.mutate(it.id)}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-[--color-muted]">Sin tareas todavía.</div>
      )}
    </div>
  );
}
