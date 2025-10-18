import { useEffect, useMemo, useState } from 'react';
import { Search, Download, UserPlus, X } from 'lucide-react';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import type { CandidateOut } from '../schemas';
import { exportCandidatesCsv } from '../utils/export';
import CsvImport from '../CsvImport';

type Props = {
  total?: number;
  onQueryChange: (params: { q?: string; seniority?: string }) => void;
  selected: CandidateOut[];
  onClearSelection: () => void;
  onCreateNew: () => void;
};

export default function CandidatesToolbar({
  total,
  onQueryChange,
  selected,
  onClearSelection,
  onCreateNew,
}: Props) {
  const [q, setQ] = useState('');
  const [seniority, setSeniority] = useState('');
  const debouncedQ = useDebouncedValue(q, 400);

  useEffect(() => {
    onQueryChange({ q: debouncedQ || undefined, seniority: seniority || undefined });
  }, [debouncedQ, seniority]); // eslint-disable-line

  const selectionInfo = useMemo(() => {
    if (!selected.length) return null;
    return (
      <div className="rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 flex items-center gap-2">
        {selected.length} seleccionados
        <button className="hover:opacity-80" onClick={onClearSelection} title="Limpiar selección">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }, [selected.length, onClearSelection]);

  return (
    <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Candidatos</h1>
          <span className="text-sm text-[--color-muted]">· {total ?? 0} resultados</span>
          {selectionInfo}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={onCreateNew}>
            <UserPlus className="size-4 mr-2" /> Nuevo
          </button>
          <button
            className="btn"
            onClick={() => exportCandidatesCsv(selected.length ? selected : [])}
            disabled={!selected.length}
            title={selected.length ? 'Exportar selección' : 'Seleccioná filas para exportar'}
          >
            <Download className="size-4 mr-2" />
            Exportar CSV
          </button>
          <CsvImport onRows={(rows) => console.log('CSV import rows', rows)} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex items-center gap-2">
          <Search className="size-4 opacity-60" />
          <input
            className="input flex-1"
            placeholder="Buscar por nombre, email, skill, tag…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar candidatos"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Seniority</label>
          <select
            className="input flex-1"
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
            aria-label="Filtro de seniority"
          >
            <option value="">Todos</option>
            <option value="jr">JR</option>
            <option value="ssr">SSR</option>
            <option value="sr">SR</option>
          </select>
        </div>
        <div className="hidden sm:block" />
      </div>
    </div>
  );
}
