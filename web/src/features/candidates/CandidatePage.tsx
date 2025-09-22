import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  type Candidate,
  type CandidateInput,
} from './api';

import { CandidateInputSchema } from './schema';

import Modal from '../../components/Modal';
import CandidateForm from './CandidateForm';
import CandidateCard from './CandidateCard';
import StatusBadge from '../../components/StatusBadge';
import KebabMenu from '../../components/KebabMenu';
import Pagination from '../../components/Pagination';
import { pushHistory } from '../history/HistoryDrawer';

const PAGE_SIZE = 10 as const;
const ESTADOS = ['Todos', 'Activo', 'Entrevistado', 'Oferta', 'Rechazado', 'Pausado'] as const;

export default function CandidatePage() {
  const qc = useQueryClient();

  // Trae un array de Candidate
  const { data = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: getCandidates,
  });

  const rows: Candidate[] = data;

  // UI state
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Candidate | null>(null);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<string>('Todos');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Mutations
  const onMutSuccess = (msg: string) => {
    qc.invalidateQueries({ queryKey: ['candidates'] });
    setOpen(false);
    setEdit(null);
    pushHistory(msg);
  };

  const mCreate = useMutation({
    mutationFn: (payload: CandidateInput) => createCandidate(payload),
    onSuccess: () => onMutSuccess('Creó candidato'),
  });

  const mUpdate = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CandidateInput> }) =>
      updateCandidate(id, payload),
    onSuccess: () => onMutSuccess('Editó candidato'),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => onMutSuccess('Borró candidato'),
  });

  // Filtros y búsqueda
  const filtered: Candidate[] = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((c) =>
        estado === 'Todos'
          ? true
          : (c.status ?? '').toLowerCase() === estado.toLowerCase()
      )
      .filter((c) =>
        term
          ? `${c.name ?? ''} ${c.email ?? ''} ${c.role ?? ''}`
              .toLowerCase()
              .includes(term)
          : true
      );
  }, [rows, search, estado]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Selección múltiple
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  const toggleAll = (checked: boolean) => {
    const ids = Object.fromEntries(pageData.map((row) => [row.id, checked]));
    setSelected((prev) => ({ ...prev, ...ids }));
  };

  return (
    <div className="p-6 space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">Candidatos</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            className="input w-full md:w-64"
            placeholder="Buscar por nombre, email o rol…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="input w-full md:w-40"
            value={estado}
            onChange={(e) => {
              setPage(1);
              setEstado(e.target.value);
            }}
            aria-label="Filtrar por estado"
          >
            {ESTADOS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="btn btn-primary touch-target" onClick={() => setOpen(true)}>
              Añadir
            </button>
            {!!selectedIds.length && (
              <button
                className="btn touch-target"
                onClick={async () => {
                  if (!confirm(`Borrar ${selectedIds.length} candidatos?`)) return;
                  await Promise.all(selectedIds.map((id) => mDelete.mutateAsync(id)));
                  setSelected({});
                  pushHistory(`Borró ${selectedIds.length} candidatos`);
                }}
              >
                Borrar seleccionados
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Loading / Empty (móvil) */}
      {isLoading && (
        <section className="grid grid-cols-1 gap-3 md:hidden">
          <div className="card p-6 animate-pulse">Cargando…</div>
          <div className="card p-6 animate-pulse">Cargando…</div>
        </section>
      )}

      {/* LISTA MÓVIL: tarjetas */}
      {!isLoading && (
        <section className="grid grid-cols-1 gap-3 md:hidden">
          {pageData.length ? (
            pageData.map((c: Candidate) => (
              <CandidateCard
                key={c.id}
                c={c}
                onEdit={() => {
                  setEdit(c);
                  setOpen(true);
                }}
                onDelete={() => mDelete.mutate(c.id)}
              />
            ))
          ) : (
            <div className="card p-6 text-center text-zinc-500">
              No hay resultados con los filtros actuales.
            </div>
          )}
        </section>
      )}

      {/* TABLA DESKTOP */}
      {!isLoading && (
        <section className="card p-0 overflow-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="p-3">
                  <input
                    aria-label="Seleccionar todos"
                    type="checkbox"
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-left p-3">Match</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Actualizado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((c: Candidate) => (
                <tr
                  key={c.id}
                  className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={!!selected[c.id]}
                      onChange={(e) =>
                        setSelected((prev) => ({ ...prev, [c.id]: e.target.checked }))
                      }
                      aria-label={`Seleccionar ${c.name}`}
                    />
                  </td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.role}</td>
                  <td className="p-3">{`${c.match}%`}</td>
                  <td className="p-3">
                    <StatusBadge value={c.status} />
                  </td>
                  <td className="p-3">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <KebabMenu
                      items={[
                        {
                          label: 'Editar',
                          onClick: () => {
                            setEdit(c);
                            setOpen(true);
                          },
                        },
                        {
                          label: 'Borrar',
                          danger: true,
                          onClick: () => mDelete.mutate(c.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!pageData.length && (
                <tr>
                  <td className="p-6 text-center text-zinc-500" colSpan={8}>
                    No hay resultados con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Paginación */}
      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEdit(null);
        }}
        title={edit ? 'Editar candidato' : 'Nuevo candidato'}
      >
        <CandidateForm
          initial={edit ?? undefined}
          onSubmit={(payload) => {
            if (edit) {
              // edición parcial
              mUpdate.mutate({ id: edit.id, payload });
            } else {
              // alta: validar con Zod para generar CandidateInput correcto
              const dataParsed = CandidateInputSchema.parse({
                name: payload.name,
                email: payload.email,
                role: payload.role,
                match: payload.match,      // opcional por .partial()
                status: payload.status,    // opcional por .partial()
              });
              mCreate.mutate(dataParsed);
            }
          }}
        />
      </Modal>
    </div>
  );
}
