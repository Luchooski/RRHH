import { useMemo, useState } from 'react';
import type { CandidateOut } from '../schemas';
import { Link } from 'react-router-dom';
import { Pencil, Send, Trash2 } from 'lucide-react';

type Props = {
  items: CandidateOut[];
  isLoading?: boolean;
  isError?: boolean;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
  onEdit: (id: string) => void;
  selection: string[];
  setSelection: (ids: string[]) => void;
};

export default function CandidatesTable({
  items,
  isLoading,
  isError,
  onDelete,
  onSend,
  onEdit,
  selection,
  setSelection,
}: Props) {
  const [sortField, setSortField] = useState<'createdAt' | 'name' | 'seniority'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleAll = (checked: boolean) => setSelection(checked ? items.map((i) => i.id) : []);
  const toggleOne = (id: string, checked: boolean) =>
    setSelection(checked ? Array.from(new Set([...selection, id])) : selection.filter((x) => x !== id));

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const va = sortField === 'name' ? a.name : sortField === 'seniority' ? (a.seniority ?? '') : a.createdAt;
      const vb = sortField === 'name' ? b.name : sortField === 'seniority' ? (b.seniority ?? '') : b.createdAt;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return copy;
  }, [items, sortField, sortDir]);

  const header = (label: string, field: typeof sortField) => (
    <button
      className="text-left p-3 hover:underline"
      onClick={() => {
        if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDir('asc'); }
      }}
      title="Ordenar"
    >
      {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );

  return (
    <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-0 shadow-sm overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-zinc-500">
          <tr>
            <th className="p-3">
              <input
                type="checkbox"
                aria-label="Seleccionar todos"
                checked={selection.length > 0 && selection.length === items.length}
                onChange={(e) => toggleAll(e.target.checked)}
              />
            </th>
            <th>{header('Nombre', 'name')}</th>
            <th className="text-left p-3">{header('Email', 'name')}</th>
            <th className="text-left p-3">{header('Seniority', 'seniority')}</th>
            <th className="text-left p-3">Skills</th>
            <th className="text-left p-3">{header('Fecha', 'createdAt')}</th>
            <th className="text-left p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td className="p-6" colSpan={7}>Cargando…</td></tr>
          ) : isError ? (
            <tr><td className="p-6 text-red-600" colSpan={7}>No se pudo cargar.</td></tr>
          ) : sorted.length ? (
            sorted.map((c) => {
              const checked = selection.includes(c.id);
              return (
                <tr key={c.id} className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${c.name}`}
                      checked={checked}
                      onChange={(e) => toggleOne(c.id, e.target.checked)}
                    />
                  </td>
                  <td className="p-3">
                    <Link to={`/candidatos/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                  </td>
                  <td className="p-3 truncate">{c.email}</td>
                  <td className="p-3 uppercase">{c.seniority ?? '—'}</td>
                  <td className="p-3 truncate">{(c.skills ?? []).slice(0, 6).join(', ')}</td>
                  <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="btn" onClick={() => onSend(c.id)} title="Enviar a vacante">
                        <Send className="size-4" />
                      </button>
                      <button className="btn" onClick={() => onEdit(c.id)} title="Editar">
                        <Pencil className="size-4" />
                      </button>
                      <button className="btn" onClick={() => onDelete(c.id)} title="Borrar">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td className="p-6 text-center text-zinc-500" colSpan={7}>Sin candidatos.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
