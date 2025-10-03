import type { Candidate } from '@/features/candidates/dto';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { Empty } from '../components/ui/Empty';

type Props = { data: Candidate[]; loading?: boolean; onDelete?: (id: string) => void };

const statusVariant = (s: string | undefined) =>
  s === 'Hired' ? 'success'
  : s === 'Rejected' ? 'danger'
  : s === 'Entrevista' ? 'info'
  : s === 'Offer' ? 'warning'
  : 'neutral';

export default function CandidateTable({ data, loading, onDelete }: Props) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  if (!data?.length) return <Empty text="Sin candidatos para mostrar" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b bg-gray-50">
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Rol</th>
            <th className="px-3 py-2">Match</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 w-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="px-3 py-2">{c.name}</td>
              <td className="px-3 py-2">{c.email}</td>
              <td className="px-3 py-2">{c.role}</td>
              <td className="px-3 py-2">{c.match ?? 0}%</td>
              <td className="px-3 py-2">
                <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              </td>
              <td className="px-3 py-2">
                <button onClick={() => onDelete?.(c.id)} className="text-red-600 hover:underline" aria-label={`Eliminar ${c.name}`}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
