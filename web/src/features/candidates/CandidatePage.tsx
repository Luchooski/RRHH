import { useState } from 'react';
import CandidateForm from './CandidateForm';
import CandidateTable from '@/components/CandidateTable';
import CandidateAdvancedSearch from './CandidateAdvancedSearch';
import { useDeleteCandidate, useListCandidates } from './hooks';
import type { Candidate, CandidateQuery } from './dto';
import { toCsv, downloadCsv } from './csv';
import { Toolbar } from '@/components/ui/Toolbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CandidatesPage() {
  const [query, setQuery] = useState<Partial<CandidateQuery>>({
    limit: 20, skip: 0, sortField: 'createdAt', sortDir: 'desc',
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
      id: i.id, nombre: i.name, email: i.email, rol: i.role,
      match: i.match ?? 0, estado: i.status, creado: i.createdAt, actualizado: i.updatedAt,
    }));
    downloadCsv('candidatos.csv', toCsv(rows));
  };

  return (
    <div className="p-4 space-y-4">
      <Toolbar
        title="Candidatos"
        right={
          <>
            <Button onClick={exportCsv}>Exportar CSV</Button>
            <span className="text-sm text-gray-500">{isFetching ? 'Actualizando…' : null}</span>
          </>
        }
      />

      <Card>
        <CandidateAdvancedSearch initial={query} onChange={setQuery} />
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="col-span-2" bodyClassName="space-y-3">
          <CandidateTable data={data ?? []} loading={isLoading} onDelete={onDelete} />
          <div className="flex items-center justify-end gap-2">
            <Button onClick={prev} variant="secondary" disabled={(query.skip ?? 0) === 0}>Anterior</Button>
            <Button onClick={next} variant="secondary">Siguiente</Button>
          </div>
        </Card>

        <Card title="Alta rápida">
          <CandidateForm onCreated={() => setQuery(q => ({ ...q }))} />
        </Card>
      </div>
    </div>
  );
}
