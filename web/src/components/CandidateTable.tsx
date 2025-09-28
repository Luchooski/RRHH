import type { Candidate } from '../features/candidates/dto';

type Props = {
  data: Candidate[];
  loading?: boolean;
  onDelete?: (id: string) => void;
};

export default function CandidateTable({ data, loading, onDelete }: Props) {
  if (loading) return <div className="p-4">Cargando…</div>;
  if (!data?.length) return <div className="p-4">Sin resultados</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-sm text-gray-500">
            <th className="px-3">Nombre</th>
            <th className="px-3">Email</th>
            <th className="px-3">Rol</th>
            <th className="px-3">Match</th>
            <th className="px-3">Estado</th>
            <th className="px-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map(c => (
            <tr key={c.id} className="bg-white hover:bg-gray-50">
              <td className="px-3 py-2">{c.name}</td>
              <td className="px-3 py-2">{c.email}</td>
              <td className="px-3 py-2">{c.role}</td>
              <td className="px-3 py-2">{c.match}</td>
              <td className="px-3 py-2">{c.status}</td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onDelete?.(c.id)}
                  className="text-red-600 text-sm hover:underline"
                  aria-label={`Eliminar ${c.name}`}
                >
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
