import { z } from 'zod';
export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  match: z.number().int(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export const CandidateInputSchema = CandidateSchema.pick({
  name: true, email: true, role: true, match: true, status: true
}).partial({ match: true, status: true });
export const CandidatesSchema = z.array(CandidateSchema);
export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateInput = z.infer<typeof CandidateInputSchema>;
