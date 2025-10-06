import { useQuery } from '@tanstack/react-query';
import { getInterviews } from '@/features/interviews/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function InterviewsAgendaPage() {
  const { data = [] } = useQuery({ queryKey:['interviews'], queryFn: getInterviews });
  const byDay = data.reduce((acc: Record<string, any[]>, it: any) => {
    const key = format(parseISO(it.datetime), 'yyyy-MM-dd');
    (acc[key] ||= []).push(it); return acc;
  }, {});

  const days = Object.keys(byDay).sort();

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">Agenda de entrevistas</h1>
      {days.length === 0 && <div className="card p-4 text-zinc-500">Sin entrevistas</div>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {days.map(d => (
          <div key={d} className="card p-3">
            <div className="text-sm font-semibold mb-2">{format(parseISO(d), "EEEE d 'de' MMMM", { locale: es })}</div>
            <ul className="space-y-2">
              {byDay[d].sort((a,b)=>a.datetime.localeCompare(b.datetime)).map((it:any)=>(
                <li key={it.id} className="flex items-center justify-between">
                  <span className="font-medium">{it.name}</span>
                  <span className="text-sm text-zinc-500">{format(parseISO(it.datetime), 'HH:mm')}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
