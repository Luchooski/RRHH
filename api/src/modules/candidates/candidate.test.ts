import { buildApp } from '../../app.js';

describe('Candidates', () => {
  const envBackup = process.env;
  beforeAll(() => { process.env = { ...envBackup, MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/rrhh_test', PORT: '0' }; });
  afterAll(() => { process.env = envBackup; });

  it('health ok', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
    await app.close();
  });

  it('create and list candidate', async () => {
    const app = await buildApp();
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/candidates',
      payload: { name: 'Ada Lovelace', email: 'ada@example.com', skills: ['typescript','node'] }
    });
    expect(created.statusCode).toBe(201);

    const list = await app.inject({ method: 'GET', url: '/api/v1/candidates?q=ada&limit=5&page=1' });
    expect(list.statusCode).toBe(200);
    const data = list.json();
    expect(data.items.length).toBeGreaterThan(0);
    await app.close();
  });
});
