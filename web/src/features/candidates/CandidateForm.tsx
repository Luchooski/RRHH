import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
  CandidateInputSchema,
  type CandidateInput,
} from './schemas';
import { createCandidate } from './api';
import { useState } from 'react';
import z from 'zod';

/* ---------- Helpers UI ---------- */

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/10 px-2 py-1 text-xs">
      {text}
      <button
        type="button"
        onClick={onRemove}
        className="opacity-70 hover:opacity-100"
        aria-label={`Quitar ${text}`}
      >
        ×
      </button>
    </span>
  );
}

function ChipsInput({
  label,
  values,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  placeholder?: string;
}) {
  const [token, setToken] = useState('');
  const commit = () => {
    const v = token.trim();
    if (v && !values.includes(v)) onAdd(v);
    setToken('');
  };
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((t, i) => (
          <Chip key={`${t}-${i}`} text={t} onRemove={() => onRemove(i)} />
        ))}
        {!values.length && (
          <span className="text-xs text-[--color-muted]">Ninguno</span>
        )}
      </div>
      <input
        className="input w-full"
        placeholder={placeholder ?? 'Escribí y presioná Enter'}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}

/* ---------- Página ---------- */

export default function CandidateFormPage() {
  const navigate = useNavigate();

  const schema = CandidateInputSchema;
  type FormValues = z.input<typeof schema>; // <-- (2) usar INPUT type del schema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // <-- (3) resolver de zod para INPUT
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      location: '',
      seniority: undefined,
      salaryExpectation: undefined,
      resumeUrl: '',
      notes: '',
      skills: [],
      tags: [],
      links: [],
    },
  });

  // Arrays controlados
  const skills = watch('skills');
  const tags = watch('tags');

  const { fields: linkFields, append, remove } = useFieldArray({
    name: 'links',
    control,
  });

  const mCreate = useMutation({
    mutationFn: (data: CandidateInput) => createCandidate(data),
    onSuccess: () => navigate('/candidatos'),
  });

  const onSubmit = (data: CandidateInput) => mCreate.mutate(data);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Candidatos', to: '/candidatos' },
          { label: 'Nuevo' },
        ]}
      />

      <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo candidato</h1>
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          Volver
        </button>
      </header>

      <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Nombre */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Nombre</label>
            <input
              {...register('name')}
              className={['input w-full', errors.name ? 'ring-1 ring-red-500/60' : ''].join(' ')}
              placeholder="Ej: María López"
              autoFocus
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Email</label>
            <input
              {...register('email')}
              className={['input w-full', errors.email ? 'ring-1 ring-red-500/60' : ''].join(' ')}
              placeholder="nombre@correo.com"
              inputMode="email"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Teléfono */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Teléfono</label>
            <input {...register('phone')} className="input w-full" placeholder="+54 11 5555-5555" />
          </div>

          {/* Ubicación */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Ubicación</label>
            <input {...register('location')} className="input w-full" placeholder="Buenos Aires, AR" />
          </div>

          {/* Seniority */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Seniority</label>
            <select
              {...register('seniority', { setValueAs: (v) => (v === '' ? undefined : v) })}
              className="input w-full"
              defaultValue=""
            >
              <option value="">—</option>
              <option value="jr">JR</option>
              <option value="ssr">SSR</option>
              <option value="sr">SR</option>
            </select>
            {errors.seniority && (
              <p className="mt-1 text-xs text-red-500">{String(errors.seniority.message)}</p>
            )}
          </div>

          {/* Pretensión salarial */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Pretensión salarial (monto)</label>
            <input
              type="number"
              step={1}
              min={0}
              {...register('salaryExpectation', { valueAsNumber: true, setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
              className={['input w-full', errors.salaryExpectation ? 'ring-1 ring-red-500/60' : ''].join(' ')}
              placeholder="Ej: 1200000"
            />
            {errors.salaryExpectation && (
              <p className="mt-1 text-xs text-red-500">{String(errors.salaryExpectation.message)}</p>
            )}
          </div>

          {/* CV URL */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">URL de CV</label>
            <input
              {...register('resumeUrl')}
              className={['input w-full', errors.resumeUrl ? 'ring-1 ring-red-500/60' : ''].join(' ')}
              placeholder="https://..."
            />
            {errors.resumeUrl && (
              <p className="mt-1 text-xs text-red-500">{errors.resumeUrl.message as string}</p>
            )}
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Notas</label>
            <textarea
              {...register('notes')}
              className="input w-full h-28 resize-none"
              placeholder="Observaciones internas…"
            />
          </div>

          {/* Skills (chips) */}
          <div className="md:col-span-1">
            <ChipsInput
              label="Skills"
              values={watch('skills') ?? []}
              onAdd={(v) => setValue('skills', [...skills, v], { shouldDirty: true })}
              onRemove={(i) => setValue('skills', skills.filter((_, idx) => idx !== i), { shouldDirty: true })}
              placeholder="Ej: React, Node, SQL…"
            />
            {errors.skills && (
              <p className="mt-1 text-xs text-red-500">{String(errors.skills.message)}</p>
            )}
          </div>

          {/* Tags (chips) */}
          <div className="md:col-span-1">
            <ChipsInput
              label="Tags"
              values={watch('tags') ?? []}
              onAdd={(v) => setValue('tags', [...tags, v], { shouldDirty: true })}
              onRemove={(i) => setValue('tags', tags.filter((_, idx) => idx !== i), { shouldDirty: true })}
              placeholder="Ej: remoto, inglés B2…"
            />
            {errors.tags && (
              <p className="mt-1 text-xs text-red-500">{String(errors.tags.message)}</p>
            )}
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm">Links</label>
              <button type="button" className="btn btn-ghost" onClick={() => append({ label: '', url: '' })}>
                + Agregar link
              </button>
            </div>

            <div className="space-y-2">
              {linkFields.length === 0 && (
                <div className="text-xs text-[--color-muted]">Sin links agregados.</div>
              )}

              {linkFields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
                  <input
                    {...register(`links.${idx}.label` as const)}
                    className="input w-full"
                    placeholder="Etiqueta (opcional)"
                  />
                  <div>
                    <input
                      {...register(`links.${idx}.url` as const)}
                      className={['input w-full', errors.links?.[idx]?.url ? 'ring-1 ring-red-500/60' : ''].join(' ')}
                      placeholder="https://perfil.com/usuario"
                    />
                    {errors.links?.[idx]?.url && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.links[idx]?.url?.message as string}
                      </p>
                    )}
                  </div>
                  <button type="button" className="btn" onClick={() => remove(idx)}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/candidatos')}
              disabled={isSubmitting || mCreate.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || mCreate.isPending}
            >
              {mCreate.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
