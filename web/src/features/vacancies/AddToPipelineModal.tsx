import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { getCandidate } from '@/features/candidates/api';
import { createApplication } from './api';
import { Search, UserPlus } from 'lucide-react';

type Props = {
  vacancyId: string;
  open: boolean;
  onClose: () => void;
};

type Candidate = {
  id: string;
  name: string;
  email?: string;
  skills?: string[];
};

export default function AddToPipelineModal({ vacancyId, open, onClose }: Props) {
  const qc = useQueryClient();
  const { data = [], isLoading, isError } = useQuery<Candidate[]>({
    queryKey: ['candidates','for-pipeline'],
    queryFn: getCandidate as any,
    enabled: open
  });

  const [q, setQ] = useState('');
  const [note, setNote] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.skills?.some(s => s.toLowerCase().includes(term))
    );
  }, [data, q]);

  const mAdd = useMutation({
    mutationFn: (candidateId: string) => createApplication({ candidateId, vacancyId, notes: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', vacancyId] });
      setNote('');
      setQ('');
      onClose();
    }
  });

  return (
    <Modal open={open} onClose={onClose} labelledById="add-to-pipeline">
      <div className="px-4 pt-4">
        <h3 id="add-to-pipeline" className="text-lg font-semibold">Agregar candidato al pipeline</h3>
      </div>

      <div className="px-4 pt-2 space-y-2">
        <label className="input flex items-center gap-2">
          <Search className="size-4 opacity-70" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="Buscar por nombre, email o skill…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Nota inicial (opcional)</span>
          <textarea
            className="input w-full h-20 resize-none"
            placeholder="Ej: recomendado por Juan, experiencia en fintech…"
            value={note}
            onChange={(e)=>setNote(e.target.value)}
          />
        </label>
      </div>

      <div className="px-4 py-3 max-h-80 overflow-auto">
        {isError && <div className="text-red-600">No se pudo cargar candidatos.</div>}
        {isLoading ? (
          <>
            <div className="h-16 rounded-xl animate-pulse bg-black/5 dark:bg-white/5 mb-2" />
            <div className="h-16 rounded-xl animate-pulse bg-black/5 dark:bg-white/5" />
          </>
        ) : filtered.length ? (
          <ul className="space-y-2">
            {filtered.slice(0,50).map(c => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white/70 dark:bg-zinc-800/60">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-[--color-muted] truncate">{c.email ?? '—'}</p>
                </div>
                <button className="btn btn-primary" onClick={()=>mAdd.mutate(c.id)} disabled={mAdd.isPending}>
                  <UserPlus className="size-4 mr-1" /> Agregar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[--color-muted]">No hay resultados.</div>
        )}
      </div>

      <div className="px-4 pb-4 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}
