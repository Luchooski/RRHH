
import { useState } from 'react';
//import { useQuery } from '@tanstack/react-query';
//import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Send, Plus, Search, Filter, Users, AlertCircle, X } from 'lucide-react';
//import { listCandidates, deleteCandidate } from './api';
//import { useDeleteCandidate } from './hooks';


// ============================================
// TIPOS (reemplazar con tus tipos reales de ./schemas)
// ============================================
type CandidateOut = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  seniority?: 'jr' | 'ssr' | 'sr';
  skills: string[];
  languages?: string[];
  salary?: number;
  avatarUrl?: string;
  notes?: string;
  tags: string[];
  links: Array<{ label?: string; url: string }>;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  pipelineHistory: Array<{ stage: string; at: string; by?: string; note?: string }>;
  comments: Array<{ text: string; by?: string; at: string }>;
  reminders: Array<{ note: string; at: string; done?: boolean }>;
  customFields?: Record<string, any>;
  archivedAt: string | null;
  source?: string;
  createdAt: string;
  updatedAt: string;
};

type CandidateList = {
  items: CandidateOut[];
  total: number;
  page: number;
  limit: number;
};

type QueryParams = {
  q?: string;
  seniority?: string;
  status?: string;
  page: number;
  limit: number;
};

// ============================================
// FUNCIONES API (reemplazar con tus funciones reales de ./api)
// ============================================
const BASE = import.meta.env.VITE_API_URL || '';

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { credentials: 'include', ...init, headers });
  if (!res.ok) {
    let msg = 'Request error';
    try {
      const j = await res.json();
      msg = (j as any)?.error ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

async function listCandidates(params?: QueryParams): Promise<CandidateList> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.seniority) qs.set('seniority', params.seniority);
  if (params?.status) qs.set('status', params.status);
  return http<CandidateList>(`${BASE}/api/v1/candidates${qs.toString() ? `?${qs}` : ''}`);
}

async function deleteCandidate(id: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`${BASE}/api/v1/candidates/${id}`, { method: 'DELETE' });
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CandidatesPage() {
  // NOTA: Descomenta y usa useNavigate de react-router-dom
  // const nav = useNavigate();
  const nav = (path: string) => console.log('Navigate to:', path); // Placeholder

  const [query, setQuery] = useState<QueryParams>({ page: 1, limit: 20 });
  const [selection, setSelection] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toSend, setToSend] = useState<string | null>(null);

  // Estado manual para simular useQuery (REEMPLAZAR con useQuery real)
  const [data, setData] = useState<CandidateList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Cargar datos al montar y cuando cambie query
  useState(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        const result = await listCandidates(query);
        setData(result);
      } catch (error) {
        console.error('Error loading candidates:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  });

  // REEMPLAZAR ESTO con useQuery real:
  // const { data, isLoading, isError, refetch } = useQuery({
  //   queryKey: ['candidates', query],
  //   queryFn: () => listCandidates(query),
  //   staleTime: 60_000,
  // });

  // REEMPLAZAR ESTO con useDeleteCandidate real:
  // const deleteMutation = useDeleteCandidate();
  const deleteMutation = {
    mutate: async (id: string, options?: { onSuccess?: () => void }) => {
      try {
        await deleteCandidate(id);
        options?.onSuccess?.();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Error al eliminar candidato');
      }
    },
    isPending: false,
  };

  const refetch = async () => {
    try {
      setIsLoading(true);
      const result = await listCandidates(query);
      setData(result);
    } catch (error) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (data?.limit ?? 20)));

  const handleSearch = () => {
    setQuery(prev => ({ ...prev, q: searchInput, page: 1 }));
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este candidato?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setSelection(prev => prev.filter(s => s !== id));
          refetch();
        },
      });
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`¿Eliminar ${selection.length} candidato(s) seleccionado(s)?`)) {
      try {
        for (const id of selection) {
          await deleteCandidate(id);
        }
        setSelection([]);
        refetch();
      } catch (error) {
        console.error('Error al eliminar candidatos:', error);
        alert('Error al eliminar algunos candidatos');
      }
    }
  };

  const toggleSelection = (id: string) => {
    setSelection(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelection(prev => (prev.length === items.length ? [] : items.map(i => i.id)));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      screening: 'bg-yellow-100 text-yellow-700',
      interview: 'bg-purple-100 text-purple-700',
      offer: 'bg-green-100 text-green-700',
      hired: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      new: 'Nuevo',
      screening: 'Screening',
      interview: 'Entrevista',
      offer: 'Oferta',
      hired: 'Contratado',
      rejected: 'Rechazado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getSeniorityLabel = (seniority?: string) => {
    const labels = { jr: 'Junior', ssr: 'Semi-Senior', sr: 'Senior' };
    return seniority ? labels[seniority as keyof typeof labels] : '-';
  };

  const stats = {
    total: total,
    new: items.filter(i => i.status === 'new').length,
    inProcess: items.filter(i => ['screening', 'interview'].includes(i.status)).length,
    hired: items.filter(i => i.status === 'hired').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
              <p className="mt-1 text-sm text-gray-600">Gestiona tu base de talentos</p>
            </div>
            <button
              onClick={() => nav('/candidatos/nuevo')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              <Plus className="h-5 w-5" />
              Nuevo Candidato
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nuevos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-2">
                <div className="h-4 w-4 rounded-full bg-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En proceso</p>
                <p className="text-2xl font-bold text-purple-600">{stats.inProcess}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-2">
                <div className="h-4 w-4 rounded-full bg-purple-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contratados</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.hired}</p>
              </div>
              <div className="rounded-full bg-emerald-100 p-2">
                <div className="h-4 w-4 rounded-full bg-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, skills..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={handleSearch}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Buscar
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Seniority</label>
                <select
                  value={query.seniority || ''}
                  onChange={e => setQuery({ ...query, seniority: e.target.value || undefined, page: 1 })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Todos</option>
                  <option value="jr">Junior</option>
                  <option value="ssr">Semi-Senior</option>
                  <option value="sr">Senior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={query.status || ''}
                  onChange={e => setQuery({ ...query, status: e.target.value || undefined, page: 1 })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Todos</option>
                  <option value="new">Nuevo</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Entrevista</option>
                  <option value="offer">Oferta</option>
                  <option value="hired">Contratado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
            </div>
          )}

          {selection.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-600">{selection.length} seleccionado(s)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelection([])}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-12 w-12" />
              <p className="text-sm">Error al cargar candidatos</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
              <Users className="h-12 w-12" />
              <p className="text-sm">No se encontraron candidatos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selection.length === items.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Candidato</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Contacto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Seniority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selection.includes(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                            {item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {getSeniorityLabel(item.seniority)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {skill}
                            </span>
                          ))}
                          {item.skills.length > 3 && (
                            <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              +{item.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setToSend(item.id)} className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50" title="Enviar a vacante">
                            <Send className="h-4 w-4" />
                          </button>
                          <button onClick={() => nav(`/candidatos/${item.id}/editar`)} className="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100" title="Editar">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {(query.page - 1) * query.limit + 1} a {Math.min(query.page * query.limit, total)} de {total} resultados
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}
                disabled={query.page <= 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}
                disabled={query.page >= pages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {toSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enviar candidato a vacante</h3>
              <button onClick={() => setToSend(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">Funcionalidad en desarrollo...</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setToSend(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}