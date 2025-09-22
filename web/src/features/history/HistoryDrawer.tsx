import Drawer from '../../components/Drawer';
import { useEffect, useState } from 'react';
import { readLocal, writeLocal } from '../../lib/storage';

type Entry = { id:string; ts:number; action:string; detail?:string };
const KEY = 'mh-history';

export default function HistoryDrawer({ open, onClose }:{ open:boolean; onClose:()=>void }) {
  const [list, setList] = useState<Entry[]>(()=>readLocal(KEY, []));
  useEffect(()=>writeLocal(KEY,list),[list]);

  return (
    <Drawer open={open} onClose={onClose} title="Historial de cambios">
      <div className="overflow-auto h-[calc(100%-56px)] p-3 sm:p-4">
        <ul className="space-y-3">
          {list.length === 0 && <li className="text-sm text-zinc-500">Aún no hay cambios registrados.</li>}
          {list.map(e=>(
            <li key={e.id} className="card p-3">
              <div className="text-xs text-zinc-500">{new Date(e.ts).toLocaleString()}</div>
              <div className="font-medium">{e.action}</div>
              {e.detail && <div className="text-sm">{e.detail}</div>}
            </li>
          ))}
        </ul>
      </div>
      <button className="btn mt-4" onClick={()=>setList([])}>Limpiar historial</button>
    </Drawer>
  );
}

// Utilidad para otras vistas (puedes importar y usar):
export function pushHistory(action: string, detail?: string) {
  const list = readLocal<Entry[]>(KEY, []);
  list.unshift({ id: crypto.randomUUID(), ts: Date.now(), action, detail });
  writeLocal(KEY, list);
}
