import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma/client.js';

type DuelState = {
  current: 'A'|'B';
  a: { id: string; name: string; hp: number; maxHp: number };
  b?: { id: string; name: string; hp: number; maxHp: number };
  log: string[];
  winner?: 'A'|'B';
};

function startState(aId: string, aName: string): DuelState {
  return { current: 'A', a: { id: aId, name: aName, hp: 100, maxHp: 100 }, b: undefined, log: [] };
}

export async function duelRoutes(app: FastifyInstance) {
  // Create challenge
  app.post('/duel/challenge', async (req) => {
    const playerId = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
    const name = String((req as any).tgUserName || req.headers['x-user-name'] || 'Adventurer');
    const state = startState(playerId, decodeURIComponent(name));
    const duel = await prisma.duel.create({ data: { status: 'waiting', playerAId: playerId, state } });
    return { ok: true, id: duel.id };
  });

  // Accept challenge
  app.post('/duel/accept', async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const id = String(body?.id || '');
    if (!id) return reply.code(400).send({ ok:false, error:'missing id' });
    const playerId = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
    const name = String((req as any).tgUserName || req.headers['x-user-name'] || 'Adventurer');
    const duel = await prisma.duel.findUnique({ where: { id } });
    if (!duel) return reply.code(404).send({ ok:false, error:'not found' });
    if (duel.status !== 'waiting') return reply.code(400).send({ ok:false, error:'already started' });
    if (duel.playerAId === playerId) return reply.code(400).send({ ok:false, error:'cannot join own duel' });
    const st = duel.state as unknown as DuelState;
    st.b = { id: playerId, name: decodeURIComponent(name), hp: 100, maxHp: 100 };
    st.current = Math.random() < 0.5 ? 'A' : 'B';
    st.log.push(`${st.b.name} joined the duel.`);
    const upd = await prisma.duel.update({ where: { id }, data: { status: 'active', playerBId: playerId, state: st } });
    return { ok: true, id: upd.id };
  });

  // Get state
  app.get('/duel/:id', async (req, reply) => {
    const id = (req.params as any).id as string;
    const duel = await prisma.duel.findUnique({ where: { id } });
    if (!duel) return reply.code(404).send({ ok:false, error:'not found' });
    return { ok:true, data: duel };
  });

  // Submit action
  app.post('/duel/act', async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const id = String(body?.id || '');
    const action = String(body?.action || 'attack');
    if (!id) return reply.code(400).send({ ok:false, error:'missing id' });
    const playerId = String((req as any).playerId || req.headers['x-user-id'] || 'local-user');
    const duel = await prisma.duel.findUnique({ where: { id } });
    if (!duel) return reply.code(404).send({ ok:false, error:'not found' });
    if (duel.status !== 'active') return reply.code(400).send({ ok:false, error:'not active' });
    const st = duel.state as unknown as DuelState;
    if (!st.b) return reply.code(400).send({ ok:false, error:'no opponent' });

    const isA = st.current === 'A';
    const actor = isA ? st.a : st.b;
    const defender = isA ? st.b : st.a;
    if (actor?.id !== playerId) return reply.code(403).send({ ok:false, error:'not your turn' });

    // simple mechanics
    const roll = 5 + Math.floor(Math.random() * 11); // 5..15
    let dmg = roll;
    let note = 'attacks';
    if (action === 'defend') {
      // defending halves next incoming damage: represent as small heal/log flavor
      actor.hp = Math.min(actor.maxHp, actor.hp + 3);
      note = 'defends (+3 hp)';
      dmg = 0;
    }
    if (action === 'skill') {
      dmg = 8 + Math.floor(Math.random() * 11); // 8..18
      note = 'uses skill';
    }
    if (dmg > 0) defender.hp = Math.max(0, defender.hp - dmg);
    st.log.push(`${actor.name} ${note}${dmg>0?` for ${dmg}`:''}. ${defender.name} hp=${defender.hp}`);

    // check winner
    if (defender.hp <= 0) {
      st.winner = isA ? 'A' : 'B';
      duel.status = 'finished';
      st.log.push(`${actor.name} wins!`);
    } else {
      st.current = isA ? 'B' : 'A';
    }

    const upd = await prisma.duel.update({ where: { id }, data: { status: duel.status, state: st } });
    return { ok:true, data: upd };
  });
}

