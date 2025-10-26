import fp from 'fastify-plugin';
 import type { FastifyInstance } from 'fastify';

export default fp(async function healthRoutes(app: FastifyInstance) {
  // Ruta RELATIVA (sin /api/v1). El prefijo se pone en app.ts
  app.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));
});