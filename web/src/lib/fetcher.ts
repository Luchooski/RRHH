const API_FROM_ENV = import.meta.env.VITE_API_URL as string | undefined;

// Fallback seguro y aviso en consola para no volvernos locos al depurar
const API = API_FROM_ENV && API_FROM_ENV.trim().length > 0
  ? API_FROM_ENV
  : 'http://localhost:4000';

if (!API_FROM_ENV) {
  // Mensaje visible 1 sola vez
  console.warn('[match-hire] VITE_API_URL no está definido. Usando fallback:', API);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!res.ok) {
    // Error más descriptivo para depurar (status + url completa)
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} at ${url} ${text ? `→ ${text}` : ''}`);
  }
  return (await res.json()) as T;
}
