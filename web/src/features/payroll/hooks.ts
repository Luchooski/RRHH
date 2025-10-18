import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Payroll, ListOut, Status } from './dto';
import { http } from '@/lib/http';

const qs = (params: Record<string, unknown>) =>
  Object.entries(params).filter(([,v]) => v !== undefined && v !== '')
  .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');

export function useListPayrolls(query: Partial<{ q:string; period:string; employee:string; status:z.infer<typeof Status>; limit:number; skip:number; sortField:string; sortDir:'asc'|'desc'; }>) {
  return useQuery({
    queryKey: ['payrolls', query],
    queryFn: async () => {
      const res = await http.get(`/api/v1/payrolls?${qs(query)}`);
      return ListOut.parse(res.data);
    },
  });
}

export function useGetPayroll(id?: string) {
  return useQuery({
    queryKey: ['payroll', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await http.get(`/api/v1/payrolls/${id}`);
      return Payroll.parse(res.data);
    },
  });
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await http.post('/api/v1/payrolls', payload);
      return Payroll.parse(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] }),
  });
}

export function useUpdatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) => {
      const res = await http.put(`/api/v1/payrolls/${id}`, payload);
      return Payroll.parse(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: z.infer<typeof Status> }) => {
      const res = await http.patch(`/api/v1/payrolls/${id}/status`, { status });
      return Payroll.parse(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] }),
  });
}

export async function downloadReceiptPdf(id: string) {
  const res = await http.get(`/api/v1/payrolls/${id}/receipt.pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url; a.download = `recibo_${id}.pdf`; a.click();
  URL.revokeObjectURL(url);
}
