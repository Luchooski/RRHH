export default function InfoItem({
  label,
  value,
  href
}: {
  label: string;
  value: string;
  href?: string; // mailto:, tel:, http…
}) {
  const content = href ? (
    <a
      className="font-medium break-words hover:underline"
      href={href}
      rel="noopener noreferrer"
    >
      {value}
    </a>
  ) : (
    <div className="font-medium break-words">{value}</div>
  );

  return (
    <div className="card p-3">
      <div className="text-sm text-[--color-muted]">{label}</div>
      {content}
    </div>
  );
}
