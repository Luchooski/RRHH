import StatusBadge from '../../components/StatusBadge';
import KebabMenu from '../../components/KebabMenu';
import type { Candidate } from './dto';

export default function CandidateCard({
  c, onEdit, onDelete
}: { c: Candidate; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="card p-4 flex flex-col gap-2">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{c.name}</div>
          <div className="text-xs text-[--color-muted]">{c.email}</div>
        </div>
        <KebabMenu items={[
          { label: 'Editar', onClick: onEdit },
          { label: 'Borrar', onClick: onDelete, danger: true }
        ]}/>
      </header>
      <div className="text-sm flex flex-wrap gap-3">
        <div><span className="text-[--color-muted]">Rol:</span> {c.role}</div>
        <div><span className="text-[--color-muted]">Match:</span> {c.match}%</div>
        <div className="inline-flex items-center gap-2">
          <span className="text-[--color-muted]">Estado:</span> <StatusBadge value={c.status}/>
        </div>
      </div>
      <footer className="text-xs text-[--color-muted]">
        Actualizado {new Date(c.updatedAt).toLocaleDateString()}
      </footer>
    </article>
  );
}
