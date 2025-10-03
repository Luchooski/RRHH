type Props = { label?: string; className?: string; size?: number };
export default function Spinner({ label='Cargando…', className='', size=18 }: Props) {
  const s = `${size}px`;
  return (
    <span role="status" aria-live="polite" aria-label={label} className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={s} height={s} viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" fill="none" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
