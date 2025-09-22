export default function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 sm:p-5">  {/* p-5 = 20px */}
      <div className="text-sm text-[--color-muted]">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
