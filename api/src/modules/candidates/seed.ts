import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Candidate } from './candidate.model.js';

const skillsPool = ['react','node','typescript','mongodb','express','tailwind','aws','jest','docker'];
function sample<T>(arr: T[], n: number): T[] { return arr.slice().sort(() => 0.5 - Math.random()).slice(0, n); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const seedRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.route({
    method: 'POST',
    url: '/dev/seed/candidates',
    schema: { querystring: z.object({ count: z.coerce.number().min(1).max(200).default(30) }) },
    handler: async (req, reply) => {
      if (app.config.nodeEnv !== 'development') return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Seed only in development' } });
      const docs = Array.from({ length: req.query.count }).map((_, i) => ({
        name: `Candidato ${i + 1}`,
        email: `candidato${i + 1}@example.com`,
        phone: `+54 9 351 ${String(100000 + i).padStart(6, '0')}`,
        skills: sample(skillsPool, 2 + Math.floor(Math.random() * 3)),
        status: pick(['new','screening','interview','offer','hired','rejected']),
        source: 'import'
      }));
      await Candidate.insertMany(docs, { ordered: false });
      return { ok: true, inserted: docs.length };
    }
  });
};

export default seedRoutes;
