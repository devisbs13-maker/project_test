import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { lbPlayers, lbScoresAll, lbScoresWeekly } from '../db/leaderboard.js';
import { eq, and, desc } from 'drizzle-orm';
import { verifyInitData } from '../telegram/verify.js';

function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const wk = String(weekNo).padStart(2, '0');
  return `${d.getUTCFullYear()}-${wk}`;
}

export async function leaderboardRoutes(app: FastifyInstance) {
  // CORS friendly preflight handled by global cors plugin

  app.post('/auth/verify', async (req, reply) => {
    const Body = z.object({ initData: z.string() });
    const { initData } = Body.parse(req.body ?? {});
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
    const { ok, user } = verifyInitData(initData, botToken);
    if (!ok || !user) return { ok: false };
    const id = String(user.id);
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `tg_${id}`;
    const username = user.username || null;
    const now = Date.now();
    // upsert lb_players
    try {
      db.insert(lbPlayers).values({ id, name, username, createdAt: now }).onConflictDoNothing().run();
    } catch {}
    return { ok: true, userId: id, name, username };
  });

  app.post('/score/submit', async (req) => {
    const Body = z.object({ userId: z.string(), value: z.number().int().min(0) });
    const { userId, value } = Body.parse(req.body ?? {});
    const now = Date.now();
    const wk = weekKey();
    // all-time
    const existingAll = db.select().from(lbScoresAll).where(eq(lbScoresAll.userId, userId)).all();
    if (existingAll.length === 0) {
      db.insert(lbScoresAll).values({ userId, score: value, updatedAt: now }).run();
    } else {
      db.update(lbScoresAll).set({ score: existingAll[0].score + value, updatedAt: now }).where(eq(lbScoresAll.userId, userId)).run();
    }
    // weekly
    const existingW = db.select().from(lbScoresWeekly).where(and(eq(lbScoresWeekly.userId, userId), eq(lbScoresWeekly.weekKey, wk))).all();
    if (existingW.length === 0) {
      db.insert(lbScoresWeekly).values({ userId, weekKey: wk, score: value, updatedAt: now }).run();
    } else {
      db.update(lbScoresWeekly).set({ score: existingW[0].score + value, updatedAt: now }).where(and(eq(lbScoresWeekly.userId, userId), eq(lbScoresWeekly.weekKey, wk))).run();
    }
    const total = (existingAll[0]?.score ?? 0) + value;
    const weekly = (existingW[0]?.score ?? 0) + value;
    return { ok: true, total, weekly };
  });

  app.get('/leaderboard/weekly', async (req) => {
    const limit = Number((req.query as any)?.limit ?? 20);
    const wk = weekKey();
    // naive join using JS since simpler without drizzle relations here
    const rows = db.select().from(lbScoresWeekly).all().filter(r => r.weekKey === wk).sort((a,b)=> b.score - a.score).slice(0, limit);
    const out = rows.map((r, i) => {
      const u = db.select().from(lbPlayers).where(eq(lbPlayers.id, r.userId)).all()[0];
      return { rank: i+1, userId: r.userId, name: u?.name ?? r.userId, username: u?.username ?? null, score: r.score };
    });
    return out;
  });

  app.get('/leaderboard/alltime', async (req) => {
    const limit = Number((req.query as any)?.limit ?? 20);
    const rows = db.select().from(lbScoresAll).all().sort((a,b)=> b.score - a.score).slice(0, limit);
    const out = rows.map((r, i) => {
      const u = db.select().from(lbPlayers).where(eq(lbPlayers.id, r.userId)).all()[0];
      return { rank: i+1, userId: r.userId, name: u?.name ?? r.userId, username: u?.username ?? null, score: r.score };
    });
    return out;
  });
}

