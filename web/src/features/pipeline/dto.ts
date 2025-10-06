import { z } from 'zod';
export const Stage = z.enum(['sent','interview','feedback','offer','hired','rejected']);
export type Stage = z.infer<typeof Stage>;
export const PipelineCard = z.object({ id: z.string(), name: z.string(), status: Stage });
export type PipelineCard = z.infer<typeof PipelineCard>;
