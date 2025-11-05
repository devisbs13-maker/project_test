import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma/client.js';

const FACTIONS = [
  { id: 'f1', name: 'Test 1' },
  { id: 'f2', name: 'Test 2' },
  { id: 'f3', name: 'Test 3' },
];

export async function factionRoutes(app: FastifyInstance) {
  // GET /faction/list — static list + member counts
  app.get('/faction/list', async () => {
    const counts = await prisma.factionMember.groupBy({ by: ['factionId'], _count: { factionId: true } });
    const map = new Map(counts.map(c => [c.factionId, c._count.factionId]));
    return { ok: true, items: FACTIONS.map(f => ({ ...f, members: map.get(f.id) || 0 })) };
  });

  // GET /faction/me — current membership
  app.get('/faction/me', async (req) => {
    const userId = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
    const m = await prisma.factionMember.findUnique({ where: { userId } });
    return { ok: true, factionId: m?.factionId || null };
  });

  // POST /faction/join { factionId }
  app.post('/faction/join', async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const factionId = String(body?.factionId || '');
    if (!FACTIONS.some(f => f.id === factionId)) return reply.code(400).send({ ok:false, error:'bad faction' });
    const userId = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
    await prisma.factionMember.upsert({ where: { userId }, update: { factionId }, create: { userId, factionId } });
    return { ok: true, factionId };
  });

  // POST /faction/leave
  app.post('/faction/leave', async (req) => {
    const userId = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
    await prisma.factionMember.delete({ where: { userId } }).catch(() => {});
    return { ok: true };
  });
}

