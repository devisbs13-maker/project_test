import type { FastifyInstance } from 'fastify';
import {
  createClan,
  getClanByTag,
  addMember,
  getClanByUser,
  contribute,
  getOrCreateUser,
  trySpendGold,
  listMembers,
  setRole,
  kick,
  leave,
} from '../repos/index.js';

function currentUser(req: any) {
  const id = String(req.tgUserId || req.headers['x-user-id'] || 'local-user');
  const name = String(req.tgUserName || req.headers['x-user-name'] || 'Adventurer');
  return { id, name };
}

export async function clanRoutesV1(app: FastifyInstance) {
  // Create clan
  app.post('/clan/create', async (req, reply) => {
    try {
      const { id: userId, name: userName } = currentUser(req);
      const body = (req.body as any) || {};
      const name = String(body.name || '').trim();
      const tag = String(body.tag || '').trim().toUpperCase();
      if (!/^[A-Z]{2,5}$/.test(tag)) return reply.code(400).send({ ok: false, error: 'Invalid tag' });
      if (!name) return reply.code(400).send({ ok: false, error: 'Invalid name' });
      await getOrCreateUser(userId, userName);
      if (await getClanByTag(tag)) return reply.code(409).send({ ok: false, error: 'Tag taken' });
      const clan = await createClan({ name, tag, ownerId: userId } as any);
      return { ok: true, data: { id: clan.id, name: clan.name, tag: clan.tag, bank: (clan as any).bank ?? 0 } };
    } catch (e: any) {
      return reply.code(400).send({ ok: false, error: e?.message || 'Bad request' });
    }
  });

  // Join clan by tag
  app.post('/clan/join', async (req, reply) => {
    try {
      const { id: userId, name: userName } = currentUser(req);
      const body = (req.body as any) || {};
      const tag = String(body.tag || '').trim().toUpperCase();
      if (!/^[A-Z]{2,5}$/.test(tag)) return reply.code(400).send({ ok: false, error: 'Invalid tag' });
      await getOrCreateUser(userId, userName);
      const clan = await addMember({ userId, tag });
      if (!clan) return reply.code(404).send({ ok: false, error: 'Clan not found' });
      return { ok: true, data: { id: clan.id, name: clan.name, tag: clan.tag, bank: (clan as any).bank ?? 0 } };
    } catch (e: any) {
      return reply.code(400).send({ ok: false, error: e?.message || 'Bad request' });
    }
  });

  // My clan
  app.get('/clan/me', async (req) => {
    const { id: userId, name: userName } = currentUser(req);
    const u = await getOrCreateUser(userId, userName);
    const clan = await getClanByUser(userId);
    return { ok: true, data: clan ? { id: clan.id, name: clan.name, tag: clan.tag, bank: (clan as any).bank ?? 0 } : null, user: { gold: (u as any).gold ?? 0 } };
  });

  // Members list
  app.get('/clan/members', async (req, reply) => {
    const { id: userId } = currentUser(req);
    const clan: any = await getClanByUser(userId);
    if (!clan) return reply.code(400).send({ ok: false, error: 'Not in clan' });
    const mem = (await listMembers(clan.id)).map((m: any) => ({ userId: m.userId, role: m.role, joinedAt: m.joinedAt }));
    return { ok: true, data: { clan: { id: clan.id, name: clan.name, tag: clan.tag, bank: clan.bank ?? 0 }, members: mem } };
  });

  // Set member role (leader only)
  app.post('/clan/role', async (req, reply) => {
    const { id: actorId } = currentUser(req);
    const body = (req.body as any) || {};
    const targetId = String(body.userId || '');
    const role = String(body.role || '');
    if (!targetId || !['leader','novice','warden','seer'].includes(role)) {
      return reply.code(400).send({ ok: false, error: 'Bad payload' });
    }
    const ok = await setRole({ actorId, targetId, role: role as any });
    return ok.ok ? { ok: true } : reply.code(403).send({ ok: false, error: 'Forbidden' });
  });

  // Kick member (leader) or leave (self)
  app.post('/clan/kick', async (req, reply) => {
    const { id: actorId } = currentUser(req);
    const body = (req.body as any) || {};
    const targetId = String(body.userId || '');
    if (!targetId) return reply.code(400).send({ ok: false, error: 'Bad payload' });
    const ok = await kick({ actorId, targetId });
    return ok.ok ? { ok: true } : reply.code(403).send({ ok: false, error: 'Forbidden' });
  });

  app.post('/clan/leave', async (req) => {
    const { id: userId } = currentUser(req);
    const ok = await leave({ userId });
    return ok.ok ? { ok: true } : { ok: false };
  });

  // Contribute gold to clan bank
  app.post('/clan/contribute', async (req, reply) => {
    const { id: userId, name: userName } = currentUser(req);
    const body = (req.body as any) || {};
    const amount = Number(body.amount || 0);
    if (!(amount > 0)) return reply.code(400).send({ ok: false, error: 'Amount must be > 0' });
    await getOrCreateUser(userId, userName);
    const clan = await getClanByUser(userId);
    if (!clan) return reply.code(400).send({ ok: false, error: 'Not in clan' });
    const spent = await trySpendGold(userId, amount);
    if (!spent.ok) return reply.code(400).send({ ok: false, error: 'Not enough gold' });
    const res: any = await contribute({ userId, amount });
    if (!res) return reply.code(400).send({ ok: false, error: 'Failed to contribute' });
    return { ok: true, data: { bank: res.bank ?? 0 } };
  });
}

