import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getConversion, getTimeToClose, exportCSV, exportPDF } from './api';
import { KpiCard } from '@/components/ui/KpiCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, MessageSquare, UserCheck, Timer, Download, FileText, BarChart3 } from 'lucide-react';
import Empty from '@/components/ui/Empty';

export default function ReportsPage() {
  // Rango por defecto: últimos 30 días
  const [from, setFrom] = useState(startOfDay(subDays(new Date(), 30)).toISOString());
  const [to,   setTo]   = useState(endOfDay(new Date()).toISOString());

  const convQ = useQuery({ queryKey: ['reports:conversion', { from, to }], queryFn: () => getConversion({ from, to }) });
  const ttcQ  = useQuery({ queryKey: ['reports:ttc', { from, to }],        queryFn: () => getTimeToClose({ from, to }) });

  const chartData = useMemo(() => {
    if (!convQ.data) return [];
    return [
      { name: 'Enviados',    value: convQ.data.sent },
      { name: 'Entrevista',  value: convQ.data.interview },
      { name: 'Contratados', value: convQ.data.hired },
    ];
  }, [convQ.data]);

  const hasChartData = (convQ.data?.sent ?? 0) + (convQ.data?.interview ?? 0) + (convQ.data?.hired ?? 0) > 0;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        {/* Header + filtros */}
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
              <p className="text-sm text-[--color-muted]">Resultados para tu cliente y analítica interna.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <label className="space-y-1">
                <span className="text-xs">Desde</span>
                <input
                  type="datetime-local"
                  className="input"
                  value={from.slice(0,16)}
                  onChange={(e)=>setFrom(new Date(e.target.value).toISOString())}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs">Hasta</span>
                <input
                  type="datetime-local"
                  className="input"
                  value={to.slice(0,16)}
                  onChange={(e)=>setTo(new Date(e.target.value).toISOString())}
                />
              </label>
              <button className="btn"
                onClick={()=>exportCSV({ from, to })}
                title="Exportar CSV">
                <Download className="size-4 mr-2" /> CSV
              </button>
              <button className="btn btn-primary"
                onClick={()=>exportPDF({ from, to })}
                title="Exportar PDF">
                <FileText className="size-4 mr-2" /> PDF
              </button>
            </div>
          </div>
          <p className="text-xs text-[--color-muted] mt-2">
            Período: {format(new Date(from), "PPpp", { locale: es })} — {format(new Date(to), "PPpp", { locale: es })}
          </p>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Enviados"    value={convQ.data?.sent ?? 0}        icon={<Send className="size-5" />}           tone="purple" />
          <KpiCard label="Entrevista"  value={convQ.data?.interview ?? 0}   icon={<MessageSquare className="size-5" />}  tone="primary" />
          <KpiCard label="Contratados" value={convQ.data?.hired ?? 0}       icon={<UserCheck className="size-5" />}      tone="green" />
          <KpiCard label="Tiempo de cierre (días)" value={ttcQ.data?.avgDays ?? 0} icon={<Timer className="size-5" />} tone="amber" />
        </section>

        {/* Chart conversión */}
        <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Conversión en el período</h2>
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
                title="Sin datos"
                description="Ajustá el período o cargá aplicaciones para ver la conversión."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
