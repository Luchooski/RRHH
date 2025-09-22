export default function ScheduleCard({ row }:{ row: any }) {
  return (
    <article className="card p-4 space-y-2">
      <div className="font-semibold">{row.employee}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {(['Mon','Tue','Wed','Thu','Fri'] as const).map(day => (
          <label key={day} className="flex items-center gap-2">
            <span className="w-10 text-[--color-muted]">{day}</span>
            <input className="input flex-1" defaultValue={(row as any)[day]} readOnly />
           {/* min-w-0 evita desbordes en flex; w-full llena la celda */}
            <input
              className="input flex-1 min-w-0 w-full"
              defaultValue={(row as any)[day]}
              readOnly
            />
          </label>
        ))}
      </div>
    </article>
  );
}
