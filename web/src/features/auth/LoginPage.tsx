import { useState } from 'react';
import { z } from 'zod';
import { useAuth } from './auth';
import { useNavigate } from 'react-router-dom';

const Schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = Schema.safeParse({ email, password });
    if (!parsed.success) {
      // Evitamos depender de .issues por diferencias de versión
      setError(parsed.error.message || 'Datos inválidos');
      return;
    }

    try {
      setBusy(true);
      await login(email, password);           // guarda token+user
      navigate('/', { replace: true });       // navega sin recargar
    } catch (err: any) {
      setError(err?.message || 'Error de login');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-lg font-semibold mb-4">Ingresar</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs">Email</label>
          <input
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="text-xs">Password</label>
          <input
            className="input w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <div className="text-red-600 text-xs">{error}</div>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
