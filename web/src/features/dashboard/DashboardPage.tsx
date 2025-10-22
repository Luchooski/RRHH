import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/ui/KpiCard';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Plus, Briefcase, Users2, UserRound,
  Send, MessageSquare, UserCheck, Timer, BarChart3, CalendarClock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { getConversion, getTimeToClose } from '@/features/reports/api';
import { listInterviews } from '@/features/interviews/api';
import { listVacancies } from '@/features/vacancies/api';
import type { InterviewDTO } from '@/features/interviews/calendar.schema';
import type { VacancyDTO } from '@/features/vacancies/vacancy.schema';
import Empty from '@/components/ui/Empty';
import { CareersUrlWidget } from '@/components/dashboard/CareersUrlWidget';
import { TrendsChart } from '@/components/dashboard/TrendsChart';

export default function DashboardPage() {
  // KPIs (reportes)
  const { data: conv } = useQuery({ queryKey: ['reports:conversion'], queryFn: () => getConversion() });
  const { data: ttc }  = useQuery({ queryKey: ['reports:ttc'],        queryFn: () => getTimeToClose() });

  // Rango semanal actual para entrevistas
  const from = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
  const to   = endOfWeek(new Date(),   { weekStartsOn: 1 }).toISOString();

  // Entrevistas (rango semanal)
  const { data: intRes, isLoading: intLoading } = useQuery<{
    items: InterviewDTO[]; total: number; page: number; pageSize: number;
  }>({
    queryKey: ['interviews', 'range', from, to],
    queryFn: () => listInterviews({ from, to, limit: 50 }),
  });

  const interviews: InterviewDTO[] = intRes?.items ?? [];

  const upcoming = useMemo(() => {
    const now = new Date();
    return interviews
      .filter(i => new Date(i.start) > now)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 6);
  }, [interviews]);

  // Vacantes abiertas (paginado ligero)
  const vacQ = useQuery({
    queryKey: ['vacancies:dashboard', { status: 'open', page: 1, limit: 50 }],
    queryFn: () => listVacancies({ status: 'open', page: 1, limit: 50 }),
  });
  const vacLoading = vacQ.isLoading;
  const openVacancies: VacancyDTO[] = vacQ.data?.items ?? [];

  // Datos del gráfico de conversión
  const chartData = conv ? [
    { name: 'Enviados',    value: conv.sent },
    { name: 'Entrevista',  value: conv.interview },
    { name: 'Contratados', value: conv.hired }
  ] : [];
  const hasChartData = (conv?.sent ?? 0) + (conv?.interview ?? 0) + (conv?.hired ?? 0) > 0;

  return (
    <div className="relative">
      {/* Fondo decorativo suave */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        {/* Header + Acciones */}
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-[--color-muted]">Resumen operativo y atajos de tu consultora.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/vacantes/nueva" className="btn">
                <Briefcase className="size-4 mr-2" /> Nueva vacante
              </Link>
              <Link to="/clientes/nuevo" className="btn">
                <Users2 className="size-4 mr-2" /> Nuevo cliente
              </Link>
              <Link to="/candidatos/nuevo" className="btn">
                <UserRound className="size-4 mr-2" /> Nuevo candidato
              </Link>
              <Link to="/agenda" className="btn btn-primary">
                <CalendarDays className="size-4 mr-2" /> Agenda
              </Link>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Enviados"    value={conv?.sent ?? 0}        icon={<Send className="size-5" />}           tone="purple" />
          <KpiCard label="Entrevista"  value={conv?.interview ?? 0}   icon={<MessageSquare className="size-5" />}  tone="primary" />
          <KpiCard label="Contratados" value={conv?.hired ?? 0}       icon={<UserCheck className="size-5" />}      tone="green" />
          <KpiCard label="Tiempo de cierre (días)" value={ttc?.avgDays ?? 0} icon={<Timer className="size-5" />} tone="amber" />
        </section>

        {/* Careers URL Widget */}
        <CareersUrlWidget />

        {/* Conversión + Próximas entrevistas */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Conversión</h2>
              <Link to="/reportes" className="text-sm text-[--color-primary] hover:underline">Ver reportes</Link>
            </div>
            <div className="h-72">
              {hasChartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty
                  icon={<BarChart3 className="size-5" />}
                  title="Sin datos de conversión"
                  description="Registra aplicaciones y movimientos del pipeline para ver este gráfico."
                  action={<Link to="/vacantes/nueva" className="btn btn-primary">Crear vacante</Link>}
                  className="h-full"
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Próximas entrevistas</h2>
              <Link to="/agenda" className="text-sm text-[--color-primary] hover:underline">Ver agenda</Link>
            </div>
            {intLoading ? (
              <ul className="space-y-2" aria-busy>
                <li className="h-12 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
                <li className="h-12 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
                <li className="h-12 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
              </ul>
            ) : upcoming.length ? (
              <ul className="space-y-2">
                {upcoming.map(i => (
                  <li key={i.id} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{i.title}</p>
                      <p className="text-xs text-[--color-muted]">
                        {format(parseISO(i.start), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Link to="/agenda" className="btn btn-ghost">
                      <Plus className="size-4 mr-1" /> Reprogramar
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                icon={<CalendarClock className="size-5" />}
                title="Sin entrevistas próximas"
                description="Programá entrevistas desde la Agenda para verlas aquí."
                action={<Link to="/agenda" className="btn btn-primary">Abrir agenda</Link>}
              />
            )}
          </div>
        </section>

        {/* Tendencias de aplicaciones */}
        <TrendsChart />

        {/* Vacantes abiertas */}
        <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Vacantes abiertas</h2>
            <Link to="/vacantes" className="text-sm text-[--color-primary] hover:underline">Ver vacantes</Link>
          </div>
          {vacLoading ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2" aria-busy>
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="h-16 rounded-lg animate-pulse bg-black/5 dark:bg-white/5" />
              ))}
            </ul>
          ) : openVacancies.length ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {openVacancies.slice(0, 6).map(v => (
                <li key={v.id} className="rounded-lg border p-3 hover:bg-black/5 dark:hover:bg-white/5">
                  <p className="font-medium truncate">{v.title}</p>
                  <p className="text-xs text-[--color-muted] truncate">{v.companyName ?? '—'}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title="Sin vacantes abiertas"
              description="Creá una vacante para empezar a recibir candidatos."
              action={<Link to="/vacantes/nueva" className="btn btn-primary">Nueva vacante</Link>}
            />
          )}
        </section>
      </div>
    </div>
  );
}
