import type { Candidate } from '../features/candidates/dto';

type Props = {
  data: Candidate[];
  loading?: boolean;
  onDelete?: (id: string) => void;
};

const Empty = () => (
  <div className="text-center text-sm text-gray-500 p-6">Sin candidatos para mostrar</div>
);

const Loading = () => (
  <div className="animate-pulse p-4 space-y-3">
    <div className="h-4 bg-gray-200 rounded" />
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-2/3" />
  </div>
);

export default function CandidateTable({ data, loading, onDelete }: Props) {
  if (loading) return <Loading />;
  if (!data?.length) return <Empty />;

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
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                  {c.status}
                </span>
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  {/* placeholder para futura edición */}
                  <button
                    onClick={() => onDelete?.(c.id)}
                    className="text-red-600 hover:underline"
                    aria-label={`Eliminar ${c.name}`}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
