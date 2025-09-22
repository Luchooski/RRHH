export function Table({ head, children }:{ head: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-0 overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-zinc-500">{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}
