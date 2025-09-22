export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-sm text-[--color-muted]">{title}</div>
      {hint && <div className="text-xs mt-1 text-zinc-500">{hint}</div>}
    </div>
  );
}
