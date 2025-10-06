import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VacancyForm from './VacancyForm';
import { getVacancy, updateVacancy, deleteVacancy } from './api';
import { getClients } from '@/features/clients/api';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function VacancyEditPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const vacQ = useQuery({ queryKey: ['vacancy', id], queryFn: () => getVacancy(id), enabled: !!id });
  const clientsQ = useQuery({ queryKey: ['clients', { page:1, limit:100 }], queryFn: () => getClients({ page:1, limit:100 }) });

  const companies = (clientsQ.data?.items ?? []).map(c => ({ id: c.id, name: c.name }));

  const mUpdate = useMutation({
    mutationFn: (v: any) => updateVacancy(id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vacancies'] });
      qc.invalidateQueries({ queryKey: ['vacancy', id] });
      nav(`/vacantes/${id}`);
    }
  });

  const mDelete = useMutation({
    mutationFn: () => deleteVacancy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vacancies'] });
      nav('/vacantes');
    }
  });

  const onDelete = async () => {
    const ok = await confirm({
      tone: 'danger',
      title: 'Eliminar vacante',
      message: <>¿Seguro que querés eliminar esta vacante?</>
    });
    if (ok) mDelete.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4">
      <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Editar vacante</h1>
          <div className="flex gap-2">
            <button className="btn" onClick={onDelete}>Borrar</button>
            <Link to={`/vacantes/${id}`} className="btn btn-ghost">Volver</Link>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
        {vacQ.isLoading || clientsQ.isLoading ? (
          <div className="h-40 rounded-xl animate-pulse bg-black/5 dark:bg-white/5" />
        ) : vacQ.isError || !vacQ.data ? (
          <div className="text-red-600">No se pudo cargar la vacante.</div>
        ) : (
          <VacancyForm mode="edit" defaultValues={vacQ.data as any} companies={companies} onSubmit={(v)=>mUpdate.mutate(v)} disabled={mUpdate.isPending} />
        )}
      </section>
    </div>
  );
}
