import { useState } from 'react';
import type { CandidateQuery } from './dto';

type Props = {
  initial?: Partial<CandidateQuery>;
  onChange: (q: Partial<CandidateQuery>) => void;
};

export default function CandidateAdvancedSearch({ initial, onChange }: Props) {
  const [local, setLocal] = useState<Partial<CandidateQuery>>({
    q: '', status: '', role: '',
    matchMin: undefined, matchMax: undefined,
    createdFrom: '', createdTo: '',
    sortField: 'createdAt', sortDir: 'desc',
    limit: 20, skip: 0,
    ...initial,
  });

  const update = (patch: Partial<CandidateQuery>) =>
    setLocal(prev => ({ ...prev, ...patch }));

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    onChange({
      ...local,
      q: local.q || undefined,
      status: local.status || undefined,
      role: local.role || undefined,
      createdFrom: local.createdFrom || undefined,
      createdTo: local.createdTo || undefined,
      skip: 0,
    });
  };

  return (
    <form onSubmit={apply} className="border rounded-xl p-3 space-y-3 bg-white">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={local.q ?? ''}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Buscar (nombre, email, rol, estado)"
          className="border rounded px-3 py-2"
          aria-label="Buscar"
        />

        <input
          value={local.role ?? ''}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="Rol (ej. Backend)"
          className="border rounded px-3 py-2"
          aria-label="Rol"
        />

        <select
          value={local.status ?? ''}
          onChange={(e) => update({ status: e.target.value || undefined })}
          className="border rounded px-3 py-2"
          aria-label="Estado"
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Entrevista">Entrevista</option>
          <option value="Offer">Offer</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>

        <input
          type="number"
          value={local.matchMin ?? ''}
          onChange={(e) => update({ matchMin: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Match mín."
          className="border rounded px-3 py-2"
          aria-label="Match mínimo"
          min={0} max={100}
        />
        <input
          type="number"
          value={local.matchMax ?? ''}
          onChange={(e) => update({ matchMax: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Match máx."
          className="border rounded px-3 py-2"
          aria-label="Match máximo"
          min={0} max={100}
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={local.createdFrom ?? ''}
            onChange={(e) => update({ createdFrom: e.target.value || undefined })}
            className="border rounded px-3 py-2 w-full"
            aria-label="Desde fecha"
          />
          <input
            type="date"
            value={local.createdTo ?? ''}
            onChange={(e) => update({ createdTo: e.target.value || undefined })}
            className="border rounded px-3 py-2 w-full"
            aria-label="Hasta fecha"
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={local.sortField ?? 'createdAt'}
            onChange={(e) => update({ sortField: e.target.value as any })}
            className="border rounded px-3 py-2 w-full"
            aria-label="Ordenar por"
          >
            <option value="createdAt">Fecha</option>
            <option value="match">Match</option>
            <option value="name">Nombre</option>
            <option value="role">Rol</option>
            <option value="status">Estado</option>
          </select>
          <select
            value={local.sortDir ?? 'desc'}
            onChange={(e) => update({ sortDir: e.target.value as any })}
            className="border rounded px-3 py-2 w-full"
            aria-label="Dirección de orden"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <select
          value={local.limit ?? 20}
          onChange={(e) => update({ limit: Number(e.target.value), skip: 0 })}
          className="border rounded px-3 py-2"
          aria-label="Items por página"
        >
          {[10,20,50,100].map(n => <option key={n} value={n}>{n}/pág</option>)}
        </select>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setLocal({ ...initial, limit: 20, skip: 0, sortField: 'createdAt', sortDir: 'desc' }); onChange({}); }}
          className="border rounded px-3 py-2"
        >
          Limpiar
        </button>
        <button type="submit" className="border rounded px-3 py-2 bg-gray-50 hover:bg-gray-100">
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}
