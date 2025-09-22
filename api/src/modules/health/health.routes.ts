import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/v1/health', async () => ({ status: 'ok', uptime: process.uptime() }));
}
