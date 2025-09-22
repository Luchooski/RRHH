import { useState } from 'react';
import type { CandidateInput, Candidate } from './schema';

export default function CandidateForm({
  initial,
  onSubmit
}: { initial?: Partial<Candidate> ; onSubmit:(data:CandidateInput)=>void }) {
  const [form, setForm] = useState<CandidateInput>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    role: initial?.role ?? '',
    match: initial?.match ?? 0,
    status: initial?.status ?? 'Activo'
  });

  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <input className="btn w-full" placeholder="Nombre" value={form.name}
        onChange={(e)=>setForm({...form, name:e.target.value})} required />
      <input className="btn w-full" placeholder="Email" type="email" value={form.email}
        onChange={(e)=>setForm({...form, email:e.target.value})} required />
      <input className="btn w-full" placeholder="Rol" value={form.role}
        onChange={(e)=>setForm({...form, role:e.target.value})} required />
      <input className="btn w-full" placeholder="Match (0-100)" type="number" min={0} max={100}
        value={form.match ?? 0} onChange={(e)=>setForm({...form, match: Number(e.target.value)})} />
      <input className="btn w-full" placeholder="Estado" value={form.status ?? 'Activo'}
        onChange={(e)=>setForm({...form, status:e.target.value})} />
      <button className="btn btn-primary mt-1" type="submit">Guardar</button>
    </form>
  );
}
