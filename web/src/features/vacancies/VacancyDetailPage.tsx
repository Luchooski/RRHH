import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getVacancy, listApplications, updateApplication, reorderApplications  } from './api';
import KanbanBoard from './KanbanBoard';
import Checklist from './Checklist';
import AddToPipelineModal from './AddToPipelineModal';
import { useState , useMemo } from 'react';
import Notes from './Notes';

type Status = 'sent'|'interview'|'feedback'|'offer'|'hired'|'rejected';

function normalizeApps(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export default function VacancyDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const mReorder = useMutation({
  mutationFn: (changes: { id: string; status: any; order: number }[]) =>
    reorderApplications(id, changes),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', id] })
  });

  const vacQ = useQuery({
    queryKey: ['vacancy', id],
    queryFn: () => getVacancy(id),
    enabled: !!id,
  });

  const appsQ = useQuery({
    queryKey: ['applications', id],
    queryFn: () => listApplications(id),
    enabled: !!id,
  });

  const boardItems = useMemo(() => {
  const arr = normalizeApps(appsQ.data);
  return arr.map((a: any) => ({
    id: a.id ?? a._id ?? a.appId,
    candidateName: a.candidateName ?? a.name ?? 'Candidato',
    status: (a.status ?? 'sent') as Status,
  }));
}, [appsQ.data]);

  const mMove = useMutation({
    mutationFn: ({ appId, to }: { appId: string; to: any }) =>
      updateApplication(appId, { status: to }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', id] }),
  });

  if (vacQ.isLoading) return <div className="p-6">Cargando…</div>;
  if (vacQ.isError || !vacQ.data)
    return <div className="p-6 text-red-600">No se pudo cargar la vacante.</div>;

  const v = vacQ.data;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{v.title}</h1>
              <p className="text-sm text-[--color-muted]">
                {v.companyName ?? v.companyId ?? '—'} · {v.location ?? '—'} ·{' '}
                {v.seniority ? String(v.seniority).toUpperCase() : '—'}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
                Agregar al pipeline
              </button>
              <Link to={`/vacantes/${v.id}/editar`} className="btn">
                Editar
              </Link>
              <Link to="/vacantes" className="btn btn-ghost">
                Volver
              </Link>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          {/* Pipeline (Kanban) */}
          <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Pipeline</h2>
              <span className="text-xs text-[--color-muted]">
                Arrastrá tarjetas para cambiar de etapa
              </span>
            </div>
            {appsQ.isLoading ? (
              <div className="h-48 rounded-xl animate-pulse bg-black/5 dark:bg-white/5" />
            ) : (
              <KanbanBoard
                items={boardItems}
                onMove={(appId, to) => mMove.mutate({ appId, to })}
                onReorder={(changes) => mReorder.mutate(changes)}
              />
            )}
          </div>

          {/* Checklist (el componente maneja fetch/mutations internamente) */}
          <Checklist vacancyId={id} />
          <Notes vacancyId={id} />
        </section>

        <AddToPipelineModal
          vacancyId={v.id}
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
      </div>
    </div>
  );
}
