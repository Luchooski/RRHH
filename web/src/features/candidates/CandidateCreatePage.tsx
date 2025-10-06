import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import CandidateForm from './CandidateForm';
import { createCandidate } from './api';

export default function CandidateCreatePage() {
  const nav = useNavigate();
  const qc = useQueryClient();

  const mCreate = useMutation({
    mutationFn: createCandidate,
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      nav(`/candidatos/${c.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4">
      <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Nuevo candidato</h1>
          <Link to="/candidatos" className="btn btn-ghost">Volver</Link>
        </div>
      </header>
      <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
        <CandidateForm
          pending={mCreate.isPending}
          onSubmit={(data) => mCreate.mutate(data)}
        />
      </section>
    </div>
  );
}
