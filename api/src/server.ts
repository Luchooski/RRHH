import { buildApp } from './app.js';
import { env } from './config/env.js';

buildApp()
  .then((app) =>
    app.listen({ port: env.port, host: '0.0.0.0' })
      .then(() => app.log.info(`API http://localhost:${env.port}`))
  )
  .catch((err) => { console.error(err); process.exit(1); });
