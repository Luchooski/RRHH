import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listCandidates, deleteCandidate } from './api';
import { Link } from 'react-router-dom';
import { UserPlus, Search, Trash2, Pencil, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SendToVacancyModal from './SendToVacancyModal';

export default function CandidatesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [seniority, setSeniority] = useState<string>('');
  const [page, setPage] = useState(1);
  const [toSend, setToSend] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['candidates', q, seniority, page],
    queryFn: () => listCandidates({ q, seniority: seniority || undefined, page, limit: 20 }),
  });

  const mDel = useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (data?.limit ?? 20)));

  const headerRight = useMemo(() => (
    <div className="flex flex-wrap gap-2">
      <Link to="/candidatos/nuevo" className="btn btn-primary">
        <UserPlus className="size-4 mr-2" /> Nuevo
      </Link>
    </div>
  ), []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Candidatos</h1>
              <p className="text-sm text-[--color-muted]">Gestión de la base de talento.</p>
            </div>
            {headerRight}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <Search className="size-4 opacity-60" />
              <input className="input flex-1" placeholder="Buscar por nombre, email, skill, tag…" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-24">Seniority</label>
              <select className="input flex-1" value={seniority} onChange={(e)=>{ setSeniority(e.target.value); setPage(1); }}>
                <option value="">Todos</option>
                <option value="jr">JR</option>
                <option value="ssr">SSR</option>
                <option value="sr">SR</option>
              </select>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-0 shadow-sm overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Seniority</th>
                <th className="text-left p-3">Skills</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-6" colSpan={5}>Cargando…</td></tr>
              ) : isError ? (
                <tr><td className="p-6 text-red-600" colSpan={5}>No se pudo cargar.</td></tr>
              ) : items.length ? (
                items.map(c => (
                  <tr key={c.id} className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="p-3">
                      <Link to={`/candidatos/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                    </td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3 uppercase">{c.seniority ?? '—'}</td>
                    <td className="p-3 truncate">{c.skills.slice(0,6).join(', ')}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="btn" onClick={()=>setToSend(c.id)} title="Enviar a vacante">
                          <Send className="size-4" />
                        </button>
                        <Link to={`/candidatos/${c.id}/editar`} className="btn" title="Editar">
                          <Pencil className="size-4" />
                        </Link>
                        <button className="btn" onClick={()=>mDel.mutate(c.id)} title="Borrar">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-6 text-center text-zinc-500" colSpan={5}>Sin candidatos.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {pages > 1 && (
          <nav className="flex justify-end gap-2">
            <button className="btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
            <span className="px-3 py-2 text-sm">Página {page} / {pages}</span>
            <button className="btn" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
          </nav>
        )}
      </div>

      <Modal open={!!toSend} onClose={()=>setToSend(null)}>
        {toSend && <SendToVacancyModal candidateId={toSend} onClose={()=>setToSend(null)} />}
      </Modal>
    </div>
  );
}
