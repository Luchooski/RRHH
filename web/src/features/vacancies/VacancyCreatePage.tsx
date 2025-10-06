import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import VacancyForm from './VacancyForm';
import { createVacancy } from './api';
import { getClients } from '@/features/clients/api';

export default function VacancyCreatePage() {
  const nav = useNavigate();
  const qc = useQueryClient();

  const clientsQ = useQuery({
    queryKey: ['clients', { page:1, limit:100 }],
    queryFn: () => getClients({ page:1, limit:100 }),
  });

  const companies = (clientsQ.data?.items ?? []).map(c => ({ id: c.id, name: c.name }));

  const m = useMutation({
    mutationFn: (v: any) => createVacancy(v),
    onSuccess: (vac) => {
      qc.invalidateQueries({ queryKey: ['vacancies'] });
      nav(`/vacantes/${vac.id}`);
    }
  });

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4">
      <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Nueva vacante</h1>
      </header>

      <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
        {clientsQ.isLoading ? (
          <div className="h-40 rounded-xl animate-pulse bg-black/5 dark:bg-white/5" />
        ) : (
          <VacancyForm mode="create" companies={companies} onSubmit={(v)=>m.mutate(v)} disabled={m.isPending} />
        )}
      </section>

      <div className="flex justify-between">
        <Link to="/vacantes" className="btn btn-ghost">Volver</Link>
      </div>
    </div>
  );
}
