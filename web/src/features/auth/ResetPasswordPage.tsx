import React, { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { z } from 'zod';
import { http } from '@/lib/http';

const ResetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
  const { push } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!token) {
      push({
        kind: 'error',
        title: 'Token inválido',
        message: 'No se encontró el token de recuperación. Solicita un nuevo enlace.',
      });
      return;
    }

    setSubmitting(true);
    setErrors({});

    const f = e.target as HTMLFormElement;
    const d = new FormData(f);
    const raw = {
      newPassword: String(d.get('newPassword') || ''),
      confirmPassword: String(d.get('confirmPassword') || ''),
    };

    const parsed = ResetPasswordSchema.safeParse(raw);

    if (!parsed.success) {
      const fe: typeof errors = {};
      for (const iss of parsed.error.issues) {
        fe[iss.path[0] as 'newPassword' | 'confirmPassword'] = iss.message;
      }
      setErrors(fe);
      passwordRef.current?.focus();
      setSubmitting(false);
      return;
    }

    try {
      await http.post<{ ok: boolean; message: string }>(
        '/api/v1/auth/reset-password',
        { token, newPassword: parsed.data.newPassword }
      );
      setSuccess(true);
      push({
        kind: 'success',
        title: 'Contraseña actualizada',
        message: 'Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      push({
        kind: 'error',
        title: 'Error',
        message: err?.message?.toString?.() ?? 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.',
      });
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <h1 className="text-2xl font-semibold mb-2 text-red-900 dark:text-red-100">
            Token inválido
          </h1>
          <p className="text-red-800 dark:text-red-200 mb-6">
            No se encontró el token de recuperación. Por favor, solicita un nuevo enlace de recuperación de contraseña.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
          <h1 className="text-2xl font-semibold mb-2 text-green-900 dark:text-green-100">
            ¡Contraseña actualizada!
          </h1>
          <p className="text-green-800 dark:text-green-200 mb-4">
            Tu contraseña ha sido actualizada correctamente.
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mb-6">
            Redirigiendo al login...
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700 transition-colors"
          >
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-semibold mb-2">Restablecer contraseña</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
      </p>

      <form onSubmit={onSubmit} aria-busy={submitting} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1 block font-medium">Nueva contraseña</span>
          <input
            ref={passwordRef}
            name="newPassword"
            type="password"
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? 'err-new-password' : undefined}
          />
          {errors.newPassword && (
            <p id="err-new-password" className="mt-1 text-sm text-rose-600">
              {errors.newPassword}
            </p>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block font-medium">Confirmar contraseña</span>
          <input
            name="confirmPassword"
            type="password"
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'err-confirm-password' : undefined}
          />
          {errors.confirmPassword && (
            <p id="err-confirm-password" className="mt-1 text-sm text-rose-600">
              {errors.confirmPassword}
            </p>
          )}
        </label>

        <button
          type="submit"
          disabled={submitting}
          aria-disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white px-4 py-2.5 shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
        >
          {submitting && <Spinner label="Guardando..." />}
          <span>{submitting ? 'Guardando...' : 'Restablecer contraseña'}</span>
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿Recordaste tu contraseña?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
