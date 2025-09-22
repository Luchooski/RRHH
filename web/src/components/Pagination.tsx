export default function Pagination({
  page, totalPages, onPrev, onNext
}: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="text-sm text-zinc-500">Página {page} de {totalPages}</div>
      <div className="flex gap-2">
        <button className="btn touch-target" disabled={page<=1} onClick={onPrev}>Anterior</button>
        <button className="btn touch-target" disabled={page>=totalPages} onClick={onNext}>Siguiente</button>
      </div>
    </div>
  );
}
