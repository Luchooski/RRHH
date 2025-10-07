import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Plus, Trash2, CheckCheck, Ban } from 'lucide-react';

import { listInterviews, updateInterview, deleteInterview } from './api';
import type { InterviewDTO } from './calendar.schema';

import Modal from '@/components/ui/Modal';
import Empty from '@/components/ui/Empty';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import { useConfirm } from '@/components/ui/ConfirmDialog';

function toISO(d: Date) {
  return d.toISOString();
}

function downloadFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

function makeCSV(items: InterviewDTO[]) {
  const header = ['Título','Inicio','Fin','Estado','Ubicación','Notas','CandidatoId','VacanteId'];
  const lines = items.map(i => [
    `"${(i.title ?? '').replace(/"/g,'""')}"`,
    `"${i.start}"`,
    `"${i.end}"`,
    `"${i.status}"`,
    `"${i.location ?? ''}"`,
    `"${(i.notes ?? '').replace(/"/g,'""')}"`,
    `"${i.candidateId ?? ''}"`,
    `"${i.vacancyId ?? ''}"`,
  ].join(','));
  return [header.join(','), ...lines].join('\n');
}

function makeICS(items: InterviewDTO[]) {
  // ICS mínimo estándar
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RRHH//Agenda//ES',
  ];
  for (const i of items) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${i.id}`);
    lines.push(`DTSTAMP:${i.createdAt.replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')}`);
    lines.push(`DTSTART:${i.start.replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')}`);
    lines.push(`DTEND:${i.end.replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')}`);
    lines.push(`SUMMARY:${i.title}`);
    if (i.location) lines.push(`LOCATION:${i.location}`);
    if (i.notes)    lines.push(`DESCRIPTION:${i.notes.replace(/\r?\n/g,'\\n')}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default function CalendarPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  // Semana ancla
  const [anchor, setAnchor] = useState(() => new Date());
  const from = startOfWeek(anchor, { weekStartsOn: 1 });
  const to   = endOfWeek(anchor,   { weekStartsOn: 1 });

  // Filtros
  const [query, setQuery]   = useState('');
  const [status, setStatus] = useState<'Todos' | InterviewDTO['status']>('Todos');

  // Crear entrevista (modal)
  const [openCreate, setOpenCreate] = useState(false);

  // Fetch entrevistas del rango (limit 200 según tu API)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['interviews', 'range', from.toISOString(), to.toISOString(), 200],
    queryFn: () => listInterviews({ from: toISO(from), to: toISO(to), limit: 200 }),
  });

  const items: InterviewDTO[] = data?.items ?? [];

  // Acciones
  const mStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: InterviewDTO['status'] }) =>
      updateInterview(id, { status: next }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteInterview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });

  // Aplicar búsqueda + estado + asegurar que cae en rango (defensivo)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(i => isWithinInterval(new Date(i.start), { start: from, end: to }))
      .filter(i => status === 'Todos' ? true : i.status === status)
      .filter(i => q ? (i.title?.toLowerCase().includes(q) || (i.location ?? '').toLowerCase().includes(q)) : true)
      .sort((a,b) => a.start.localeCompare(b.start));
  }, [items, from, to, status, query]);

  // Agrupar por día
  const groups = useMemo(() => {
    const map = new Map<string, InterviewDTO[]>();
    for (const i of filtered) {
      const key = format(parseISO(i.start), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(i);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort(([a],[b]) => a.localeCompare(b));
  }, [filtered]);

  // Handlers UI
  const prevWeek = () => setAnchor(d => addDays(d, -7));
  const nextWeek = () => setAnchor(d => addDays(d, 7));
  const goToday  = () => setAnchor(new Date());

  const exportCSV = () => {
    if (!filtered.length) return;
    const csv = makeCSV(filtered);
    const label = `${format(from,'yyyyMMdd')}-${format(to,'yyyyMMdd')}`;
    downloadFile(`entrevistas_${label}.csv`, csv, 'text/csv');
  };

  const exportICS = () => {
    if (!filtered.length) return;
    const ics = makeICS(filtered);
    const label = `${format(from,'yyyyMMdd')}-${format(to,'yyyyMMdd')}`;
    downloadFile(`entrevistas_${label}.ics`, ics, 'text/calendar');
  };

  return (
    <div className="relative">
      {/* fondo suave */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={exportCSV}>
                <Download className="size-4 mr-2" /> CSV
              </button>
              <button className="btn" onClick={exportICS}>
                <Download className="size-4 mr-2" /> ICS
              </button>
              <button className="btn btn-primary" onClick={()=>setOpenCreate(true)}>
                <Plus className="size-4 mr-2" /> Programar entrevista
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button className="btn" onClick={prevWeek}><ChevronLeft className="size-4" /></button>
              <button className="btn" onClick={goToday}>Hoy</button>
              <button className="btn" onClick={nextWeek}><ChevronRight className="size-4" /></button>
              <span className="text-sm text-[--color-muted] ml-2">
                {format(from, "d 'de' MMM", { locale: es })} — {format(to, "d 'de' MMM, yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                className="input w-56"
                placeholder="Buscar (título/ubicación)…"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
              />
              <select
                className="input w-40"
                value={status}
                onChange={(e)=>setStatus(e.target.value as any)}
                aria-label="Filtrar por estado"
              >
                <option>Todos</option>
                <option>Programada</option>
                <option>Completada</option>
                <option>Cancelada</option>
                <option>Pendiente</option>
              </select>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
          {isError && <div className="p-4 text-red-600">No se pudieron cargar las entrevistas.</div>}
          {isLoading ? (
            <ul className="space-y-2" aria-busy>
              <li className="h-16 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
              <li className="h-16 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
              <li className="h-16 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
            </ul>
          ) : filtered.length === 0 ? (
            <Empty
              title="Sin entrevistas en esta semana"
              description="Programá entrevistas o mové el rango semanal."
              action={<button className="btn btn-primary" onClick={()=>setOpenCreate(true)}>Programar entrevista</button>}
            />
          ) : (
            <div className="space-y-4">
              {groups.map(([day, events]) => (
                <div key={day}>
                  <h3 className="text-sm font-semibold text-[--color-muted] mb-2">
                    {format(parseISO(day), "EEEE d 'de' MMMM", { locale: es })}
                  </h3>
                  <ul className="space-y-2">
                    {events.map(i => (
                      <li key={i.id} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{i.title}</p>
                          <p className="text-xs text-[--color-muted] truncate">
                            {format(parseISO(i.start), "HH:mm", { locale: es })} — {format(parseISO(i.end), "HH:mm", { locale: es })}
                            {i.location ? ` · ${i.location}` : ''}
                            {' · '}{i.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {i.status !== 'Completada' && (
                            <button
                              className="btn"
                              onClick={()=>mStatus.mutate({ id: i.id, next: 'Completada' })}
                              title="Marcar como completada"
                            >
                              <CheckCheck className="size-4 mr-1" /> Done
                            </button>
                          )}
                          {i.status !== 'Cancelada' && (
                            <button
                              className="btn"
                              onClick={()=>mStatus.mutate({ id: i.id, next: 'Cancelada' })}
                              title="Cancelar"
                            >
                              <Ban className="size-4 mr-1" /> Cancelar
                            </button>
                          )}
                          <button
                            className="btn"
                            onClick={async ()=> {
                              const ok = await confirm({ tone:'danger', title:'Eliminar entrevista', message:'Esta acción no se puede deshacer.' });
                              if (ok) mDelete.mutate(i.id);
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="size-4 mr-1" /> Borrar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal crear */}
      <Modal open={openCreate} onClose={()=>setOpenCreate(false)}>
        <ScheduleInterviewModal candidateId={''} onClose={()=>setOpenCreate(false)} />
      </Modal>
    </div>
  );
}
