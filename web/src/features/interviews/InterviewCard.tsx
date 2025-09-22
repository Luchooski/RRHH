import StatusPill from '../../components/StatusPill';
import type { IStatus } from '../../mock/interviews';

export default function InterviewCard({
  name,
  datetime,
  status,
  onStatus,
  onNote
}: {
  name: string;
  datetime: string;
  status: IStatus;
  onStatus: (s: IStatus) => void;
  onNote: () => void;
}) {
  return (
    <article className="card p-4 flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{name}</div>
          <div className="text-xs text-zinc-500">{new Date(datetime).toLocaleString()}</div>
        </div>
        <StatusPill status={status} />
      </header>

      <div className="flex gap-2">
        <select
          className="input touch-target flex-1"
          value={status}
          aria-label={`Cambiar estado de ${name}`}
          onChange={(e) => onStatus(e.target.value as IStatus)}
        >
          {['Programada','Completada','Cancelada','Pendiente'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary touch-target" onClick={onNote}>Añadir nota</button>
      </div>
    </article>
  );
}
