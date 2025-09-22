import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInterviews, createInterview, updateInterview, deleteInterview } from './api';
import type { IStatus } from './schema';
import StatusPill from '../../components/StatusPill';
import InterviewCard from './InterviewCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { pushHistory } from '../history/HistoryDrawer';

export default function InterviewsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['interviews'],
    queryFn: getInterviews,
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Todos' | IStatus>('Todos');
  const [toast, setToast] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data
      .filter(r => filter === 'Todos' ? true : r.status === filter)
      .filter(r => term ? r.name.toLowerCase().includes(term) : true);
  }, [data, filter, search]);

  const onOk = (msg: string) => {
    qc.invalidateQueries({ queryKey: ['interviews'] });
    pushHistory(msg);
    setToast(msg);
  };

  const mUpdate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IStatus }) => updateInterview(id, { status }),
    onSuccess: () => onOk('Cambió estado de entrevista'),
    onError: () => setToast('Error al actualizar estado'),
  });

  const mDelete = useMutation({
    mutationFn: deleteInterview,
    onSuccess: () => onOk('Borró entrevista'),
    onError: () => setToast('Error al borrar entrevista'),
  });

  // Modal nota (si la API la soporta luego la persistimos)
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const openNoteFor = (id: string) => { setActiveId(id); setNoteText(''); setNoteOpen(true); };
  const saveNote = () => {
    pushHistory('Añadió nota a entrevista', `id=${activeId}: ${noteText}`);
    setToast('Nota guardada');
    setNoteOpen(false);
    setActiveId(null);
    setNoteText('');
  };

  return (
    <div className="section space-y-5 sm:space-y-6">
      <Toast message={toast} />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">Entrevistas</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            className="input w-full sm:w-64"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
          <select
            className="input w-full sm:w-40"
            value={filter}
            onChange={(e)=>setFilter(e.target.value as any)}
            aria-label="Filtrar por estado"
          >
            <option>Todos</option>
            <option>Programada</option>
            <option>Completada</option>
            <option>Cancelada</option>
            <option>Pendiente</option>
          </select>
        </div>
      </header>

      {isError && <div className="card p-4 text-red-600">No se pudo cargar la lista.</div>}

      {/* MÓVIL: tarjetas */}
      <section className="grid grid-cols-1 gap-3 md:hidden">
        {isLoading ? (
          <>
            <div className="card p-6 animate-pulse">Cargando…</div>
            <div className="card p-6 animate-pulse">Cargando…</div>
          </>
        ) : filtered.length ? (
          filtered.map(r => (
            <InterviewCard
              key={r.id}
              name={r.name}
              datetime={r.datetime}
              status={r.status}
              onStatus={(s)=>mUpdate.mutate({ id: r.id, status: s })}
              onNote={()=>openNoteFor(r.id)}
            />
          ))
        ) : (
          <div className="card p-6 text-center text-zinc-500">No hay entrevistas.</div>
        )}
      </section>

      {/* DESKTOP: tabla */}
      <section className="card p-0 overflow-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="text-left p-3">Candidato</th>
              <th className="text-left p-3">Fecha/Hora</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="p-6" colSpan={4}>Cargando…</td></tr>
            ) : filtered.length ? (
              filtered.map(row => (
                <tr key={row.id} className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">{new Date(row.datetime).toLocaleString()}</td>
                  <td className="p-3"><StatusPill status={row.status} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <select
                        className="input"
                        aria-label={`Cambiar estado de ${row.name}`}
                        value={row.status}
                        onChange={(e)=>mUpdate.mutate({ id: row.id, status: e.target.value as IStatus })}
                      >
                        {['Programada','Completada','Cancelada','Pendiente'].map(s=><option key={s}>{s}</option>)}
                      </select>
                      <button className="btn btn-primary" onClick={()=>openNoteFor(row.id)}>Añadir nota</button>
                      <button className="btn" onClick={()=>mDelete.mutate(row.id)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="p-6 text-center text-zinc-500" colSpan={4}>No hay entrevistas.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal Nota */}
      <Modal open={noteOpen} onClose={()=>setNoteOpen(false)} title="Añadir nota">
        <form onSubmit={(e)=>{ e.preventDefault(); saveNote(); }}>
          <textarea
            className="input w-full h-28 resize-none"
            placeholder="Escribe una nota breve…"
            value={noteText}
            onChange={(e)=>setNoteText(e.target.value)}
            autoFocus
          />
          <div className="mt-3 flex gap-2 justify-end">
            <button type="button" className="btn" onClick={()=>setNoteOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
