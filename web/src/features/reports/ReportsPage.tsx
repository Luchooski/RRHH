import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';

import { getConversion, getTimeToClose, exportUrls } from './api';
import Empty from '@/components/ui/Empty';

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

export default function ReportsPage() {
  const [from, setFrom] = useState(isoDate(startOfMonth(new Date())));
  const [to,   setTo]   = useState(isoDate(endOfMonth(new Date())));

  const convQ = useQuery({
    queryKey: ['reports:conversion', from, to],
    queryFn: () => getConversion({ from, to }),
  });

  const ttcQ = useQuery({
    queryKey: ['reports:ttc', from, to],
    queryFn: () => getTimeToClose({ from, to }),
  });

  const conv = convQ.data;
  const ttc  = ttcQ.data;
  const urls = exportUrls({ from, to });

  const convData = conv ? [
    { name: 'Enviados',    value: conv.sent },
    { name: 'Entrevistas', value: conv.interview },
    { name: 'Contratados', value: conv.hired },
  ] : [];

  const ttcSeries = useMemo(() => {
    const s = ttc?.series ?? [];
    return s.map(p => ({ name: p.week, value: p.avgDays }));
  }, [ttc?.series]);

  const hasConv = (conv?.sent ?? 0) + (conv?.interview ?? 0) + (conv?.hired ?? 0) > 0;
  const hasTTC  = (ttcSeries?.length ?? 0) > 0;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4">
        <header className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
              <p className="text-sm text-[--color-muted]">Resultados para compartir con tus clientes.</p>
            </div>
            <div className="flex gap-2">
              <a className="btn" href={urls.conversionCSV} target="_blank" rel="noreferrer">
                <Download className="size-4 mr-2" /> Conversión CSV
              </a>
              <a className="btn" href={urls.conversionPDF} target="_blank" rel="noreferrer">
                <FileText className="size-4 mr-2" /> Conversión PDF
              </a>
              <a className="btn" href={urls.ttcCSV} target="_blank" rel="noreferrer">
                <Download className="size-4 mr-2" /> TTC CSV
              </a>
              <a className="btn" href={urls.ttcPDF} target="_blank" rel="noreferrer">
                <FileText className="size-4 mr-2" /> TTC PDF
              </a>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <label className="label">Desde</label>
              <input className="input w-full" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="label">Hasta</label>
              <input className="input w-full" type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
            </div>
            <div className="flex items-center justify-end">
              <Link to="/dashboard" className="btn">Volver al dashboard</Link>
            </div>
          </div>
        </header>

        {/* Conversión */}
        <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-5" /> Conversión
            </h2>
            <p className="text-sm text-[--color-muted]">
              {format(parseISO(from), "d 'de' MMM", { locale: es })} — {format(parseISO(to), "d 'de' MMM, yyyy", { locale: es })}
            </p>
          </div>
          <div className="h-72">
            {hasConv ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={convData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                icon={<BarChart3 className="size-5" />}
                title="Sin datos en el rango"
                description="Generá actividades (envíos/entrevistas/contrataciones) para ver este gráfico."
              />
            )}
          </div>
        </section>

        {/* Tiempo de cierre */}
        <section className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-5" /> Tiempo promedio de cierre (días)
            </h2>
            <p className="text-sm text-[--color-muted]">
              {format(parseISO(from), "d 'de' MMM", { locale: es })} — {format(parseISO(to), "d 'de' MMM, yyyy", { locale: es })}
            </p>
          </div>
          <div className="h-72">
            {hasTTC ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ttcSeries} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                icon={<TrendingUp className="size-5" />}
                title="Sin datos en el rango"
                description="Cerrá vacantes para alimentar esta métrica."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
