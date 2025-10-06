import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClientCreateSchema, ClientUpdateSchema,
  type ClientCreateValues, type ClientUpdateValues
} from './Client.schema';

type Mode = 'create' | 'edit';

type Props =
  | { mode: 'create'; defaultValues?: Partial<ClientCreateValues>; onSubmit: (v: ClientCreateValues) => void; disabled?: boolean }
  | { mode: 'edit';   defaultValues: ClientUpdateValues & { id?: string }; onSubmit: (v: ClientUpdateValues) => void; disabled?: boolean };

export default function ClientForm(props: Props) {
  const isEdit = props.mode === 'edit';

  const form = useForm<ClientCreateValues | ClientUpdateValues>({
    resolver: zodResolver(isEdit ? ClientUpdateSchema : ClientCreateSchema) as any,
    defaultValues: (props.defaultValues ?? {
      name: '',
      industry: '',
      size: 'medium',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
    }) as any,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (props.defaultValues) form.reset(props.defaultValues as any);
  }, [props.defaultValues]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  const submit = handleSubmit((v) => props.onSubmit(v as any));

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm">Empresa</span>
          <input className="input w-full" {...register('name' as const)} placeholder="Acme Inc." />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message as string}</p>}
        </label>

        <label className="space-y-1">
          <span className="text-sm">Industria</span>
          <input className="input w-full" {...register('industry' as const)} placeholder="Tecnología" />
          {errors.industry && <p className="text-xs text-red-600">{errors.industry.message as string}</p>}
        </label>

        <label className="space-y-1">
          <span className="text-sm">Tamaño</span>
          <select className="input w-full" {...register('size' as const)}>
            <option value="small">Pequeña</option>
            <option value="medium">Mediana</option>
            <option value="large">Grande</option>
          </select>
          {errors.size && <p className="text-xs text-red-600">{errors.size.message as string}</p>}
        </label>

        <label className="space-y-1">
          <span className="text-sm">Contacto (Nombre)</span>
          <input className="input w-full" {...register('contactName' as const)} placeholder="Jane Doe" />
          {errors.contactName && <p className="text-xs text-red-600">{errors.contactName.message as string}</p>}
        </label>

        <label className="space-y-1">
          <span className="text-sm">Email</span>
          <input className="input w-full" type="email" {...register('contactEmail' as const)} placeholder="jane@acme.com" />
          {errors.contactEmail && <p className="text-xs text-red-600">{errors.contactEmail.message as string}</p>}
        </label>

        <label className="space-y-1">
          <span className="text-sm">Teléfono</span>
          <input className="input w-full" {...register('contactPhone' as const)} placeholder="+54 9 11 1234-5678" />
          {errors.contactPhone && <p className="text-xs text-red-600">{errors.contactPhone.message as string}</p>}
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm">Notas</span>
          <textarea className="input w-full h-24 resize-none" {...register('notes' as const)} placeholder="Información adicional…" />
          {errors.notes && <p className="text-xs text-red-600">{errors.notes.message as string}</p>}
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="submit" className="btn btn-primary" disabled={props.disabled || isSubmitting}>
          {isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}
