import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  PlayerSchema,
  JobSchema,
  QuestSchema,
  BattleResultSchema,
  ArenaOpponentSchema,
  PlayerJobSchema,
  CharacterClass,
  Location,
} from '@repo/shared';
import { simulateBattle, toBattleClass } from '../domain/BattleSimulator.js';
import { ensurePlayer, parseInitData, verifySignature } from '../middlewares/verifyInitData.js';

export async function apiRoutes(app: FastifyInstance) {
  // POST /auth/verify — verify Telegram initData and upsert player; returns basic session info
  app.post('/auth/verify', async (req, reply) => {
    try {
      const body = (req.body ?? {}) as any;
      const initDataRaw = String(body.initData || body.init_data || '');
      const bypass = String(process.env.TELEGRAM_AUTH_BYPASS || '').toLowerCase() === 'true';
      const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';

      if (!initDataRaw && !bypass) {
        return reply.code(400).send({ ok: false, error: 'Missing initData' });
      }

      let userPayload: any = undefined;
      if (initDataRaw) {
        const parsed = parseInitData(initDataRaw);
        if (!bypass) {
          if (!botToken) return reply.code(500).send({ ok: false, error: 'Server config' });
          if (!verifySignature(parsed, botToken)) {
            return reply.code(401).send({ ok: false, error: 'Invalid signature' });
          }
        }
        try { userPayload = parsed.user ? JSON.parse(parsed.user) : undefined; } catch {}
      }

      if (!userPayload && bypass) {
        userPayload = { id: 'local-user', username: 'local' };
      }

      if (!userPayload?.id) return reply.code(401).send({ ok: false, error: 'No user' });

      const userId = await ensurePlayer(userPayload);
      const username = userPayload?.username || null;
      const name = [userPayload?.first_name, userPayload?.last_name].filter(Boolean).join(' ') || username || `tg_${userId}`;
      return { ok: true, userId, name, username };
    } catch (e) {
      app.log.error({ err: e }, 'auth.verify failed');
      return reply.code(500).send({ ok: false, error: 'failed' });
    }
  });
  // POST /auth/telegram — relies on middleware to set req.playerId
  app.post('/auth/telegram', async (req) => {
    const player = PlayerSchema.parse({
      id: req.playerId ?? 'unknown',
      name: 'Adventurer',
      level: 1,
      class: CharacterClass.Warrior,
      location: Location.Town,
      gold: 0,
      activeJobs: [],
      quests: [],
    });
    return { player };
  });

  // GET /me
  app.get('/me', async (req) => {
    const me = PlayerSchema.parse({
      id: req.playerId ?? 'unknown',
      name: 'Adventurer',
      level: 1,
      class: CharacterClass.Warrior,
      location: Location.Town,
      gold: 0,
      activeJobs: [],
      quests: [],
    });
    return me;
  });

  // GET /jobs
  app.get('/jobs', async () => {
    const jobs = [
      { id: 'j1', name: 'Gather Herbs', rewardGold: 10, durationMinutes: 15, requiredLevel: 1 },
      { id: 'j2', name: 'Guard Duty', rewardGold: 25, durationMinutes: 30, requiredLevel: 2 },
    ].map((j) => JobSchema.parse(j));
    return jobs;
  });

  // POST /jobs/start
  app.post('/jobs/start', async (req) => {
    const Body = z.object({ jobId: z.string() });
    const { jobId } = Body.parse(req.body ?? {});
    const pj = PlayerJobSchema.parse({
      playerId: req.playerId ?? 'unknown',
      jobId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    });
    return pj;
  });

  // POST /jobs/claim
  app.post('/jobs/claim', async (req) => {
    const Body = z.union([
      z.object({ jobId: z.string() }),
      z.object({ playerJobId: z.string() }).transform((v) => ({ jobId: v.playerJobId })),
    ]);
    const { jobId } = Body.parse(req.body ?? {});
    const pj = PlayerJobSchema.parse({
      playerId: req.playerId ?? 'unknown',
      jobId,
      status: 'completed',
      startedAt: new Date(Date.now() - 600000).toISOString(),
      completedAt: new Date().toISOString(),
    });
    return pj;
  });

  // GET /quests
  app.get('/quests', async () => {
    const quests = [
      { id: 'q1', title: 'First Steps', description: 'Meet the elder', rewardGold: 5 },
      { id: 'q2', title: 'Into the Woods', description: 'Explore the forest', rewardGold: 10 },
    ].map((q) => QuestSchema.parse(q));
    return quests;
  });

  // POST /battle/resolve
  app.post('/battle/resolve', async (req) => {
    const Body = z.object({ opponentId: z.string() });
    const { opponentId } = Body.parse(req.body ?? {});
    const playerId = req.playerId ?? 'unknown';
    const player = {
      id: playerId,
      name: 'Игрок',
      level: 3,
      power: 22,
      defense: 0.2,
      class: 'warrior' as const,
    };
    const opponent = {
      id: opponentId,
      name: 'Соперник',
      level: 3,
      power: 20,
      defense: 0.15,
      class: 'hunter' as const,
    };
    const sim = simulateBattle(player, opponent);
    const minimal = BattleResultSchema.parse({
      winnerPlayerId: sim.winner === 'player' ? playerId : opponentId,
      loserPlayerId: sim.winner === 'player' ? opponentId : playerId,
      turns: sim.turns,
      damageDealtByWinner: Math.round(sim.winner === 'player' ? sim.player.dmgDealt : sim.opponent.dmgDealt),
      lootGold: sim.rewards.gold,
      endedAt: new Date().toISOString(),
    });
    return { ...minimal, log: sim.log, dmgTaken: { player: Math.round(sim.player.dmgTaken), opponent: Math.round(sim.opponent.dmgTaken) }, rewards: sim.rewards };
  });

  // GET /arena/opponents
  app.get('/arena/opponents', async () => {
    const opponents = [
      { id: 'o1', name: 'Goblin', level: 2, class: CharacterClass.Rogue, powerScore: 15 },
      { id: 'o2', name: 'Skeleton Mage', level: 3, class: CharacterClass.Mage, powerScore: 22 },
    ].map((o) => ArenaOpponentSchema.parse(o));
    return opponents;
  });

  // POST /arena/fight
  app.post('/arena/fight', async (req) => {
    const Body = z.object({ opponentId: z.string() });
    const { opponentId } = Body.parse(req.body ?? {});
    const playerId = req.playerId ?? 'unknown';
    const player = {
      id: playerId,
      name: 'Игрок',
      level: 5,
      power: 26,
      defense: 0.25,
      class: 'warrior' as const,
    };
    // Derive opponent class by id heuristic
    const cls = toBattleClass(opponentId);
    const opponent = {
      id: opponentId,
      name: 'Боец арены',
      level: 5,
      power: 24,
      defense: 0.18,
      class: cls,
    };
    const sim = simulateBattle(player, opponent);
    const minimal = BattleResultSchema.parse({
      winnerPlayerId: sim.winner === 'player' ? playerId : opponentId,
      loserPlayerId: sim.winner === 'player' ? opponentId : playerId,
      turns: sim.turns,
      damageDealtByWinner: Math.round(sim.winner === 'player' ? sim.player.dmgDealt : sim.opponent.dmgDealt),
      lootGold: sim.rewards.gold,
      endedAt: new Date().toISOString(),
    });
    return { ...minimal, log: sim.log, dmgTaken: { player: Math.round(sim.player.dmgTaken), opponent: Math.round(sim.opponent.dmgTaken) }, rewards: sim.rewards };
  });

  // GET /leaderboard
  app.get('/leaderboard', async () => {
    const leaderboard = [
      { id: 'p1', name: 'Alice', level: 7, class: CharacterClass.Cleric, location: Location.Town, gold: 200 },
      { id: 'p2', name: 'Bob', level: 5, class: CharacterClass.Ranger, location: Location.Arena, gold: 150 },
    ].map((p) => PlayerSchema.parse({ ...p }));
    return leaderboard;
  });

  // Payments: invoice -> confirm (stubs)
  app.post('/payments/invoice', async (req) => {
    const Body = z.object({ sku: z.string() });
    const { sku } = Body.parse(req.body ?? {});
    // Fake invoice payload compatible with WebApp.openInvoice(slug)
    const slug = `TEST_${sku.toUpperCase()}`;
    return { slug, title: `Покупка ${sku}`, amount: 99, currency: 'XTR' };
  });

  app.post('/payments/confirm', async (req) => {
    const Body = z.object({ sku: z.string(), status: z.string().optional() });
    const { sku } = Body.parse(req.body ?? {});
    // Mark purchase — stub only. Return updated player profile stub.
    const updated = PlayerSchema.parse({
      id: req.playerId ?? 'unknown',
      name: 'Adventurer',
      level: 1,
      class: CharacterClass.Warrior,
      location: Location.Town,
      gold: 0,
      activeJobs: [],
      quests: [],
    });
    return { ok: true, sku, player: updated };
  });
}
