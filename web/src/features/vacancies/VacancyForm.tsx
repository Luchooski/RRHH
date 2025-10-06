import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VacancyCreateSchema, VacancyUpdateSchema, type VacancyDTO } from './vacancy.schema';

type Props =
  | { mode:'create'; defaultValues?: Partial<VacancyDTO>; onSubmit:(v:any)=>void; disabled?:boolean; companies?: {id:string; name:string}[] }
  | { mode:'edit';   defaultValues: Partial<VacancyDTO>; onSubmit:(v:any)=>void; disabled?:boolean; companies?: {id:string; name:string}[] };

export default function VacancyForm({ mode, defaultValues, onSubmit, disabled, companies=[] }: Props) {
  const form = useForm({
    resolver: zodResolver(mode==='edit' ? VacancyUpdateSchema : VacancyCreateSchema) as any,
    defaultValues: {
      title: '', companyId: '', location: '', seniority: 'ssr',
      employmentType: 'fulltime', status: 'open', salaryMin: undefined, salaryMax: undefined, description: '',
      ...(defaultValues ?? {})
    } as any
  });

  const { register, handleSubmit, formState:{ errors, isSubmitting } } = form;

  return (
    <form onSubmit={handleSubmit(v => onSubmit(v))} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm">Título</span>
          <input className="input w-full" {...register('title')} placeholder="Backend Node.js" />
          {errors.title && <p className="text-xs text-red-600">{String(errors.title.message)}</p>}
        </label>
        <label className="space-y-1">
          <span className="text-sm">Empresa</span>
          <select className="input w-full" {...register('companyId')}>
            <option value="">Seleccionar…</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.companyId && <p className="text-xs text-red-600">{String(errors.companyId.message)}</p>}
        </label>

        <label className="space-y-1">
          <span className="text-sm">Ubicación</span>
          <input className="input w-full" {...register('location')} placeholder="Remoto (AR)" />
          {errors.location && <p className="text-xs text-red-600">{String(errors.location.message)}</p>}
        </label>

        <label className="space-y-1">
          <span className="text-sm">Seniority</span>
          <select className="input w-full" {...register('seniority')}>
            <option value="jr">Junior</option><option value="ssr">Semi-Senior</option><option value="sr">Senior</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Tipo</span>
          <select className="input w-full" {...register('employmentType')}>
            <option value="fulltime">Full-time</option><option value="parttime">Part-time</option><option value="contract">Contrato</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Estado</span>
          <select className="input w-full" {...register('status')}>
            <option value="open">Abierta</option><option value="paused">Pausada</option><option value="closed">Cerrada</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Salario mín.</span>
          <input type="number" className="input w-full" {...register('salaryMin',{valueAsNumber:true})} />
        </label>
        <label className="space-y-1">
          <span className="text-sm">Salario máx.</span>
          <input type="number" className="input w-full" {...register('salaryMax',{valueAsNumber:true})} />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm">Descripción</span>
          <textarea className="input w-full h-28 resize-none" {...register('description')} placeholder="Responsabilidades, requisitos…" />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn btn-primary" disabled={disabled || isSubmitting}>
          {mode==='edit' ? 'Guardar cambios' : 'Crear vacante'}
        </button>
      </div>
    </form>
  );
}
