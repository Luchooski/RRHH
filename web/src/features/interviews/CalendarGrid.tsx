import { format, startOfWeek, addDays, setHours, setMinutes, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { InterviewDTO } from './calendar.schema';

type Props = {
  weekStart: Date;                     // lunes de la semana
  hoursRange?: [number, number];       // ej: [8, 19]
  events: InterviewDTO[];
  onSlotClick: (day: Date, hour: number) => void;
  onEventClick: (ev: InterviewDTO) => void;
};

export default function CalendarGrid({ weekStart, hoursRange = [8, 19], events, onSlotClick, onEventClick }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [hStart, hEnd] = hoursRange;
  const hours = Array.from({ length: hEnd - hStart + 1 }, (_, i) => hStart + i);

  const eventsByDay = (d: Date) => events.filter(e => isSameDay(parseISO(e.start), d));

  return (
    <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-0 shadow-sm overflow-hidden">
      <div className="grid grid-cols-8 border-b border-[--color-border] bg-black/5 dark:bg-white/5">
        <div className="p-2 text-xs text-[--color-muted]"> </div>
        {days.map(d => (
          <div key={d.toISOString()} className="p-2 text-xs font-medium">
            {format(d, 'EEE dd', { locale: es })}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-8">
        {/* Columna de horas */}
        <div className="border-r border-[--color-border]">
          {hours.map(h => (
            <div key={h} className="h-14 border-b border-[--color-border] text-[10px] px-2 flex items-start pt-1 text-[--color-muted]">
              {String(h).padStart(2,'0')}:00
            </div>
          ))}
        </div>

        {/* Días */}
        {days.map(d => (
          <div key={d.toISOString()} className="border-r border-[--color-border] relative">
            {/* slots clicables */}
            {hours.map(h => (
              <button
                key={h}
                type="button"
                className="h-14 w-full border-b border-[--color-border] hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => onSlotClick(d, h)}
                aria-label={`Crear entrevista ${format(d,'PP',{locale:es})} ${h}:00`}
              />
            ))}

            {/* eventos del día */}
            <div className="absolute inset-0 pointer-events-none">
              {eventsByDay(d).map((e, idx) => {
                const start = parseISO(e.start);
                const end = parseISO(e.end);
                const topHour = start.getHours() + start.getMinutes()/60 - hStart;
                const durH = (end.getTime() - start.getTime()) / 3600000;
                const top = Math.max(0, topHour * 56); // 56px ~ h-14
                const height = Math.max(28, durH * 56);
                return (
                  <div
                    key={e.id}
                    className="absolute left-1 right-1 rounded-lg bg-blue-500/15 ring-1 ring-blue-500/30 text-blue-700 dark:text-blue-300 px-2 py-1 text-xs overflow-hidden pointer-events-auto"
                    style={{ top, height }}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    title={`${e.title} · ${format(start,'HH:mm')} - ${format(end,'HH:mm')}`}
                  >
                    <div className="font-medium truncate">{e.title}</div>
                    <div className="opacity-70 truncate">{format(start,'HH:mm')}–{format(end,'HH:mm')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
