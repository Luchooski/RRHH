import { http } from '@/lib/http';

export async function listByVacancy(vacancyId: string) {
  const res = await http.get(`/api/v1/applications?vacancyId=${vacancyId}`, { auth: true }) as Response;
  const data = await res.json();
  return (data.items ?? []) as { id:string; candidateId:string; status:string; candidateName?:string }[];
}

export async function updateStatus(applicationId: string, status: string) {
  const res = await http.patch(`/api/v1/applications/${applicationId}`, { json: { status }, auth: true }) as Response;
  return res.json();
}
