import { useEffect, useState } from 'react';
import { readLocal, writeLocal } from '../lib/storage';

type Item = { id: string; text: string; done: boolean };
const KEY = 'mh-todos';

export default function TodoList() {
  const [items, setItems] = useState<Item[]>(() =>
    readLocal<Item[]>(KEY, [
      { id: crypto.randomUUID(), text: 'Revisar CVs nuevos', done: false },
      { id: crypto.randomUUID(), text: 'Agendar entrevistas', done: true }
    ])
  );
  const [text, setText] = useState('');

  useEffect(() => { writeLocal(KEY, items); }, [items]);

return (
  <div className="card p-4 sm:p-5">
    <h3 className="text-sm font-semibold mb-3">To-Do</h3>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap mb-3"
        onSubmit={(e)=>{e.preventDefault(); if(!text.trim()) return; setItems([{id:crypto.randomUUID(), text, done:false}, ...items]); setText('');}}
      >
        <input
          className="input w-full sm:flex-1"
          placeholder="Nueva tarea…"
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        <div className="flex gap-2 sm:w-auto">
          <button className="btn touch-target flex-1 sm:flex-none" type="button" onClick={()=>setText('')}>Borrar</button>
          <button className="btn btn-primary touch-target flex-1 sm:flex-none" type="submit">Añadir</button>
        </div>
      </form>
    <ul className="space-y-2">
      {items.map(it => (
        <li key={it.id} className="flex items-center gap-3">
          <input type="checkbox" checked={it.done} onChange={()=>setItems(items.map(x=>x.id===it.id?{...x, done:!x.done}:x))} />
          <span className={it.done ? 'line-through text-zinc-500' : ''}>{it.text}</span>
        </li>
      ))}
    </ul>
  </div>
);
}
