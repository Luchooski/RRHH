import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CandidateForm from './CandidateForm';
import { getCandidate, updateCandidate } from './api';

export default function CandidateEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => getCandidate(id),
    enabled: !!id,
  });

  const mUpdate = useMutation({
    mutationFn: (data: any) => updateCandidate(id, data),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['candidate', id] });
      nav(`/candidatos/${c.id}`);
    },
  });

  if (q.isLoading) return <div className="p-6">Cargando…</div>;
  if (q.isError || !q.data) return <div className="p-6 text-red-600">No se pudo cargar el candidato.</div>;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4">
      <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Editar candidato</h1>
          <Link to={`/candidatos/${id}`} className="btn btn-ghost">Volver</Link>
        </div>
      </header>
      <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
        <CandidateForm
          defaultValues={q.data}
          pending={mUpdate.isPending}
          onSubmit={(data) => mUpdate.mutate(data)}
        />
      </section>
    </div>
  );
}
