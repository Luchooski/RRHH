import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { http, setToken, getToken, setOnUnauthorized } from '../../lib/http';

type User = { id: string; email: string; role: string };

type AuthCtx = {
  user: User | null;
  loading: boolean; // 👈 cargando sesión inicial
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY_USER = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(KEY_USER);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // 401 global: si alguna llamada devuelve 401, limpiamos sesión
  useEffect(() => {
    setOnUnauthorized(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem(KEY_USER);
    });
    return () => setOnUnauthorized(null);
  }, []);

  // Restaurar sesión al montar: si hay token, pedimos /auth/me
  useEffect(() => {
    const t = getToken();
    if (!t) { setLoading(false); return; }
    (async () => {
      try {
        const u = await http.get<User>('/api/v1/auth/me');
        setUser(u);
        localStorage.setItem(KEY_USER, JSON.stringify(u));
      } catch {
        // token inválido/expirado
        setToken(null);
        setUser(null);
        localStorage.removeItem(KEY_USER);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    loading,
    async login(email: string, password: string) {
      const res = await http.post<{ token: string; user: User }>(
        '/api/v1/auth/login',
        { email, password },
        { auth: false } // no adjunta Authorization en login
      );
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem(KEY_USER, JSON.stringify(res.user));
    },
    logout() {
      setToken(null);
      setUser(null);
      localStorage.removeItem(KEY_USER);
    },
  }), [user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
