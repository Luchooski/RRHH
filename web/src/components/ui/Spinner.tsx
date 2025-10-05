type Props = { size?: number; className?: string; label?: string };

export function Spinner({ size = 18, className = '', label }: Props) {
  const s = { width: size, height: size };
  return (
    <div role="status" aria-live="polite" className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg viewBox="0 0 24 24" style={s} className="spin" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25"/>
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none"/>
      </svg>
      {label ? <span style={{ color: 'var(--color-muted)', fontSize: 14 }}>{label}</span> : null}
    </div>
  );
}
export default Spinner;
