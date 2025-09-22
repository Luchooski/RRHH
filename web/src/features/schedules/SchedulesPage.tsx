import { useState } from 'react';
import { schedules as seed } from '../../mock/schedules';
import ScheduleCard from './ScheduleCard';

export default function SchedulesPage() {
  const [rows, setRows] = useState(seed);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Horarios</h1>
      <section className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((r,i) => <ScheduleCard key={i} row={r} />)}
      </section>
      <section className="card p-0 overflow-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="p-3 text-left">Empleado</th>
              {['Mon','Tue','Wed','Thu','Fri'].map(d => <th key={d} className="p-3 text-left">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t border-[--color-border]">
                <td className="p-3 font-medium">{r.employee}</td>
                {(['Mon','Tue','Wed','Thu','Fri'] as const).map(day=>(
                  <td key={day} className="p-1">
                    <input className="btn w-full" value={(r as any)[day]} onChange={(e)=>{
                      const v = e.target.value;
                      setRows(rows.map((x,idx)=> idx===i ? { ...x, [day]: v } : x));
                    }}/>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
