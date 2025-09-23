// web/src/features/interviews/api.ts
import { Interview, InterviewInput, type InterviewT, type InterviewInputT } from './schema';
import z from 'zod';
import { http } from '../../lib/http';

async function j<T>(p: Promise<T>): Promise<T> { return p; } // conserva tu helper

export async function getInterviews(): Promise<InterviewT[]> {
  const data = await http<unknown>('/api/v1/interviews');
  const parsed = z.array(Interview).safeParse(data);
  if (!parsed.success) throw new Error('Invalid interviews payload');
  return parsed.data;
}

export async function createInterview(input: InterviewInputT): Promise<InterviewT> {
  const body = InterviewInput.parse(input);
  return http<InterviewT>('/api/v1/interviews', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateInterview(id: string, patch: Partial<InterviewInputT>): Promise<InterviewT> {
  return http<InterviewT>(`/api/v1/interviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteInterview(id: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`/api/v1/interviews/${id}`, { method: 'DELETE' });
}
