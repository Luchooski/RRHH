import { createContext, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import { setToken, onUnauthorized } from '../../lib/http';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY_USER = 'auth_user';

// Refresh token 2 minutos antes de que expire (access token dura 15 min)
const REFRESH_BEFORE_EXPIRY = 13 * 60 * 1000; // 13 minutos

export function AuthProvider({ children }: { children: ReactNode }) {
  const { push } = useToast();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(KEY_USER);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Auto-refresh token
  const scheduleTokenRefresh = () => {
    // Limpiar timer anterior
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Programar refresh en 13 minutos
    refreshTimerRef.current = setTimeout(async () => {
      try {
        await api.refresh();
        // Después del refresh, programar el siguiente
        scheduleTokenRefresh();
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Si falla el refresh, dejar que el 401 maneje el logout
      }
    }, REFRESH_BEFORE_EXPIRY);
  };

  // Refrescar "me" al montar si hay token
  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me);
        localStorage.setItem(KEY_USER, JSON.stringify(me));
        // Iniciar auto-refresh
        scheduleTokenRefresh();
      } catch {
        // sin token o inválido → ignorar
      } finally {
        setLoading(false);
      }
    })();

    // Cleanup
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Capturar 401 globales
  useEffect(() => {
    onUnauthorized(() => {
      setToken(null);
      setUser(null);
      try { localStorage.removeItem(KEY_USER); } catch {}
      // Limpiar timer de refresh
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
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
        const res = await api.login({ email, password });

        // El backend ahora devuelve el user directamente con tokens en cookies
        if (res.user) {
          setUser(res.user);
          localStorage.setItem(KEY_USER, JSON.stringify(res.user));
          // Iniciar auto-refresh después del login
          scheduleTokenRefresh();
        } else {
          // Fallback: si aún devuelve token (compatibilidad)
          if (res.token) {
            setToken(res.token);
          }
          const me = await api.me();
          setUser(me);
          localStorage.setItem(KEY_USER, JSON.stringify(me));
          scheduleTokenRefresh();
        }
      } finally {
        setLoading(false);
      }
    },
    async logout() {
      try {
        await api.logout(); // server borra cookie
      } catch {
        // ignorar
      } finally {
        setToken(null);
        setUser(null);
        try { localStorage.removeItem(KEY_USER); } catch {}
        // Limpiar timer de refresh
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
        }
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
