// api/src/modules/health/health.routes.ts
import { FastifyInstance } from 'fastify';

async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { ok: true, service: 'api', ts: new Date().toISOString() };
  });
}

export default healthRoutes;
