import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotes, addNote, removeNote } from './api';
import { Loader2, Plus, Trash2, MessageSquare } from 'lucide-react';

type Props = { vacancyId: string };

export default function Notes({ vacancyId }: Props) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['vacancy:notes', vacancyId],
    queryFn: () => getNotes(vacancyId),
    enabled: !!vacancyId,
  });

  const [text, setText] = useState('');

  const mAdd = useMutation({
    mutationFn: () => addNote(vacancyId, text.trim()),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['vacancy:notes', vacancyId] });
    },
  });

  const mDel = useMutation({
    mutationFn: (noteId: string) => removeNote(vacancyId, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancy:notes', vacancyId] }),
  });

  return (
    <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 opacity-70" />
          <h3 className="text-base font-semibold">Notas internas</h3>
        </div>
        {q.isFetching && <Loader2 className="size-4 animate-spin opacity-60" aria-label="cargando" />}
      </div>

      {/* Alta */}
      <form
        className="flex gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim().length >= 2) mAdd.mutate();
        }}
      >
        <input
          className="input flex-1"
          placeholder="Ej. Muy buena comunicación; necesita reforzar técnica"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={mAdd.isPending || text.trim().length < 2}>
          <Plus className="size-4 mr-1" /> Añadir
        </button>
      </form>

      {/* Lista */}
      {q.isLoading ? (
        <ul className="space-y-2" aria-busy>
          <li className="h-10 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
          <li className="h-10 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
        </ul>
      ) : q.data?.items?.length ? (
        <ul className="space-y-1">
          {q.data.items.map((n) => (
            <li key={n.id} className="group flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{n.text}</p>
                <p className="text-[10px] text-[--color-muted]">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <button className="btn btn-ghost opacity-0 group-hover:opacity-100" onClick={() => mDel.mutate(n.id)}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-[--color-muted]">Sin notas todavía.</div>
      )}
    </div>
  );
}
