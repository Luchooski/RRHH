import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateApplication } from './hooks';
import { apiListCandidatesForSelect } from './api';
import { useToast } from '@/components/ui/Toast';
import type { ApplicationCreateInput } from './dto';

type Status = ApplicationCreateInput['status'];

type Props = { vacancyId: string; open: boolean; onClose: () => void };
export default function ApplicationModal({ vacancyId, open, onClose }: Props) {
  const [candidates, setCandidates] = useState<{id:string;label:string}[]>([]);
  const [candidateId, setCandidateId] = useState('');
  const [status, setStatus] = useState<Status>('sent');
  const toast = useToast();
  const { mutate, isPending } = useCreateApplication();

  useEffect(() => { if (open) apiListCandidatesForSelect().then(setCandidates) }, [open]);

  const submit = () => {
    if (!candidateId) return;
    mutate({ candidateId, vacancyId, status }, {
      onSuccess: () => { toast.success('Asociación creada'); onClose(); },
      onError: () => toast.error('No se pudo asociar')
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 id="apps" className="text-lg font-semibold mb-3">Candidatos vinculados</h2>
      <div className="grid gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="candidate">Seleccionar candidato</label>
          <select id="candidate" value={candidateId} onChange={e => setCandidateId(e.target.value)} className="w-full select">
            <option value="">Seleccione…</option>
            {candidates.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="status">Estado</label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value as Status)}
            className="w-full select"
          >
            <option value="sent">Enviado</option>
            <option value="interview">Entrevista</option>
            <option value="feedback">Feedback</option>
            <option value="offer">Oferta</option>
            <option value="hired">Contratado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button onClick={submit} disabled={isPending}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}
