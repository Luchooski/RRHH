import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Trash2, FileText } from 'lucide-react';
import Empty from '@/components/ui/Empty';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { getClients, deleteClient } from './api';
import type { ClientDTO } from './client.schema';
import ClientCard from './ClientCard';

export default function ClientsPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  // Filtros y paginación
  const [q, setQ] = useState('');
  const [size, setSize] = useState<'Todos' | 'small' | 'medium' | 'large'>('Todos');
  const [industry, setIndustry] = useState<string>('Todos');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients', { q, size, industry, page, limit }],
    queryFn: () => getClients({
      q,
      size: size === 'Todos' ? undefined : size,
      industry: industry === 'Todos' ? undefined : industry,
      page,
      limit
    })
  });

  const items: ClientDTO[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? limit;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const industries = useMemo(() => {
    // Para construir el combo cuando haya datos (best-effort)
    const set = new Set<string>();
    items.forEach(c => c.industry && set.add(c.industry));
    return ['Todos', ...Array.from(set).sort()];
  }, [items]);

  const mDelete = useMutation({
    mutationFn: async (id: string) => { await deleteClient(id); return id; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] })
  });

  const askDelete = async (id: string, name: string) => {
    const ok = await confirm({
      tone: 'danger',
      title: 'Eliminar cliente',
      message: <>¿Seguro que querés eliminar a <b>{name}</b>? Esta acción no se puede deshacer.</>
    });
    if (ok) mDelete.mutate(id);
  };

  const resetFilters = () => { setQ(''); setSize('Todos'); setIndustry('Todos'); setPage(1); };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        {/* Header */}
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
              <p className="text-sm text-[--color-muted]">Gestión de empresas clientes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/clientes/nuevo" className="btn btn-primary">
                <Plus className="size-4 mr-2" /> Nuevo cliente
              </Link>
              <Link to="/reportes" className="btn">
                <FileText className="size-4 mr-2" /> Exportar
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="input flex items-center gap-2">
              <Search className="size-4 opacity-70" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                placeholder="Buscar por nombre, contacto, email o industria…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                aria-label="Buscar"
              />
            </label>

            <label className="input flex items-center gap-2">
              <Filter className="size-4 opacity-70" />
              <select
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={industry}
                onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
                aria-label="Filtrar por industria"
              >
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>

            <label className="input flex items-center gap-2">
              <Filter className="size-4 opacity-70" />
              <select
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={size}
                onChange={(e) => { setSize(e.target.value as any); setPage(1); }}
                aria-label="Filtrar por tamaño"
              >
                <option>Todos</option>
                <option value="small">Pequeña</option>
                <option value="medium">Mediana</option>
                <option value="large">Grande</option>
              </select>
            </label>
          </div>
        </header>

        {isError && <div className="card p-4 text-red-600">No se pudo cargar la lista.</div>}

        {/* Mobile: cards */}
        <section className="grid grid-cols-1 gap-3 md:hidden">
          {isLoading ? (
            <>
              <div className="h-24 rounded-2xl animate-pulse bg-black/5 dark:bg-white/5" />
              <div className="h-24 rounded-2xl animate-pulse bg-black/5 dark:bg-white/5" />
            </>
          ) : items.length ? (
            items.map((c) => (
              <ClientCard
                key={c.id}
                name={c.name}
                industry={c.industry}
                size={c.size}
                contactName={c.contactName}
                contactEmail={c.contactEmail}
                contactPhone={c.contactPhone ?? undefined}
                right={
                  <div className="flex items-center gap-1">
                    <Link to={`/clientes/${c.id}`} className="btn btn-ghost">Ver</Link>
                    <button className="btn btn-ghost" onClick={() => askDelete(c.id, c.name)} aria-label={`Eliminar ${c.name}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                }
              />
            ))
          ) : (
            <Empty
              title="Sin clientes aún"
              description="Creá tu primer empresa cliente para empezar a operar."
              action={<Link to="/clientes/nuevo" className="btn btn-primary">Nuevo cliente</Link>}
            />
          )}
        </section>

        {/* Desktop: tabla */}
        <section className="hidden md:block rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-0 shadow-sm overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left p-3">Empresa</th>
                <th className="text-left p-3">Industria</th>
                <th className="text-left p-3">Tamaño</th>
                <th className="text-left p-3">Contacto</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Teléfono</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-6" colSpan={7}>Cargando…</td></tr>
              ) : items.length ? (
                items.map((c) => (
                  <tr key={c.id} className="border-t border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.industry ?? '—'}</td>
                    <td className="p-3">{c.size === 'small' ? 'Pequeña' : c.size === 'medium' ? 'Mediana' : 'Grande'}</td>
                    <td className="p-3">{c.contactName}</td>
                    <td className="p-3">{c.contactEmail}</td>
                    <td className="p-3">{c.contactPhone ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/clientes/${c.id}`} className="btn btn-ghost">Ver</Link>
                        <button className="btn" onClick={() => askDelete(c.id, c.name)}>
                          <Trash2 className="size-4 mr-1" /> Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6" colSpan={7}>
                    <Empty
                      title="Sin clientes"
                      description="No encontramos empresas con esos filtros."
                      action={<button onClick={resetFilters} className="btn">Limpiar filtros</button>}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Paginación */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-[--color-muted]">Página {page} de {totalPages}</span>
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}
