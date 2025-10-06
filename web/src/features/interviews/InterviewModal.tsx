import { useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterviewCreateSchema, type InterviewDTO } from './calendar.schema';

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<InterviewDTO> & { date?: string; startTime?: string; durationMin?: number };
  onSubmit: (payload: { title:string; start:string; end:string; candidateId?:string; vacancyId?:string; location?:string; notes?:string; status: InterviewDTO['status'] }) => void;
};

export default function InterviewModal({ open, onClose, initial, onSubmit }: Props) {
  const form = useForm({
    resolver: zodResolver(InterviewCreateSchema) as any,
    defaultValues: {
      title: initial?.title ?? '',
      date: initial?.start ? initial.start.slice(0,10) : (initial?.date ?? ''),
      startTime: initial?.start ? new Date(initial.start).toISOString().slice(11,16) : (initial?.startTime ?? ''),
      durationMin: initial?.end && initial?.start
        ? Math.max(15, Math.round((new Date(initial.end).getTime()-new Date(initial.start).getTime())/60000))
        : (initial?.durationMin ?? 60),
      candidateId: initial?.candidateId ?? '',
      vacancyId: initial?.vacancyId ?? '',
      location: initial?.location ?? '',
      notes: initial?.notes ?? '',
      status: (initial?.status as any) ?? 'Programada',
    }
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: initial?.title ?? '',
      date: initial?.start ? initial.start.slice(0,10) : (initial?.date ?? ''),
      startTime: initial?.start ? new Date(initial.start).toISOString().slice(11,16) : (initial?.startTime ?? ''),
      durationMin: initial?.end && initial?.start
        ? Math.max(15, Math.round((new Date(initial.end).getTime()-new Date(initial.start).getTime())/60000))
        : (initial?.durationMin ?? 60),
      candidateId: initial?.candidateId ?? '',
      vacancyId: initial?.vacancyId ?? '',
      location: initial?.location ?? '',
      notes: initial?.notes ?? '',
      status: (initial?.status as any) ?? 'Programada',
    });
  }, [open, initial]);

  const { register, handleSubmit, formState:{ errors, isSubmitting } } = form;

  const submit = handleSubmit((v:any) => {
    const start = new Date(`${v.date}T${v.startTime}:00`);
    const end = new Date(start.getTime() + (v.durationMin ?? 60) * 60000);
    onSubmit({
      title: v.title,
      start: start.toISOString(),
      end: end.toISOString(),
      candidateId: v.candidateId || undefined,
      vacancyId: v.vacancyId || undefined,
      location: v.location || undefined,
      notes: v.notes || undefined,
      status: v.status,
    });
  });

  return (
    <Modal open={open} onClose={onClose} labelledById="interview-modal-title">
      <div className="px-4 pt-4">
        <h3 id="interview-modal-title" className="text-lg font-semibold">Entrevista</h3>
      </div>
      <form onSubmit={submit} className="px-4 pb-4 pt-2 space-y-3">
        <label className="space-y-1">
          <span className="text-sm">Título</span>
          <input className="input w-full" {...register('title')} placeholder="Entrevista técnica" />
          {errors.title && <p className="text-xs text-red-600">{String(errors.title.message)}</p>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-sm">Fecha</span>
            <input type="date" className="input w-full" {...register('date')} />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Hora</span>
            <input type="time" className="input w-full" {...register('startTime')} />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Duración (min)</span>
            <input type="number" className="input w-full" {...register('durationMin',{valueAsNumber:true})} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-sm">Estado</span>
            <select className="input w-full" {...register('status')}>
              <option>Programada</option>
              <option>Completada</option>
              <option>Cancelada</option>
              <option>Pendiente</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm">Candidato (opcional)</span>
            <input className="input w-full" {...register('candidateId')} placeholder="ID del candidato" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Vacante (opcional)</span>
            <input className="input w-full" {...register('vacancyId')} placeholder="ID de la vacante" />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-sm">Lugar / Link</span>
          <input className="input w-full" {...register('location')} placeholder="Google Meet / Oficina" />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Notas</span>
          <textarea className="input w-full h-24 resize-none" {...register('notes')} />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
