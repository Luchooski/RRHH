import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { http } from '@/lib/http';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Empty from '@/components/ui/Empty';

interface TrendData {
  date: string;
  count: number;
  careersPage: number;
}

interface TrendsResponse {
  trends: TrendData[];
}

export function TrendsChart() {
  const { data, isLoading } = useQuery<TrendsResponse>({
    queryKey: ['tenant', 'application-trends', 30],
    queryFn: () => http.get('/api/v1/tenants/me/application-trends?days=30'),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm animate-pulse">
        <div className="h-80" />
      </div>
    );
  }

  const trends = data?.trends || [];
  const hasData = trends.some(t => t.count > 0);

  // Formatear datos para el gráfico
  const chartData = trends.map(t => ({
    date: format(parseISO(t.date), 'd MMM', { locale: es }),
    'Total aplicaciones': t.count,
    'Desde página carreras': t.careersPage,
  }));

  return (
    <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">Tendencias de aplicaciones (últimos 30 días)</h2>
        <TrendingUp className="size-5 text-[--color-muted]" />
      </div>

      <div className="h-80">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Total aplicaciones"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Desde página carreras"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty
            icon={<TrendingUp className="size-5" />}
            title="Sin datos de tendencias"
            description="Registra aplicaciones para ver el gráfico de tendencias en los últimos 30 días."
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
