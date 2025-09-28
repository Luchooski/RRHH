import { useState } from 'react';
import CandidateForm from '../../components/CandidateForm';
import CandidateTable from '../../components/CandidateTable';
import { useDeleteCandidate, useListCandidates } from '../../features/candidates/hooks';

export default function CandidatesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(20);
  const [skip, setSkip] = useState(0);

  const { data, isLoading, isFetching } = useListCandidates({ q, status, limit, skip });
  const delMut = useDeleteCandidate();

  const onCreated = () => {
    // React Query invalidará desde el hook; mantenemos UX
  };

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar candidato?')) return;
    await delMut.mutateAsync(id);
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Candidatos</h1>
        <div className="text-sm text-gray-500">{isFetching ? 'Actualizando…' : null}</div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="col-span-2 border rounded-xl p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setSkip(0); }}
              placeholder="Buscar por nombre, email o rol…"
              className="border rounded px-3 py-2 w-64"
              aria-label="Buscar"
            />
            <select
              value={status ?? ''}
              onChange={(e) => { setStatus(e.target.value || undefined); setSkip(0); }}
              className="border rounded px-3 py-2"
              aria-label="Estado"
            >
              <option value="">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Entrevista">Entrevista</option>
              <option value="Offer">Offer</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setSkip(0); }}
              className="border rounded px-3 py-2"
              aria-label="Items por página"
            >
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}/pág</option>)}
            </select>
          </div>

          <CandidateTable data={data ?? []} loading={isLoading} onDelete={onDelete} />

          <div className="flex items-center justify-end gap-2">
            <button
              className="border rounded px-3 py-1 disabled:opacity-50"
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0}
            >
              Anterior
            </button>
            <button
              className="border rounded px-3 py-1"
              onClick={() => setSkip(skip + limit)}
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="border rounded-xl p-3">
          <h2 className="font-medium mb-2">Alta rápida</h2>
          <CandidateForm onCreated={onCreated} />
        </div>
      </section>
    </div>
  );
}
