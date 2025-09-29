import { useState } from 'react';
import CandidateForm from '../../components/CandidateForm';
import CandidateTable from '../../components/CandidateTable';
import CandidateAdvancedSearch from './CandidateAdvancedSearch';
import { useDeleteCandidate, useListCandidates } from './hooks';
import type { Candidate, CandidateQuery } from './dto';
import { toCsv, downloadCsv } from './csv';

export default function CandidatesPage() {
  const [query, setQuery] = useState<Partial<CandidateQuery>>({
    limit: 20, skip: 0, sortField: 'createdAt', sortDir: 'desc'
  });

  const { data, isLoading, isFetching } = useListCandidates(query);
  const delMut = useDeleteCandidate();

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar candidato?')) return;
    await delMut.mutateAsync(id);
  };

  const next = () => setQuery(q => ({ ...q, skip: (q.skip ?? 0) + (q.limit ?? 20) }));
  const prev = () => setQuery(q => ({ ...q, skip: Math.max(0, (q.skip ?? 0) - (q.limit ?? 20)) }));

  const exportCsv = () => {
    const items = (data ?? []) as Candidate[];
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
    const csv = toCsv(rows);
    downloadCsv('candidatos.csv', csv);
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Candidatos</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="border rounded-lg px-3 py-1.5 hover:bg-gray-50">
            Exportar CSV
          </button>
          <div className="text-sm text-gray-500">{isFetching ? 'Actualizando…' : null}</div>
        </div>
      </header>

      <CandidateAdvancedSearch initial={query} onChange={setQuery} />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="col-span-2 border rounded-xl p-3 space-y-3 bg-white">
          <CandidateTable data={data ?? []} loading={isLoading} onDelete={onDelete} />
          <div className="flex items-center justify-end gap-2">
            <button onClick={prev} className="border rounded px-3 py-1 disabled:opacity-50" disabled={(query.skip ?? 0) === 0}>Anterior</button>
            <button onClick={next} className="border rounded px-3 py-1">Siguiente</button>
          </div>
        </div>
        <div className="border rounded-xl p-3 bg-white">
          <h2 className="font-medium mb-2">Alta rápida</h2>
          <CandidateForm onCreated={() => setQuery(q => ({ ...q }))} />
        </div>
      </section>
    </div>
  );
}
