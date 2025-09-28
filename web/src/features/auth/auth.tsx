import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setToken, onUnauthorized } from '../../lib/http';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

type User = { id: string; email: string; role: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY_USER = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { push } = useToast();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(KEY_USER);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Refrescar "me" al montar si hay token
  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me);
        localStorage.setItem(KEY_USER, JSON.stringify(me));
      } catch {
        // sin token o inválido → ignorar
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Capturar 401 globales
  useEffect(() => {
    onUnauthorized(() => {
      setToken(null);
      setUser(null);
      try { localStorage.removeItem(KEY_USER); } catch {}
      push({ kind: 'info', message: 'Sesión expirada.' });
    });
    return () => onUnauthorized(null);
  }, [push]);

  const value = useMemo<AuthCtx>(() => ({
    user,
    loading,
    async login(email, password) {
      setLoading(true);
      try {
        const { token } = await api.login({ email, password });
        setToken(token);
        const me = await api.me();
        setUser(me);
        localStorage.setItem(KEY_USER, JSON.stringify(me));
      } finally {
        setLoading(false);
      }
    },
    async logout() {
      try {
        await api.logout(); // server borra cookie si aplica
      } catch {
        // ignorar
      } finally {
        setToken(null);
        setUser(null);
        try { localStorage.removeItem(KEY_USER); } catch {}
        push({ kind: 'info', message: 'Sesión cerrada.' });
      }
    },
  }), [user, loading, push]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
