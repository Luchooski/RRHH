import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Trash2, FileText } from 'lucide-react';
import Empty from '@/components/ui/Empty';
import { useConfirm } from '@/components/ui/ConfirmDialog';

// API existente (ajusta los imports a tu estructura real si difiere)
import { apiGetCandidate, apiDeleteCandidate /*, updateCandidate*/ } from './api';

// Tipo amplio para no chocar con tu DTO actual
type Candidate = {
  id: string;
  name: string;
  email?: string;
  location?: string;
  seniority?: string;
  skills?: string[];
  status?: string;
  updatedAt?: string;
};

import CandidateCard from './CandidateCard';

export default function CandidatesPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  const { data = [], isLoading, isError } = useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: apiGetCandidate as any
  });

  // UI state
  const [q, setQ] = useState('');
  const [seniority, setSeniority] = useState<'Todos' | 'jr' | 'ssr' | 'sr'>('Todos');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || [])
      .filter(c => seniority === 'Todos' ? true : (c.seniority ?? '').toLowerCase() === seniority)
      .filter(c => term ? (
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.skills?.some(s => s.toLowerCase().includes(term))
      ) : true);
  }, [data, q, seniority]);

  const mDelete = useMutation({
    mutationFn: async (id: string) => {
      await apiDeleteCandidate(id as any);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] })
  });

  const askDelete = async (id: string, name: string) => {
    const ok = await confirm({
      tone: 'danger',
      title: 'Eliminar candidato',
      message: <>¿Seguro que querés eliminar a <b>{name}</b>? Esta acción no se puede deshacer.</>
    });
    if (ok) mDelete.mutate(id);
  };

  return (
    <div className="relative">
      {/* Fondo suave (mismo patrón que Dashboard) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        {/* Header */}
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Candidatos</h1>
              <p className="text-sm text-[--color-muted]">Base de talento centralizada.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/candidatos/nuevo" className="btn btn-primary">
                <Plus className="size-4 mr-2" /> Nuevo candidato
              </Link>
              <Link to="/reportes" className="btn">
                <FileText className="size-4 mr-2" /> Exportar
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="input flex items-center gap-2">
              <Search className="size-4 opacity-70" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                placeholder="Buscar por nombre, email o skill…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar"
              />
            </label>

            <label className="input flex items-center gap-2">
              <Filter className="size-4 opacity-70" />
              <select
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value as any)}
                aria-label="Filtrar por seniority"
              >
                <option>Todos</option>
                <option value="jr">Junior</option>
                <option value="ssr">Semi-Senior</option>
                <option value="sr">Senior</option>
              </select>
            </label>

            <div className="hidden sm:block" />
          </div>
        </header>

        {/* Errores */}
        {isError && <div className="card p-4 text-red-600">No se pudo cargar la lista.</div>}

        {/* Mobile: cards */}
        <section className="grid grid-cols-1 gap-3 md:hidden">
          {isLoading ? (
            <>
              <div className="h-24 rounded-2xl animate-pulse bg-black/5 dark:bg-white/5" />
              <div className="h-24 rounded-2xl animate-pulse bg-black/5 dark:bg-white/5" />
              <div className="h-24 rounded-2xl animate-pulse bg-black/5 dark:bg-white/5" />
            </>
          ) : filtered.length ? (
            filtered.map((c) => (
              <CandidateCard
                key={c.id}
                name={c.name}
                email={c.email}
                location={c.location}
                seniority={c.seniority}
                skills={c.skills}
                right={
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost"
                      onClick={() => askDelete(c.id, c.name)}
                      aria-label={`Eliminar ${c.name}`}
                      title="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                }
              />
            ))
          ) : (
            <Empty
              title="Sin candidatos aún"
              description="Creá tu primer candidato para empezar a construir tu pipeline."
              action={<Link to="/candidatos/nuevo" className="btn btn-primary">Nuevo candidato</Link>}
            />
          )}
        </section>

        {/* Desktop: tabla */}
        <section className="hidden md:block rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-0 shadow-sm overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left p-3">Candidato</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Seniority</th>
                <th className="text-left p-3">Ubicación</th>
                <th className="text-left p-3">Skills</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-6" colSpan={6}>Cargando…</td></tr>
              ) : filtered.length ? (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.email ?? '—'}</td>
                    <td className="p-3 capitalize">{c.seniority ?? '—'}</td>
                    <td className="p-3">{c.location ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.skills ?? []).slice(0,4).map(s => (
                          <span key={s} className="text-xs px-2 py-1 rounded-full bg-violet-600/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/20">{s}</span>
                        ))}
                        {(c.skills?.length ?? 0) > 4 && (
                          <span className="text-xs text-[--color-muted]">+{(c.skills!.length - 4)}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/candidatos/${c.id}`} className="btn btn-ghost">Ver</Link>
                        <button className="btn" onClick={() => askDelete(c.id, c.name)}>
                          <Trash2 className="size-4 mr-1" /> Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6" colSpan={6}>
                    <Empty
                      title="Sin candidatos"
                      description="No encontramos candidatos con esos filtros."
                      action={<button onClick={() => { setQ(''); setSeniority('Todos'); }} className="btn">Limpiar filtros</button>}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
