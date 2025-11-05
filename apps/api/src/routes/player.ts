import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma/client.js';

export async function playerRoutes(app: FastifyInstance) {
  // GET /player/me – get player snapshot (JSON). Creates a minimal record if missing.
  app.get('/player/me', async (req, reply) => {
    try {
      const id = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
      const name = String((req as any).tgUserName || req.headers['x-user-name'] || 'Adventurer');
      const classId = 'warrior';
      let rec = await prisma.playerState.findUnique({ where: { id } });
      if (!rec) {
        const data = { name, classId, gold: 100, energy: 8, inventory: [], equipment: {}, stats: { str:5, agi:5, int:5, vit:5 }, progress: { level:1, xp:0, xpToNext:35 } };
        rec = await prisma.playerState.create({ data: { id, name, classId, data } });
      }
      return { ok: true, data: rec };
    } catch (e) {
      app.log.error({ err: e }, 'player.me');
      return reply.code(500).send({ ok:false, error:'failed' });
    }
  });

  // POST /player/save – replace snapshot with provided JSON
  app.post('/player/save', async (req, reply) => {
    try {
      const id = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
      const body = (req.body ?? {}) as any;
      const data = body?.data ?? body; // allow raw snapshot
      const name = String(data?.name || 'Adventurer');
      const classId = String(data?.classId || data?.class || 'warrior');
      const rec = await prisma.playerState.upsert({
        where: { id },
        update: { name, classId, data },
        create: { id, name, classId, data },
      });
      return { ok: true, data: rec };
    } catch (e) {
      app.log.error({ err: e }, 'player.save');
      return reply.code(500).send({ ok:false, error:'failed' });
    }
  });
}



