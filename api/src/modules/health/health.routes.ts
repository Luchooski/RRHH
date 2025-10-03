import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // RUTA RELATIVA: el '/api/v1' lo aporta app.register(...)
  app.get('/health', async () => {
    return { ok: true, service: 'api', time: new Date().toISOString() };
  });
};

export default healthRoutes;
