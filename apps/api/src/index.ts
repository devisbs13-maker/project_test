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
import { playerRoutes } from './routes/player.js';
import { duelRoutes } from './routes/duel.js';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// CORS: allow local dev and optionally extra origins via env.
// Mixed content note: when the WebApp is served over HTTPS (GitHub Pages),
// the API must also be HTTPS (e.g., via ngrok) — browsers block HTTPS→HTTP.
const defaultOrigins = ['http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
const pagesOrigin = 'https://devisbs13-maker.github.io';
const extra = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowAny = String(process.env.CORS_ANY || '').toLowerCase() === 'true';
const allowList = new Set([...defaultOrigins, pagesOrigin, ...extra]);

await server.register(cors, {
  origin: allowAny ? true : (origin, cb) => {
    if (!origin) return cb(null, true);
    return cb(null, allowList.has(origin));
  },
  credentials: true,
});

await server.register(verifyInitData);
await initStorage();

await server.register(healthRoutes);
await server.register(apiRoutes);
await server.register(playerRoutes);
await server.register(duelRoutes);
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

