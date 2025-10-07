import { Link } from 'react-router-dom';

export type Crumb = { label: string; to?: string };
type Props = {
  items?: Crumb[];        // <-- ahora opcional
  className?: string;
};

export default function Breadcrumbs({ items = [], className }: Props) {
  if (!items.length) return null;
  return (
    <nav aria-label="breadcrumb" className={className}>
      <ol className="flex flex-wrap gap-1 text-sm text-[--color-muted]">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {c.to ? (
              <Link to={c.to} className="hover:underline">{c.label}</Link>
            ) : (
              <span className="text-foreground">{c.label}</span>
            )}
            {i < items.length - 1 && <span className="opacity-50">›</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
