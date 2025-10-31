import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { apiRoutes } from './routes/api.js';
import { verifyInitData } from './middlewares/verifyInitData.js';
// import { leaderboardRoutes } from './routes/leaderboard.js';
import { leaderboardRoutesV1 } from './routes/leaderboard_v1.js';
import { clanRoutesV1 } from './routes/clans_v1.js';
import { initStorage } from './repos/index.js';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await server.register(cors, {
  origin: ['http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
});

await server.register(verifyInitData);
await initStorage();

await server.register(healthRoutes);
await server.register(apiRoutes);
await server.register(leaderboardRoutesV1);
await server.register(clanRoutesV1);

const port = Number(process.env.API_PORT || process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

server
  .listen({ port, host })
  .then(() => server.log.info(`API listening on http://${host}:${port}`))
  .catch((err) => {
    server.log.error(err, 'Failed to start server');
    process.exit(1);
  });
