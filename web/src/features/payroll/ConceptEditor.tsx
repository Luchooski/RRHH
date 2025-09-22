import { useMemo, useState } from 'react';
import type { Concept } from './schema';
import * as store from './storage';

const TYPES = [
  { value: 'remunerativo', label: 'Remunerativo' },
  { value: 'no_remunerativo', label: 'No remunerativo' },
  { value: 'deduccion', label: 'Deducción' },
] as const;
const MODES = [
  { value: 'monto', label: 'Monto' },
  { value: 'porcentaje', label: 'Porcentaje' },
] as const;
const BASES = [
  { value: 'imponible', label: 'Imponible' },
  { value: 'bruto', label: 'Bruto (pre impuestos)' },
  { value: 'neto_previo', label: 'Neto previo' },
  { value: 'personalizado', label: 'Personalizado' },
] as const;
const PHASES = [
  { value: 'pre_tax', label: 'Antes de impuestos' },
  { value: 'post_tax', label: 'Después de impuestos' },
] as const;
const ROUNDS = [
  { value: 'nearest', label: 'Redondeo normal' },
  { value: 'down', label: 'Hacia abajo' },
  { value: 'up', label: 'Hacia arriba' },
  { value: 'none', label: 'Sin redondeo' },
] as const;

export default function ConceptEditor({
  concepts, onChange, onSaveTemplate // onSaveTemplate se mantiene p/ compat y mostrará toast
}: {
  concepts: Concept[];
  onChange: (next: Concept[]) => void;
  onSaveTemplate: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Concept>>({
    type: 'remunerativo', mode: 'monto', value: 0, enabled: true,
    base: 'imponible', phase: 'pre_tax', roundMode: 'nearest', roundDecimals: 2, priority: 100
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Plantillas
  const [tpls, setTpls] = useState(() => store.listTemplates());
  const [activeTpl, setActiveTpl] = useState<string | null>(tpls[0]?.id ?? null);
  const currentTpl = useMemo(() => tpls.find(t => t.id === activeTpl) ?? null, [tpls, activeTpl]);

  const add = () => {
    if (!draft.name || !draft.type || !draft.mode || draft.value == null) return;
    const c: Concept = {
      id: 'c_' + Math.random().toString(36).slice(2),
      name: draft.name,
      type: draft.type as any,
      mode: draft.mode as any,
      value: Number(draft.value) || 0,
      base: (draft.base as any) ?? 'imponible',
      phase: (draft.phase as any) ?? 'pre_tax',
      minAmount: draft.minAmount ?? undefined,
      maxAmount: draft.maxAmount ?? undefined,
      roundMode: (draft.roundMode as any) ?? 'nearest',
      roundDecimals: Number(draft.roundDecimals ?? 2),
      priority: Number(draft.priority ?? 100),
      enabled: draft.enabled ?? true,
      customBase: draft.customBase ?? undefined
    };
    onChange([ ...concepts, c ]);
    setDraft({ type: c.type, mode: c.mode, value: 0, name: '', base: c.base, phase: c.phase, roundMode: c.roundMode, roundDecimals: c.roundDecimals, priority: c.priority, enabled: true });
  };

  const update = (id: string, patch: Partial<Concept>) =>
    onChange(concepts.map(c => c.id === id ? { ...c, ...patch } : c));
  const remove = (id: string) => onChange(concepts.filter(c => c.id !== id));

  // Plantillas: guardar / cargar / renombrar / borrar
  const saveAs = () => {
    const name = prompt('Nombre de la plantilla:');
    if (!name) return;
    const saved = store.saveTemplateNamed(name, concepts);
    setTpls(store.listTemplates());
    setActiveTpl(saved.id);
    onSaveTemplate();
  };
  const loadTpl = (id: string) => {
    setActiveTpl(id);
    const tpl = tpls.find(t => t.id === id);
    if (tpl) onChange(tpl.concepts);
  };
  const renameTpl = () => {
    if (!activeTpl) return;
    const tpl = tpls.find(t => t.id === activeTpl);
    if (!tpl) return;
    const name = prompt('Nuevo nombre:', tpl.name);
    if (!name) return;
    store.updateTemplate(tpl.id, { name });
    setTpls(store.listTemplates());
  };
  const deleteTpl = () => {
    if (!activeTpl) return;
    if (!confirm('¿Borrar plantilla?')) return;
    store.removeTemplate(activeTpl);
    const nextList = store.listTemplates();
    setTpls(nextList);
    setActiveTpl(nextList[0]?.id ?? null);
  };

  return (
    <div className="card p-4 sm:p-6 space-y-3">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-sm font-semibold">Conceptos (plantillas)</h3>
        <div className="flex flex-wrap gap-2">
          <select className="input" value={activeTpl ?? ''} onChange={(e)=>loadTpl(e.target.value)}>
            <option value="">— Sin plantilla —</option>
            {tpls.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn" onClick={saveAs}>Guardar como…</button>
          <button className="btn" onClick={renameTpl} disabled={!activeTpl}>Renombrar</button>
          <button className="btn" onClick={deleteTpl} disabled={!activeTpl}>Borrar</button>
          <button className="btn" onClick={()=>setShowAdvanced(v=>!v)}>
            {showAdvanced ? 'Ocultar avanzado' : 'Avanzado'}
          </button>
        </div>
      </header>

      {/* Lista */}
      <ul className="space-y-2">
        {concepts.map(c => (
          <li key={c.id} className="p-2 rounded-lg bg-black/5 dark:bg-white/5 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-black/10 dark:bg-white/10">
                {labelType(c.type)} · {labelMode(c.mode)}
              </span>
              <input className="input w-48" value={c.name} onChange={(e)=>update(c.id, { name: e.target.value })}/>
              <input className="input w-28" value={String(c.value)} onChange={(e)=>update(c.id, { value: Number(e.target.value.replace(',','.')) || 0 })}/>
              <select className="input" value={c.type} onChange={(e)=>update(c.id, { type: e.target.value as any })}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select className="input" value={c.mode} onChange={(e)=>update(c.id, { mode: e.target.value as any })}>
                {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <label className="flex items-center gap-2 ml-auto">
                <input type="checkbox" checked={c.enabled !== false} onChange={(e)=>update(c.id, { enabled: e.target.checked })}/>
                <span className="text-xs">Activo</span>
              </label>
              <button className="btn" onClick={()=>remove(c.id)}>Quitar</button>
            </div>

            {showAdvanced && c.type === 'deduccion' && (
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                <select className="input" value={c.base ?? 'imponible'} onChange={(e)=>update(c.id, { base: e.target.value as any })}>
                  {BASES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                { (c.base === 'personalizado') && (
                  <input className="input" placeholder="Base personalizada" inputMode="decimal"
                    value={String(c.customBase ?? 0)}
                    onChange={(e)=>update(c.id, { customBase: Number(e.target.value.replace(',','.')) || 0 })} />
                )}
                <select className="input" value={c.phase ?? 'pre_tax'} onChange={(e)=>update(c.id, { phase: e.target.value as any })}>
                  {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <input className="input" placeholder="Mínimo" inputMode="decimal"
                  value={String(c.minAmount ?? '')}
                  onChange={(e)=>update(c.id, { minAmount: e.target.value ? Number(e.target.value.replace(',','.')) : undefined })} />
                <input className="input" placeholder="Máximo" inputMode="decimal"
                  value={String(c.maxAmount ?? '')}
                  onChange={(e)=>update(c.id, { maxAmount: e.target.value ? Number(e.target.value.replace(',','.')) : undefined })} />
                <div className="flex gap-2">
                  <select className="input" value={c.roundMode ?? 'nearest'} onChange={(e)=>update(c.id, { roundMode: e.target.value as any })}>
                    {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <input className="input w-20" inputMode="numeric" placeholder="Dec"
                    value={String(c.roundDecimals ?? 2)}
                    onChange={(e)=>update(c.id, { roundDecimals: Number(e.target.value) || 0 })}/>
                  <input className="input w-24" inputMode="numeric" placeholder="Prioridad"
                    value={String(c.priority ?? 100)}
                    onChange={(e)=>update(c.id, { priority: Number(e.target.value) || 0 })}/>
                </div>
              </div>
            )}
          </li>
        ))}
        {!concepts.length && <li className="text-sm text-zinc-500">No hay conceptos aún.</li>}
      </ul>

      {/* Alta rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        <input className="input sm:col-span-2" placeholder="Nombre (ej. Sindicato)" value={draft.name ?? ''} onChange={(e)=>setDraft(d=>({ ...d, name: e.target.value }))} />
        <select className="input" value={draft.type as any} onChange={(e)=>setDraft(d=>({ ...d, type: e.target.value as any }))}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input" value={draft.mode as any} onChange={(e)=>setDraft(d=>({ ...d, mode: e.target.value as any }))}>
          {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <input className="input" inputMode="decimal" placeholder="Valor" value={String(draft.value ?? 0)} onChange={(e)=>setDraft(d=>({ ...d, value: Number(e.target.value.replace(',','.')) || 0 }))} />
      </div>

      {showAdvanced && draft.type === 'deduccion' && (
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
          <select className="input" value={draft.base as any} onChange={(e)=>setDraft(d=>({ ...d, base: e.target.value as any }))}>
            {BASES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          {draft.base === 'personalizado' && (
            <input className="input" inputMode="decimal" placeholder="Base personalizada"
              value={String(draft.customBase ?? 0)}
              onChange={(e)=>setDraft(d=>({ ...d, customBase: Number(e.target.value.replace(',','.')) || 0 }))}/>
          )}
          <select className="input" value={draft.phase as any} onChange={(e)=>setDraft(d=>({ ...d, phase: e.target.value as any }))}>
            {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <input className="input" placeholder="Mínimo" inputMode="decimal"
            value={String(draft.minAmount ?? '')}
            onChange={(e)=>setDraft(d=>({ ...d, minAmount: e.target.value ? Number(e.target.value.replace(',','.')) : undefined }))}/>
          <input className="input" placeholder="Máximo" inputMode="decimal"
            value={String(draft.maxAmount ?? '')}
            onChange={(e)=>setDraft(d=>({ ...d, maxAmount: e.target.value ? Number(e.target.value.replace(',','.')) : undefined }))}/>
          <div className="flex gap-2">
            <select className="input" value={draft.roundMode as any} onChange={(e)=>setDraft(d=>({ ...d, roundMode: e.target.value as any }))}>
              {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <input className="input w-20" inputMode="numeric" placeholder="Dec"
              value={String(draft.roundDecimals ?? 2)}
              onChange={(e)=>setDraft(d=>({ ...d, roundDecimals: Number(e.target.value) || 0 }))}/>
            <input className="input w-24" inputMode="numeric" placeholder="Prioridad"
              value={String(draft.priority ?? 100)}
              onChange={(e)=>setDraft(d=>({ ...d, priority: Number(e.target.value) || 0 }))}/>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button className="btn btn-primary" onClick={add}>Añadir concepto</button>
      </div>
    </div>
  );
}

function labelType(t: string) {
  if (t === 'remunerativo') return 'Rem.';
  if (t === 'no_remunerativo') return 'No rem.';
  return 'Ded.';
}
function labelMode(m: string) { return m === 'monto' ? 'Monto' : '%'; }
