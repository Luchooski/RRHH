import { useEffect, useState } from 'react';
import { readLocal, writeLocal } from '../lib/storage';

const KEY = 'mh-notes';
export default function NotesPanel() {
  const [note, setNote] = useState<string>(() => readLocal(KEY, ''));
  useEffect(() => { writeLocal(KEY, note); }, [note]);
return (
  <div className="card p-5">
    <h3 className="text-sm font-semibold mb-3">Notas</h3>
    <textarea
      className="input w-full h-40 resize-none"
      placeholder="Escribe notas generales…"
      value={note}
      onChange={(e)=>setNote(e.target.value)}
    />
  </div>
);
}
