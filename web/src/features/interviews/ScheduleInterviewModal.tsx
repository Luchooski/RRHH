// web/src/features/interviews/ScheduleInterviewModal.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createInterview } from './api';
import { listVacancies } from '@/features/vacancies/api';

type Props = { candidateId: string; onClose: () => void };

function toLocalInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

export default function ScheduleInterviewModal({ candidateId, onClose }: Props) {
  const qc = useQueryClient();

  const { data: vacancies = [] } = useQuery({
    queryKey: ['vacancies:open-for-interview'],
    queryFn: async () => {
      const all = await listVacancies();
      const arr = Array.isArray(all) ? all : all?.items ?? all?.data ?? [];
      return arr.filter((v: any) => v.status === 'open');
    },
  });

  const [vacancyId, setVacancyId] = useState('');
  const [when, setWhen] = useState(toLocalInputValue());
  const [duration, setDuration] = useState(60); // minutos
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const mCreate = useMutation({
    mutationFn: async () => {
      // de "datetime-local" a ISO UTC
      const startLocal = new Date(when);
      const startISO = new Date(startLocal.getTime() + startLocal.getTimezoneOffset() * 60000);
      const endISO = new Date(startISO.getTime() + duration * 60000);

      return createInterview({
        title: 'Entrevista',
        start: startISO.toISOString(),
        end: endISO.toISOString(),
        candidateId,
        vacancyId: vacancyId || undefined,
        location: location || undefined,
        notes: notes || undefined,
        status: 'Programada',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] });
      qc.invalidateQueries({ queryKey: ['reports:conversion'] });
      onClose();
    },
  });

  return (
    <div className="p-3 sm:p-4 w-[min(92vw,560px)]">
      <h3 className="text-lg font-semibold mb-2">Programar entrevista</h3>
      <div className="space-y-2">
        <div>
          <label className="label">Vacante (opcional)</label>
          <select className="input w-full" value={vacancyId} onChange={(e)=>setVacancyId(e.target.value)}>
            <option value="">— Sin vacante —</option>
            {vacancies.map((v: any) => (<option key={v.id} value={v.id}>{v.title}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="label">Fecha y hora</label>
            <input className="input w-full" type="datetime-local" value={when} onChange={(e)=>setWhen(e.target.value)} />
          </div>
          <div>
            <label className="label">Duración (min)</label>
            <input className="input w-full" type="number" min={15} step={15} value={duration} onChange={(e)=>setDuration(Number(e.target.value) || 60)} />
          </div>
        </div>
        <div>
          <label className="label">Ubicación (opcional)</label>
          <input className="input w-full" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Google Meet, oficina, etc." />
        </div>
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea className="input w-full h-24 resize-none" value={notes} onChange={(e)=>setNotes(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={()=>mCreate.mutate()} disabled={mCreate.isPending}>Guardar</button>
      </div>
    </div>
  );
}
