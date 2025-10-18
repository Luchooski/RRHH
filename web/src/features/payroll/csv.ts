export function toCsv(rows: any[]): string {
  if (!rows.length) return '';
  const headers = ['Empleado','Periodo','Estado','Bruto','Deducciones','Neto','Moneda'];
  const body = rows.map(r => [
    r.employeeName, r.period, r.status, r.grossTotal, r.deductionsTotal, r.netTotal, r.currency
  ]);
  return [headers, ...body]
    .map(cols => cols.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';'))
    .join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
