import { useState } from 'react';
import type { CandidateCreateInput } from './dto';

type Props = { onSubmit: (data: CandidateCreateInput) => void };

export default function CandidateForm({ onSubmit }: Props) {
  const [form, setForm] = useState<CandidateCreateInput>({
    name: '',
    email: '',
    role: '',
    match: 50,
    status: 'Nuevo',
  });

  const update = (patch: Partial<CandidateCreateInput>) =>
    setForm((f) => ({ ...f, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ name: '', email: '', role: '', match: 50, status: 'Nuevo' });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="tw-label">Nombre</label>
        <input className="tw-input" value={form.name} onChange={e => update({ name: e.target.value })} required />
      </div>
      <div>
        <label className="tw-label">Email</label>
        <input type="email" className="tw-input" value={form.email} onChange={e => update({ email: e.target.value })} required />
      </div>
      <div>
        <label className="tw-label">Rol</label>
        <input className="tw-input" value={form.role} onChange={e => update({ role: e.target.value })} />
      </div>
      <div>
        <label className="tw-label">Match (%)</label>
        <input type="number" min={0} max={100} className="tw-input" value={form.match} onChange={e => update({ match: Number(e.target.value) })} />
      </div>
      <div>
        <label className="tw-label">Estado</label>
        <select className="tw-select" value={form.status} onChange={e => update({ status: e.target.value as any })}>
          <option>Nuevo</option>
          <option>Contactado</option>
          <option>Entrevista</option>
          <option>Rechazado</option>
          <option>Contratado</option>
        </select>
      </div>

      <div className="pt-1">
        <button type="submit" className="tw-btn-primary">Crear</button>
      </div>
    </form>
  );
}
