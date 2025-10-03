export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card p-8 text-center text-[--color-muted]">
      <p className="text-base font-medium">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}
