import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Trash2 } from 'lucide-react';
import { listVacancies, deleteVacancy } from './api';
import type { VacancyDTO } from './vacancy.schema';
import Empty from '@/components/ui/Empty';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function VacanciesPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [q, setQ] = useState(''); const [status, setStatus] = useState<'Todos'|'open'|'paused'|'closed'>('Todos');
  const [page, setPage] = useState(1); const limit = 12;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vacancies', { q, status, page, limit }],
    queryFn: () => listVacancies({ q, status: status==='Todos'?undefined:status, page, limit })
  });

  const items: VacancyDTO[] = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? limit)));

  const mDelete = useMutation({
    mutationFn: async (id: string) => { await deleteVacancy(id); return id; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacancies'] })
  });

  const askDelete = async (id: string, title: string) => {
    const ok = await confirm({ tone:'danger', title:'Eliminar vacante', message: <>¿Eliminar <b>{title}</b>?</> });
    if (ok) mDelete.mutate(id);
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Vacantes</h1>
              <p className="text-sm text-[--color-muted]">Gestiona puestos y su pipeline.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/vacantes/nueva" className="btn btn-primary"><Plus className="size-4 mr-2" /> Nueva vacante</Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="input flex items-center gap-2">
              <Search className="size-4 opacity-70" />
              <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Buscar por título/empresa…" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} />
            </label>
            <label className="input flex items-center gap-2">
              <Filter className="size-4 opacity-70" />
              <select className="min-w-0 flex-1 bg-transparent outline-none" value={status} onChange={(e)=>{ setStatus(e.target.value as any); setPage(1); }}>
                <option>Todos</option><option value="open">Abiertas</option><option value="paused">Pausadas</option><option value="closed">Cerradas</option>
              </select>
            </label>
          </div>
        </header>

        {isError && <div className="card p-4 text-red-600">No se pudo cargar la lista.</div>}

        {/* Grid de tarjetas simple */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {isLoading ? (
            Array.from({length:6}).map((_,i)=><div key={i} className="h-24 rounded-2xl animate-pulse bg-black/5 dark:bg-white/5" />)
          ) : items.length ? (
            items.map(v => (
              <div key={v.id} className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.title}</p>
                    <p className="text-xs text-[--color-muted] truncate">{v.companyName ?? v.companyId} · {v.location} · {v.seniority.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/vacantes/${v.id}`} className="btn btn-ghost">Abrir</Link>
                    <button className="btn btn-ghost" onClick={()=>askDelete(v.id, v.title)} aria-label="Eliminar"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Empty title="Sin vacantes" description="Creá tu primera vacante para comenzar el proceso." action={<Link to="/vacantes/nueva" className="btn btn-primary">Nueva vacante</Link>} />
          )}
        </section>

        {/* Paginación */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-[--color-muted]">Página {page} de {totalPages}</span>
          <button className="btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
          <button className="btn" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}
