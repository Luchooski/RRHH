import { Interview, InterviewInput, type InterviewT, type InterviewInputT } from './schema';
import z from 'zod';

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data;
}

export async function getInterviews(): Promise<InterviewT[]> {
  const res = await fetch('/api/v1/interviews');
  const data = await j<unknown>(res);
  const parsed = z.array(Interview).safeParse(data);
  if (!parsed.success) throw new Error('Invalid interviews payload');
  return parsed.data;
}

export async function createInterview(input: InterviewInputT): Promise<InterviewT> {
  const body = InterviewInput.parse(input);
  const res = await fetch('/api/v1/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return j<InterviewT>(res);
}

export async function updateInterview(id: string, patch: Partial<InterviewInputT>): Promise<InterviewT> {
  const res = await fetch(`/api/v1/interviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return j<InterviewT>(res);
}

export async function deleteInterview(id: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/v1/interviews/${id}`, { method: 'DELETE' });
  return j<{ ok: true }>(res);
}
