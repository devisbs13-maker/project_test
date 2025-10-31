import type { FastifyInstance } from 'fastify';
import { getWeeklyTop, addTick } from '../repos/index.js';

function currentUser(req: any) {
  const id = String(req.tgUserId || req.headers['x-user-id'] || 'local-user');
  const name = String(req.tgUserName || req.headers['x-user-name'] || 'Путник');
  return { id, name };
}

export async function leaderboardRoutesV1(app: FastifyInstance) {
  app.get('/leaderboard/weekly', async (req) => {
    const limit = Number((req.query as any)?.limit ?? 20);
    const top = getWeeklyTop(limit);
    return top;
  });

  app.post('/score/tick', async (req, reply) => {
    const { id, name } = currentUser(req);
    const body = (req.body as any) || {};
    const delta = Number(body.delta || 0);
    const reason = String(body.reason || '');
    if (!Number.isFinite(delta) || delta <= 0) return reply.code(400).send({ ok: false, error: 'delta must be > 0' });
    const score = addTick(id, name, delta);
    return { ok: true, data: { score } };
  });
}
