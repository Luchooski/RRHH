import { useMemo, useState } from 'react';
import CandidateForm from './CandidateForm';
import CandidateAdvancedSearch from './CandidateAdvancedSearch';
import { useDeleteCandidate, useListCandidates, useCreateCandidate } from './hooks';
import type { Candidate, CandidateQuery, CandidateCreateInput } from './dto';
import { toCsv, downloadCsv } from './csv';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

import { KpiCard } from '@/components/ui/KpiCard';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { StatBar } from '@/components/ui/StatBar';
import { Users, Sparkles, ClipboardList } from 'lucide-react';

type StatusTab = 'Todos' | 'Nuevo' | 'Contactado' | 'Entrevista' | 'Rechazado' | 'Contratado';

export default function CandidatesPage() {
  const [query, setQuery] = useState<Partial<CandidateQuery>>({
    limit: 20,
    skip: 0,
    sortField: 'createdAt',
    sortDir: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState<StatusTab>('Todos');

  const create = useCreateCandidate();
  const { data, isLoading, isFetching, error } = useListCandidates(query);
  const delMut = useDeleteCandidate();
  // ...dentro del componente:
  const toast = useToast();
  const confirm = useConfirm();

  const onDelete = async (id: string) => {
    const ok = await confirm({ title: 'Eliminar candidato', message: '¿Seguro que deseas eliminar este candidato?', tone: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    await delMut.mutateAsync(id);
    toast.success('Candidato eliminado.');
  };

  const handleCreate = async (formData: CandidateCreateInput) => {
    await create.mutateAsync(formData);
    toast.success('Candidato creado.');
  };

  const items = (data ?? []) as Candidate[];

  const total = items.length;
  const nuevos = items.filter(i => (i.status?.toLowerCase?.() ?? '') === 'nuevo').length;
  const matchProm = total ? Math.round(items.reduce((a, b) => a + (b.match ?? 0), 0) / total) : 0;

  const next = () => setQuery(q => ({ ...q, skip: (q.skip ?? 0) + (q.limit ?? 20) }));
  const prev = () => setQuery(q => ({ ...q, skip: Math.max(0, (q.skip ?? 0) - (q.limit ?? 20)) }));

  const exportCsv = () => {
    if (!items.length) return;
    const rows = items.map(i => ({
      id: i.id,
      nombre: i.name,
      email: i.email,
      rol: i.role,
      match: i.match ?? 0,
      estado: i.status,
      creado: i.createdAt,
      actualizado: i.updatedAt,
    }));
    downloadCsv('candidatos.csv', toCsv(rows));
  };

  // Métricas rápidas para el hero
  const metrics = useMemo(() => {
    const total = items.length;
    const hiring = items.filter(i => (i.status || '').toLowerCase() === 'entrevista').length;
    const newCands = items.filter(i => (i.status || '').toLowerCase() === 'nuevo').length;
    const avgMatch = Math.round(
      items.length ? items.reduce((acc, i) => acc + (i.match ?? 0), 0) / items.length : 0
    );
    return { total, hiring, newCands, avgMatch };
  }, [items]);

  // Tabs de status → actualiza query.status y resetea paginación
  const setStatus = (s: StatusTab) => {
    setTab(s);
    setQuery(q => ({
      ...q,
      skip: 0,
      status: s === 'Todos' ? undefined : s,
    }));
  };

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  return (
    <main className="mx-auto max-w-7xl p-4">
      {/* HERO / TOOLBAR STICKY */}
      <div className="sticky top-0 z-20 mb-4 rounded-2xl border border-zinc-200 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 p-4 text-white shadow-lg backdrop-blur dark:border-zinc-800">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Candidatos</h1>
            <p className="text-blue-100/90">Gestión, seguimiento y carga rápida</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={items.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 12v7H5v-7H3v9h18v-9h-2Zm-6 5l5-6h-3V3h-4v8H8l5 6Z"/></svg>
              Exportar CSV
            </button>
            {isFetching ? <span className="text-sm text-[--color-muted]">Actualizando…</span> : null}
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric title="Total" value={metrics.total} />
          <Metric title="Entrevistas" value={metrics.hiring} />
          <Metric title="Nuevos" value={metrics.newCands} />
          <Metric title="Match prom." value={`${metrics.avgMatch}%`} />
        </div>
      </div>

      {/* FILTROS: tabs + avanzado */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {(['Todos','Nuevo','Contactado','Entrevista','Rechazado','Contratado'] as StatusTab[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={[
                'px-3 py-1.5 text-sm font-semibold transition',
                tab === s
                  ? 'rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(v => !v)}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 6h16v2H4V6Zm4 5h8v2H8v-2Zm-2 5h12v2H6v-2Z"/></svg>
          Filtros avanzados
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CandidateAdvancedSearch initial={query} onChange={setQuery} />
        </div>
      )}

      {/* ERROR */}
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200"
        >
          <div className="font-bold">Error al cargar candidatos</div>
          <div>{(error as any)?.message ?? 'Intenta nuevamente más tarde.'}</div>
        </div>
      ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
          <KpiCard label="Candidatos" value={total} hint="Total cargados" icon={<Users size={16}/>} tone="primary" />
          <KpiCard label="Nuevos" value={nuevos} hint="Últimos estados" icon={<ClipboardList size={16}/>} tone="warning" />
          <KpiCard label="Match prom." value={`${matchProm}%`} icon={<Sparkles size={16}/>} tone="success"
                  hint={<span className="flex items-center gap-2">Promedio general <StatBar value={matchProm} className="w-24"/></span> as any} />
          <KpiCard label="Actualización" value={<span className="tabular-nums">{new Date().toLocaleTimeString()}</span>} />
        </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* LISTA */}
        <section className="md:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              Resultados
            </div>

            {isLoading ? (
              <SkeletonTable rows={6} />
            ) : items.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-zinc-100 text-2xl leading-[48px] dark:bg-zinc-800">🧑‍💼</div>
                <div className="text-base font-semibold text-zinc-800 dark:text-zinc-100">No hay candidatos</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Crea el primero con el formulario de la derecha.
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {['Nombre', 'Email', 'Rol', 'Match', 'Estado', 'Creado', ''].map(h => (
                          <th key={h} className="sticky top-0 bg-white px-4 py-3 dark:bg-zinc-900">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.id} className="group">
                          <td className="border-t border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                            {i.name}
                          </td>
                          <td className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                            <a className="underline-offset-2 hover:underline" href={`mailto:${i.email}`}>{i.email}</a>
                          </td>
                          <td className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                            {i.role}
                          </td>
                          <td className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-28 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                                <div
                                  className="h-2 rounded bg-blue-600 transition-all dark:bg-blue-500"
                                  style={{ width: `${Math.min(Math.max(i.match ?? 0, 0), 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{Math.round(i.match ?? 0)}%</span>
                            </div>
                          </td>
                          <td className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                            <StatusBadge status={i.status ?? 'Nuevo'} />
                          </td>
                          <td className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                            {fmtDate(i.createdAt)}
                          </td>
                          <td className="border-t border-zinc-200 px-4 py-3 text-right dark:border-zinc-800">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => onDelete(i.id)}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-red-700"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm2 18H7a2 2 0 0 1-2-2V9h14v10a2 2 0 0 1-2 2h-4v-8h-2v8Z"/></svg>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <button
                    onClick={prev}
                    disabled={(query.skip ?? 0) === 0}
                    className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={next}
                    className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ALTA RÁPIDA */}
        <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-lg font-extrabold tracking-tight">Alta rápida</h3>
          <CandidateForm onSubmit={handleCreate} />
        </aside>
      </div>
    </main>
  );
}

/* ========== Subcomponentes locales ========== */

function Metric({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 text-sm backdrop-blur">
      <div className="text-blue-100/90">{title}</div>
      <div className="text-lg font-extrabold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === 'entrevista'
      ? 'bg-indigo-100 text-indigo-700 ring-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-900/50'
      : s === 'contactado'
      ? 'bg-blue-100 text-blue-700 ring-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/50'
      : s === 'rechazado'
      ? 'bg-rose-100 text-rose-700 ring-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900/50'
      : s === 'contratado'
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50'
      : 'bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${cls}`}>
      {status}
    </span>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse px-4 py-4">
      <div className="mb-3 h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="col-span-2 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
