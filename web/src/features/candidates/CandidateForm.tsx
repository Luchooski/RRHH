import { useState, useEffect } from 'react';
import { CandidateFormSchema, type CandidateFormValues, statuses } from './schemas';

type Props = {
  initial?: Partial<CandidateFormValues>;
  onSubmit: (values: CandidateFormValues) => Promise<void>;
  onClose?: () => void;
};

export default function CandidateForm({ initial, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<CandidateFormValues>({
    fullName: '', email: '', phone: '', skills: '', status: 'applied', notes: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      setValues(v => ({ ...v, ...initial }));
    }
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = CandidateFormSchema.safeParse(values);
    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors).flat().join(', ');
      setError(msg || 'Revisá los campos');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(parsed.data);
      onClose?.();
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Nombre completo</label>
          <input className="input w-full" value={values.fullName} onChange={e => setValues(v => ({...v, fullName: e.target.value}))}/>
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input w-full" value={values.email} onChange={e => setValues(v => ({...v, email: e.target.value}))}/>
        </div>
        <div>
          <label className="block text-sm mb-1">Teléfono</label>
          <input className="input w-full" value={values.phone ?? ''} onChange={e => setValues(v => ({...v, phone: e.target.value}))}/>
        </div>
        <div>
          <label className="block text-sm mb-1">Skills (coma-separadas)</label>
          <input className="input w-full" placeholder="react, node, ts" value={values.skills ?? ''} onChange={e => setValues(v => ({...v, skills: e.target.value}))}/>
        </div>
        <div>
          <label className="block text-sm mb-1">Estado</label>
          <select className="input w-full" value={values.status} onChange={e => setValues(v => ({...v, status: e.target.value as any}))}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Notas</label>
        <textarea className="input w-full h-24" value={values.notes ?? ''} onChange={e => setValues(v => ({...v, notes: e.target.value}))}/>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2 justify-end">
        {onClose && <button type="button" className="btn" onClick={onClose}>Cancelar</button>}
        <button disabled={busy} className="btn btn-primary">{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
