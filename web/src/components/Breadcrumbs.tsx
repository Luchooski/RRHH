import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const parts = [{ label: 'Inicio', to: '/' }].concat(
    segments.map((seg, i) => ({
      label: seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      to: '/' + segments.slice(0, i + 1).join('/')
    }))
  );
  return (
    <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-[--color-muted]">
      <ol className="flex flex-wrap items-center gap-1">
        {parts.map((p, i) => (
          <li key={p.to} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {i === parts.length - 1 ? (
              <span className="font-medium text-[--color-fg]">{p.label}</span>
            ) : (
              <Link className="hover:underline" to={p.to}>{p.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
