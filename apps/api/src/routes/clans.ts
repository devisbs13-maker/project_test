import type { FastifyInstance } from 'fastify';
import { db, sqlite } from '../db/client.js';
import { clans, clanMembers, clanScoresWeekly, clanQuests, clanQuestsState } from '../db/schema.js';
import { and, desc, eq, like } from 'drizzle-orm';
import crypto from 'node:crypto';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const wk = String(weekNo).padStart(2, '0');
  return `${date.getUTCFullYear()}-${wk}`;
}

async function getUserClan(userId: string) {
  const rows = db.select().from(clanMembers).where(eq(clanMembers.userId, userId)).all();
  if (rows.length === 0) return null;
  const cm = rows[0];
  const c = db.select().from(clans).where(eq(clans.id, cm.clanId)).all()[0];
  return { clan: c, member: cm };
}

export async function clanRoutes(app: FastifyInstance) {
  // Ensure schema exists (idempotent) in case migrator metadata is missing
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS clans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      tag TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      owner_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clan_members (
      clan_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      PRIMARY KEY (clan_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS clan_scores_weekly (
      clan_id TEXT NOT NULL,
      week_key TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (clan_id, week_key)
    );
    CREATE TABLE IF NOT EXISTS clan_quests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target INTEGER NOT NULL,
      period TEXT NOT NULL,
      reward_gold INTEGER NOT NULL DEFAULT 0,
      reward_xp INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS clan_quests_state (
      clan_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      period_key TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (clan_id, quest_id, period_key)
    );
  `);
  // Seed basic clan quests if missing
  const haveDaily = db.select().from(clanQuests).where(eq(clanQuests.id, 'cq_daily_help')).all();
  if (haveDaily.length === 0) {
    db.insert(clanQuests).values({ id: 'cq_daily_help', title: 'Помогите жителям (суммарно 50 очков сегодня)', target: 50, period: 'daily', rewardGold: 60, rewardXp: 30 }).run();
  }
  const haveWeekly = db.select().from(clanQuests).where(eq(clanQuests.id, 'cq_weekly_hunt')).all();
  if (haveWeekly.length === 0) {
    db.insert(clanQuests).values({ id: 'cq_weekly_hunt', title: 'Охота на чудищ (суммарно 500 очков за неделю)', target: 500, period: 'weekly', rewardGold: 400, rewardXp: 200 }).run();
  }
  // POST /clan/create
  app.post('/clan/create', async (req, reply) => {
    const body = (req.body as any) || {};
    const userId = String(body.userId || req.playerId || 'unknown');
    const name = String(body.name || '').trim();
    const tag = String(body.tag || '').trim().toUpperCase();
    if (!name || !/^[A-Za-z0-9 _-]{3,24}$/.test(name)) return reply.code(400).send({ error: 'Invalid name' });
    if (!/^[A-Z]{2,5}$/.test(tag)) return reply.code(400).send({ error: 'Invalid tag' });
    const existsName = db.select().from(clans).where(eq(clans.name, name)).all();
    if (existsName.length) return reply.code(409).send({ error: 'Name taken' });
    const existsTag = db.select().from(clans).where(eq(clans.tag, tag)).all();
    if (existsTag.length) return reply.code(409).send({ error: 'Tag taken' });
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    db.insert(clans).values({ id, name, tag, createdAt, ownerId: userId }).run();
    // ensure unique membership: remove previous
    db.delete(clanMembers).where(eq(clanMembers.userId, userId)).run();
    db.insert(clanMembers).values({ clanId: id, userId, role: 'owner' }).run();
    return { id, name, tag };
  });

  // POST /clan/join
  app.post('/clan/join', async (req, reply) => {
    const body = (req.body as any) || {};
    const userId = String(body.userId || req.playerId || 'unknown');
    const clanId = String(body.clanId || '');
    const target = db.select().from(clans).where(eq(clans.id, clanId)).all();
    if (target.length === 0) return reply.code(404).send({ error: 'Clan not found' });
    db.delete(clanMembers).where(eq(clanMembers.userId, userId)).run();
    db.insert(clanMembers).values({ clanId, userId, role: 'member' }).run();
    return { ok: true };
  });

  // POST /clan/leave
  app.post('/clan/leave', async (req) => {
    const body = (req.body as any) || {};
    const userId = String(body.userId || req.playerId || 'unknown');
    const rows = db.select().from(clanMembers).where(eq(clanMembers.userId, userId)).all();
    if (rows.length === 0) return { ok: true };
    const cm = rows[0];
    db.delete(clanMembers).where(and(eq(clanMembers.userId, userId), eq(clanMembers.clanId, cm.clanId))).run();
    // if owner and no members left -> delete clan
    const cl = db.select().from(clans).where(eq(clans.id, cm.clanId)).all()[0];
    const membersLeft = db.select().from(clanMembers).where(eq(clanMembers.clanId, cm.clanId)).all();
    if (cl && cl.ownerId === userId && membersLeft.length === 0) {
      db.delete(clans).where(eq(clans.id, cm.clanId)).run();
      db.delete(clanScoresWeekly).where(eq(clanScoresWeekly.clanId, cm.clanId)).run();
      db.delete(clanQuestsState).where(eq(clanQuestsState.clanId, cm.clanId)).run();
    }
    return { ok: true };
  });

  // GET /clan/my
  app.get('/clan/my', async (req, reply) => {
    const userId = String((req.query as any).userId || req.playerId || 'unknown');
    const ctx = await getUserClan(userId);
    if (!ctx) return reply.send({ clan: null });
    const { clan, member } = ctx as any;
    const members = db.select().from(clanMembers).where(eq(clanMembers.clanId, clan.id)).all();
    // active quests states
    const dailyQ = db.select().from(clanQuests).where(eq(clanQuests.period, 'daily')).all()[0] || null;
    const weeklyQ = db.select().from(clanQuests).where(eq(clanQuests.period, 'weekly')).all()[0] || null;
    const dayKey = todayKey();
    const weekKey = isoWeekKey();
    const qs: any[] = [];
    if (dailyQ) {
      const st = db.select().from(clanQuestsState).where(and(eq(clanQuestsState.clanId, clan.id), eq(clanQuestsState.questId, dailyQ.id), eq(clanQuestsState.periodKey, dayKey))).all()[0] || { clanId: clan.id, questId: dailyQ.id, periodKey: dayKey, progress: 0, completed: 0 };
      qs.push({ quest: dailyQ, state: st });
    }
    if (weeklyQ) {
      const st = db.select().from(clanQuestsState).where(and(eq(clanQuestsState.clanId, clan.id), eq(clanQuestsState.questId, weeklyQ.id), eq(clanQuestsState.periodKey, weekKey))).all()[0] || { clanId: clan.id, questId: weeklyQ.id, periodKey: weekKey, progress: 0, completed: 0 };
      qs.push({ quest: weeklyQ, state: st });
    }
    const weekly = db.select().from(clanScoresWeekly).where(and(eq(clanScoresWeekly.clanId, clan.id), eq(clanScoresWeekly.weekKey, weekKey))).all()[0] || { clanId: clan.id, weekKey, score: 0 };
    return { clan, members, myRole: member.role, quests: qs, weeklyScore: weekly.score };
  });

  // GET /clan/search?q=...
  app.get('/clan/search', async (req) => {
    const q = String((req.query as any).q || '').trim();
    const rows = q
      ? db.select().from(clans).where(and(like(clans.name, `%${q}%`))).all()
      : db.select().from(clans).all();
    return rows.slice(0, 20);
  });

  // POST /clan/contribute { userId, amount, source }
  app.post('/clan/contribute', async (req, reply) => {
    const body = (req.body as any) || {};
    const userId = String(body.userId || req.playerId || 'unknown');
    const amount = Math.max(0, Number(body.amount || 0));
    const source = String(body.source || 'generic');
    const ctx = await getUserClan(userId);
    if (!ctx) return reply.code(400).send({ error: 'Not in clan' });
    const { clan } = ctx as any;
    const dayKey = todayKey();
    const weekKey = isoWeekKey();
    // pick first active quest: prefer daily if exists and not complete; otherwise weekly
    const dailyQ = db.select().from(clanQuests).where(eq(clanQuests.period, 'daily')).all()[0] || null;
    const weeklyQ = db.select().from(clanQuests).where(eq(clanQuests.period, 'weekly')).all()[0] || null;
    let targetQ: any = null;
    let pk = '';
    if (dailyQ) {
      const st = db.select().from(clanQuestsState).where(and(eq(clanQuestsState.clanId, clan.id), eq(clanQuestsState.questId, dailyQ.id), eq(clanQuestsState.periodKey, dayKey))).all()[0] || { progress: 0, completed: 0 };
      if (!st.completed) { targetQ = dailyQ; pk = dayKey; }
    }
    if (!targetQ && weeklyQ) { targetQ = weeklyQ; pk = weekKey; }
    if (!targetQ) return { ok: true, applied: 0 };
    // upsert quest state
    const cur = db.select().from(clanQuestsState).where(and(eq(clanQuestsState.clanId, clan.id), eq(clanQuestsState.questId, targetQ.id), eq(clanQuestsState.periodKey, pk))).all()[0];
    const nextProg = (cur?.progress ?? 0) + amount;
    const completed = nextProg >= targetQ.target ? 1 : (cur?.completed ?? 0);
    if (cur) {
      db.update(clanQuestsState).set({ progress: nextProg, completed }).where(and(eq(clanQuestsState.clanId, clan.id), eq(clanQuestsState.questId, targetQ.id), eq(clanQuestsState.periodKey, pk))).run();
    } else {
      db.insert(clanQuestsState).values({ clanId: clan.id, questId: targetQ.id, periodKey: pk, progress: nextProg, completed }).run();
    }
    // weekly score
    const curScore = db.select().from(clanScoresWeekly).where(and(eq(clanScoresWeekly.clanId, clan.id), eq(clanScoresWeekly.weekKey, weekKey))).all()[0];
    const nextScore = (curScore?.score ?? 0) + amount;
    if (curScore) {
      db.update(clanScoresWeekly).set({ score: nextScore }).where(and(eq(clanScoresWeekly.clanId, clan.id), eq(clanScoresWeekly.weekKey, weekKey))).run();
    } else {
      db.insert(clanScoresWeekly).values({ clanId: clan.id, weekKey, score: nextScore }).run();
    }
    return { ok: true, questId: targetQ.id, periodKey: pk, progress: nextProg, completed, weeklyScore: nextScore };
  });

  // GET /clan/top/weekly
  app.get('/clan/top/weekly', async (req) => {
    const limit = Math.max(1, Math.min(100, Number((req.query as any).limit ?? 20)));
    const wk = isoWeekKey();
    // naive join in JS
    const scores = db.select().from(clanScoresWeekly).where(eq(clanScoresWeekly.weekKey, wk)).all();
    const allClans = db.select().from(clans).all();
    const byId = new Map(allClans.map((c) => [c.id, c] as const));
    const rows = scores
      .map((s) => ({ score: s.score, clan: byId.get(s.clanId) }))
      .filter((r) => r.clan)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({ name: (r.clan as any).name, tag: (r.clan as any).tag, score: r.score }));
    return rows;
  });
}
