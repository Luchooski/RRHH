import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { z } from 'zod';
import { http } from '@/lib/http';

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Email inválido'),
});

export default function ForgotPasswordPage() {
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{ email?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});

    const f = e.target as HTMLFormElement;
    const d = new FormData(f);
    const raw = { email: String(d.get('email') || '') };
    const parsed = ForgotPasswordSchema.safeParse(raw);

    if (!parsed.success) {
      const fe: typeof errors = {};
      for (const iss of parsed.error.issues) {
        fe[iss.path[0] as 'email'] = iss.message;
      }
      setErrors(fe);
      emailRef.current?.focus();
      setSubmitting(false);
      return;
    }

    try {
      await http.post<{ ok: boolean; message: string }>(
        '/api/v1/auth/forgot-password',
        parsed.data
      );
      setSuccess(true);
      push({
        kind: 'success',
        title: 'Email enviado',
        message: 'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.',
      });
    } catch (err: any) {
      push({
        kind: 'error',
        title: 'Error',
        message: err?.message?.toString?.() ?? 'No se pudo procesar la solicitud.',
      });
      emailRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
          <h1 className="text-2xl font-semibold mb-2 text-green-900 dark:text-green-100">
            Email enviado
          </h1>
          <p className="text-green-800 dark:text-green-200 mb-4">
            Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña en los próximos minutos.
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mb-6">
            Revisa tu bandeja de entrada y también la carpeta de spam.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700 transition-colors"
          >
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-semibold mb-2">Recuperar contraseña</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={onSubmit} aria-busy={submitting} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1 block font-medium">Email</span>
          <input
            ref={emailRef}
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            autoComplete="email"
            placeholder="tu@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'err-email' : undefined}
          />
          {errors.email && (
            <p id="err-email" className="mt-1 text-sm text-rose-600">
              {errors.email}
            </p>
          )}
        </label>

        <button
          type="submit"
          disabled={submitting}
          aria-disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white px-4 py-2.5 shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
        >
          {submitting && <Spinner label="Enviando..." />}
          <span>{submitting ? 'Enviando...' : 'Enviar enlace de recuperación'}</span>
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿Recordaste tu contraseña?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Volver al login
          </Link>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Registra tu empresa
          </Link>
        </p>
      </div>
    </div>
  );
}
