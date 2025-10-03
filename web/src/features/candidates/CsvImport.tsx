import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';

type Row = { fullName?: string; nombre?: string; email?: string; phone?: string; telefono?: string; skills?: string; habilidades?: string; status?: string };
type Out = { fullName: string; email: string; phone?: string; skills?: string; status?: string };

export default function CsvImport({ onRows }: { onRows: (rows: Out[]) => void }) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<Row>) => {                  // ✅ tipado
        const rows: Out[] = res.data
          .map(r => ({
            fullName: (r.fullName ?? r.nombre ?? '').trim(),
            email: (r.email ?? '').trim(),
            phone: (r.phone ?? r.telefono ?? '').trim(),
            skills: (r.skills ?? r.habilidades ?? '').trim(),
            status: (r.status ?? '').trim(),
          }))
          .filter(r => r.fullName && r.email);
        onRows(rows);
      },
    });
  }
  return (
    <label className="btn">
      Importar CSV
      <input type="file" accept=".csv" onChange={handleFile} className="sr-only" />
    </label>
  );
}
