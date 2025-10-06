import type { ClientDTO, ClientListQuery, Paginated } from './Client.schema';

const BASE = import.meta.env.VITE_API_URL || '';

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  } as RequestInit);
  if (!res.ok) {
    let msg = 'Request error';
    try { const j = await res.json(); msg = j?.error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function getClients(qs: ClientListQuery = {}): Promise<Paginated<ClientDTO>> {
  const params = new URLSearchParams();
  if (qs.q) params.set('q', qs.q);
  if (qs.size) params.set('size', qs.size);
  if (qs.industry && qs.industry !== 'Todos') params.set('industry', qs.industry);
  params.set('page', String(qs.page ?? 1));
  params.set('limit', String(qs.limit ?? 20));
  return http<Paginated<ClientDTO>>(`${BASE}/api/v1/clients?${params.toString()}`);
}

export async function getClientById(id: string): Promise<ClientDTO> {
  return http<ClientDTO>(`${BASE}/api/v1/clients/${id}`);
}

export async function createClient(payload: Omit<ClientDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientDTO> {
  return http<ClientDTO>(`${BASE}/api/v1/clients`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateClient(id: string, payload: Partial<Omit<ClientDTO, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ClientDTO> {
  return http<ClientDTO>(`${BASE}/api/v1/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteClient(id: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`${BASE}/api/v1/clients/${id}`, { method: 'DELETE' });
}
