import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ClientForm from './ClientsForm';
import { getClientById, updateClient, deleteClient } from './api';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function ClientEditPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => getClientById(id),
    enabled: !!id
  });

  const mUpdate = useMutation({
    mutationFn: (v: any) => updateClient(id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients', id] });
    }
  });

  const mDelete = useMutation({
    mutationFn: () => deleteClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      nav('/clientes');
    }
  });

  const onDelete = async () => {
    const ok = await confirm({
      tone: 'danger',
      title: 'Eliminar cliente',
      message: <>¿Seguro que querés eliminar <b>{data?.name}</b>? Esta acción no se puede deshacer.</>
    });
    if (ok) mDelete.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4">
      <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Editar cliente</h1>
          <div className="flex gap-2">
            <button className="btn" onClick={onDelete}>Borrar</button>
            <Link to="/clientes" className="btn btn-ghost">Volver</Link>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
        {isLoading ? (
          <div className="h-40 rounded-xl animate-pulse bg-black/5 dark:bg-white/5" />
        ) : isError || !data ? (
          <div className="text-red-600">No se pudo cargar el cliente.</div>
        ) : (
          <ClientForm mode="edit" defaultValues={data as any} onSubmit={(v)=>mUpdate.mutate(v)} disabled={mUpdate.isPending} />
        )}
      </section>
    </div>
  );
}
