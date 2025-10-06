import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listVacancies } from '@/features/vacancies/api';
import { sendToVacancy } from './api';
import { useState } from 'react';

type Props = { candidateId: string; onClose: () => void };

export default function SendToVacancyModal({ candidateId, onClose }: Props) {
  const qc = useQueryClient();
  const { data: vacancies = [] } = useQuery({
    queryKey: ['vacancies:open-for-modal'],
    queryFn: async () => {
      const all = await listVacancies();
      return (Array.isArray(all) ? all : all.items ?? all.data ?? []).filter((v: any) => v.status === 'open');
    },
  });

  const [vacancyId, setVacancyId] = useState('');
  const [status, setStatus] = useState<'sent'|'interview'|'feedback'|'offer'|'hired'|'rejected'>('sent');

  const mSend = useMutation({
    mutationFn: () => sendToVacancy(candidateId, vacancyId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      onClose();
    },
  });

  return (
    <div className="p-3 sm:p-4 w-[min(92vw,560px)]">
      <h3 className="text-lg font-semibold mb-2">Enviar a vacante</h3>
      <div className="space-y-2">
        <div>
          <label className="label">Vacante</label>
          <select className="input w-full" value={vacancyId} onChange={(e)=>setVacancyId(e.target.value)}>
            <option value="">Seleccioná una vacante…</option>
            {vacancies.map((v: any) => (<option key={v.id} value={v.id}>{v.title}</option>))}
          </select>
        </div>
        <div>
          <label className="label">Estado inicial</label>
          <select className="input w-full" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
            <option value="sent">Enviado</option>
            <option value="interview">Entrevista</option>
            <option value="feedback">Feedback</option>
            <option value="offer">Oferta</option>
            <option value="hired">Contratado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={()=>vacancyId && mSend.mutate()} disabled={!vacancyId || mSend.isPending}>
          Enviar
        </button>
      </div>
    </div>
  );
}
