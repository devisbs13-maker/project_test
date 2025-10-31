import crypto from 'node:crypto';
import { prisma } from '../prisma/client.js';

export async function upsertUser(id: string, name: string) {
  const u = await prisma.user.upsert({
    where: { id },
    update: { name },
    create: { id, name, gold: 100, energy: 100 },
  });
  return u;
}

export async function trySpendGold(id: string, amount: number): Promise<{ ok: boolean; gold?: number }> {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u || amount <= 0 || u.gold < amount) return { ok: false };
  const updated = await prisma.user.update({ where: { id }, data: { gold: u.gold - amount } });
  return { ok: true, gold: updated.gold };
}

export async function createClan(input: { name: string; tag: string; ownerId?: string }) {
  const name = input.name.trim();
  const tag = input.tag.trim().toUpperCase();
  if (!name) throw new Error('Invalid name');
  if (!/^[A-Z]{2,5}$/.test(tag)) throw new Error('Invalid tag');
  const existsTag = await prisma.clan.findUnique({ where: { tag } });
  if (existsTag) throw new Error('Tag taken');
  const clan = await prisma.clan.create({ data: { id: crypto.randomUUID(), name, tag, bank: 0 } });
  if (input.ownerId) {
    await prisma.clanMember.deleteMany({ where: { userId: input.ownerId } });
    await prisma.clanMember.create({ data: { userId: input.ownerId, clanId: clan.id } });
  }
  return clan;
}

export async function getClanByTag(tag: string) {
  const t = tag.trim().toUpperCase();
  return prisma.clan.findUnique({ where: { tag: t } });
}

export async function addMember(input: { userId: string; tag: string }) {
  const clan = await getClanByTag(input.tag);
  if (!clan) return null;
  await prisma.clanMember.deleteMany({ where: { userId: input.userId } });
  await prisma.clanMember.create({ data: { userId: input.userId, clanId: clan.id } });
  return clan;
}

export async function getClanByUser(userId: string) {
  const cm = await prisma.clanMember.findFirst({ where: { userId } });
  if (!cm) return null;
  return prisma.clan.findUnique({ where: { id: cm.clanId } });
}

export async function contribute(input: { userId: string; amount: number }) {
  const cm = await prisma.clanMember.findFirst({ where: { userId: input.userId } });
  if (!cm) return null;
  const updated = await prisma.clan.update({ where: { id: cm.clanId }, data: { bank: { increment: input.amount } } });
  return { bank: updated.bank };
}

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const wk = String(weekNo).padStart(2, '0');
  return `${date.getUTCFullYear()}-${wk}`;
}

export async function addTick(userId: string, name: string, delta: number): Promise<number> {
  await upsertUser(userId, name);
  const weekKey = isoWeekKey();
  const id = `${weekKey}:${userId}`;
  const row = await prisma.weeklyScore.upsert({
    where: { id },
    update: { score: { increment: delta } },
    create: { id, userId, score: delta, weekKey },
  });
  return row.score;
}

export async function getWeeklyTop(limit = 20) {
  const weekKey = isoWeekKey();
  const rows = await prisma.weeklyScore.findMany({ where: { weekKey }, orderBy: { score: 'desc' }, take: limit });
  // Join with users for name
  const users = await prisma.user.findMany({ where: { id: { in: rows.map(r => r.userId) } } });
  const byId = new Map(users.map(u => [u.id, u]));
  return rows.map(r => ({ userId: r.userId, name: byId.get(r.userId)?.name || r.userId, score: r.score }));
}

