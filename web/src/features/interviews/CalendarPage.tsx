import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, startOfWeek, endOfWeek, format, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { listInterviews, createInterview, updateInterview, deleteInterview } from './api';
import type { InterviewDTO } from './calendar.schema';
import CalendarGrid from './CalendarGrid';
import InterviewModal from './InterviewModal';
import { Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const qc = useQueryClient();

  const [mode, setMode] = useState<'week'|'month'>('week');
  const [cursor, setCursor] = useState<Date>(new Date()); // fecha de referencia

  const weekStart = useMemo(() => startOfWeek(cursor, { weekStartsOn: 1 }), [cursor]);
  const weekEnd   = useMemo(() => endOfWeek(cursor,   { weekStartsOn: 1 }), [cursor]);

  const q = useQuery({
    queryKey: ['interviews', { from: weekStart.toISOString(), to: weekEnd.toISOString() }],
    queryFn: () => listInterviews({ from: weekStart.toISOString(), to: weekEnd.toISOString() }),
  });

  const items: InterviewDTO[] = q.data?.items ?? [];

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [initial, setInitial] = useState<Partial<InterviewDTO> & { date?: string; startTime?: string; durationMin?: number } | undefined>(undefined);

  const mCreate = useMutation({
    mutationFn: (p: any) => createInterview(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });
  const mUpdate = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => updateInterview(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });
  const mDelete = useMutation({
    mutationFn: (id: string) => deleteInterview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const openCreateAt = (day: Date, hour: number) => {
    const date = day.toISOString().slice(0,10);
    const startTime = `${String(hour).padStart(2,'0')}:00`;
    setInitial({ date, startTime, durationMin: 60, status: 'Programada' });
    setCreateOpen(true);
  };

  const onEventClick = (ev: InterviewDTO) => {
    setInitial(ev);
    setEditOpen(true);
  };

  const onCreate = (payload: any) => { mCreate.mutate(payload); setCreateOpen(false); };
  const onEdit   = (patch: any) => { if (!initial?.id) return; mUpdate.mutate({ id: initial.id, patch }); setEditOpen(false); };

  const onDelete = () => { if (!initial?.id) return; mDelete.mutate(initial.id); setEditOpen(false); };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        {/* Header */}
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-5" />
              <h1 className="text-2xl font-semibold tracking-tight">Agenda de entrevistas</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={()=>setCursor(addWeeks(cursor, -1))}><ChevronLeft className="size-4" /> Anterior</button>
              <button className="btn" onClick={()=>setCursor(new Date())}>Hoy</button>
              <button className="btn" onClick={()=>setCursor(addWeeks(cursor, 1))}>Siguiente <ChevronRight className="size-4" /></button>
              <select className="input" value={mode} onChange={(e)=>setMode(e.target.value as any)} aria-label="Vista">
                <option value="week">Semana</option>
                <option value="month" disabled>Mes (próximamente)</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-[--color-muted] mt-2">{format(weekStart,'PP', {locale: es})} — {format(weekEnd,'PP', {locale: es})}</p>
        </header>

        {/* Grid semanal */}
        <CalendarGrid
          weekStart={weekStart}
          events={items}
          onSlotClick={openCreateAt}
          onEventClick={onEventClick}
        />

        {/* Modales */}
        <InterviewModal
          open={createOpen}
          onClose={()=>setCreateOpen(false)}
          initial={initial}
          onSubmit={onCreate}
        />

        <InterviewModal
          open={editOpen}
          onClose={()=>setEditOpen(false)}
          initial={initial}
          onSubmit={onEdit}
        />
        {editOpen && initial?.id && (
          <div className="flex justify-end">
            <button className="btn mt-2" onClick={onDelete}><Trash2 className="size-4 mr-1" /> Borrar</button>
          </div>
        )}
      </div>
    </div>
  );
}
