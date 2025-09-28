import { useState } from 'react';
import type { CandidateCreateInput } from '../features/candidates/dto';
import { CandidateCreateSchema } from '../features/candidates/dto';
import { useCreateCandidate } from '../features/candidates/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';

type Props = { onCreated?: () => void };

export default function CandidateForm({ onCreated }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CandidateCreateInput>({
    resolver: zodResolver(CandidateCreateSchema),
    defaultValues: { status: 'Activo' },
  });

  const createMut = useCreateCandidate();
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<CandidateCreateInput> = async (data) => {
    setError(null);
    try {
      await createMut.mutateAsync(data);
      reset();
      onCreated?.();
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear candidato');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-3 border rounded-xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col">
          <span className="text-sm">Nombre</span>
          <input
            className="border rounded px-3 py-2"
            {...register('name')}
            placeholder="Ada Lovelace"
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className="text-red-600 text-xs">{errors.name.message}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Email</span>
          <input
            className="border rounded px-3 py-2"
            {...register('email')}
            placeholder="ada@example.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="text-red-600 text-xs">{errors.email.message}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Rol</span>
          <input
            className="border rounded px-3 py-2"
            {...register('role')}
            placeholder="Backend"
            aria-invalid={!!errors.role}
          />
          {errors.role && <span className="text-red-600 text-xs">{errors.role.message}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Match (0-100)</span>
          <input
            className="border rounded px-3 py-2"
            type="number"
            {...register('match', { valueAsNumber: true })}
            placeholder="80"
            aria-invalid={!!errors.match}
          />
          {errors.match && <span className="text-red-600 text-xs">{errors.match.message}</span>}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting || createMut.isPending}
          className="rounded-lg px-4 py-2 border hover:bg-gray-50 disabled:opacity-60"
        >
          {createMut.isPending ? 'Creando…' : 'Crear candidato'}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
        {createMut.isSuccess && <span className="text-green-700 text-sm">Creado ✅</span>}
      </div>
    </form>
  );
}
