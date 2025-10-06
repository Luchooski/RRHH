import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CandidateInputSchema, type CandidateInput } from './schemas';

type Props = {
  defaultValues?: Partial<CandidateInput>;
  onSubmit: (data: CandidateInput) => void;
  pending?: boolean;
};

export default function CandidateForm({ defaultValues, onSubmit, pending }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CandidateInput>({
    resolver: zodResolver(CandidateInputSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      location: '',
      seniority: undefined,
      skills: [],
      salaryExpectation: undefined,
      resumeUrl: '',
      notes: '',
      tags: [],
      links: [],
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Nombre</label>
          <input className="input w-full" {...register('name')} />
          {errors.name && <p className="error">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input w-full" type="email" {...register('email')} />
          {errors.email && <p className="error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input w-full" {...register('phone')} />
        </div>
        <div>
          <label className="label">Ubicación</label>
          <input className="input w-full" {...register('location')} />
        </div>
        <div>
          <label className="label">Seniority</label>
          <select className="input w-full" {...register('seniority')}>
            <option value="">—</option>
            <option value="jr">JR</option>
            <option value="ssr">SSR</option>
            <option value="sr">SR</option>
          </select>
        </div>
        <div>
          <label className="label">Pretensión salarial (ARS/USD)</label>
          <input className="input w-full" type="number" {...register('salaryExpectation')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Skills (separadas por coma)</label>
          <input
            className="input w-full"
            defaultValue={(defaultValues?.skills ?? []).join(', ')}
            onChange={(e) => {
              const v = e.currentTarget.value.split(',').map(s=>s.trim()).filter(Boolean);
              // Hack simple para RHF sin controller:
              (e.currentTarget as any)._skills = v; // guardo en input
            }}
            onBlur={(e) => {
              const v = (e.currentTarget as any)._skills ?? [];
              // setValue:
              (register('skills').onChange as any)({ target: { name: 'skills', value: v } });
            }}
          />
          {errors.skills && <p className="error">{errors.skills.message as any}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Portfolio/CV (URL)</label>
          <input className="input w-full" {...register('resumeUrl')} />
          {errors.resumeUrl && <p className="error">{errors.resumeUrl.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notas</label>
          <textarea className="input w-full h-28 resize-none" {...register('notes')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Tags (coma)</label>
          <input
            className="input w-full"
            defaultValue={(defaultValues?.tags ?? []).join(', ')}
            onChange={(e) => { (e.currentTarget as any)._tags = e.currentTarget.value.split(',').map(s=>s.trim()).filter(Boolean); }}
            onBlur={(e) => {
              const v = (e.currentTarget as any)._tags ?? [];
              (register('tags').onChange as any)({ target: { name: 'tags', value: v } });
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="reset" className="btn" onClick={()=>reset()}>Limpiar</button>
        <button className="btn btn-primary" disabled={pending} type="submit">Guardar</button>
      </div>
    </form>
  );
}
