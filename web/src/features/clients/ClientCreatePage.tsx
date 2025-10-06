import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import ClientForm from './ClientsForm';
import { createClient } from './api';
import type { ClientCreateValues } from './client.schema';

export default function ClientCreatePage() {
  const nav = useNavigate();
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: (v: ClientCreateValues) => createClient(v as any),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      nav(`/clientes/${c.id}`);
    }
  });

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4">
      <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo cliente</h1>
      </header>

      <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
        <ClientForm mode="create" onSubmit={(v)=>m.mutate(v)} disabled={m.isPending} />
      </section>

      <div className="flex justify-between">
        <Link to="/clientes" className="btn btn-ghost">Volver</Link>
      </div>
    </div>
  );
}
