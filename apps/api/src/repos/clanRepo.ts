import crypto from 'node:crypto';
import { readJson, writeJson, nowIso } from './fileStore.js';

export type Clan = { id: string; name: string; tag: string; bank: number; createdAt: string };
export type ClanRole = 'leader' | 'novice' | 'warden' | 'seer';
export type ClanMember = { userId: string; clanId: string; joinedAt: string; role: ClanRole };

type ClanDB = {
  clans: Clan[];
  members: ClanMember[];
};

const FILE = 'clans.json';

function load(): ClanDB {
  const db = readJson<ClanDB>(FILE, { clans: [], members: [] });
  // migrate: ensure role field
  db.members = (db.members || []).map((m: any) => ({ ...m, role: (m.role as ClanRole) || 'novice' }));
  return db;
}

function save(db: ClanDB) {
  writeJson(FILE, db);
}

export function createClan(input: { name: string; tag: string; ownerId?: string }): Clan {
  const db = load();
  const name = input.name.trim();
  const tag = input.tag.trim().toUpperCase();
  if (!name) throw new Error('Invalid name');
  if (!/^[A-Z]{2,5}$/.test(tag)) throw new Error('Invalid tag');
  if (db.clans.some(c => c.tag === tag)) throw new Error('Tag taken');
  const clan: Clan = { id: crypto.randomUUID(), name, tag, bank: 0, createdAt: nowIso() };
  db.clans.push(clan);
  if (input.ownerId) {
    db.members = db.members.filter(m => m.userId === input.ownerId ? false : true);
    db.members.push({ userId: input.ownerId, clanId: clan.id, joinedAt: nowIso(), role: 'leader' });
  }
  save(db);
  return clan;
}

export function getClanByTag(tag: string): Clan | null {
  const db = load();
  const t = tag.trim().toUpperCase();
  return db.clans.find(c => c.tag === t) ?? null;
}

export function addMember(input: { userId: string; tag: string }): Clan | null {
  const db = load();
  const t = input.tag.trim().toUpperCase();
  const clan = db.clans.find(c => c.tag === t);
  if (!clan) return null;
  db.members = db.members.filter(m => m.userId === input.userId ? false : true);
  db.members.push({ userId: input.userId, clanId: clan.id, joinedAt: nowIso(), role: 'novice' });
  save(db);
  return clan;
}

export function getClanByUser(userId: string): Clan | null {
  const db = load();
  const mem = db.members.find(m => m.userId === userId);
  if (!mem) return null;
  return db.clans.find(c => c.id === mem.clanId) ?? null;
}

export function contribute(input: { userId: string; amount: number }): { bank: number } | null {
  const db = load();
  const mem = db.members.find(m => m.userId === input.userId);
  if (!mem) return null;
  const clan = db.clans.find(c => c.id === mem.clanId);
  if (!clan) return null;
  clan.bank += input.amount;
  save(db);
  return { bank: clan.bank };
}

export function listMembers(clanId: string): ClanMember[] {
  const db = load();
  return db.members.filter(m => m.clanId === clanId);
}

export function setRole(input: { actorId: string; targetId: string; role: ClanRole }): { ok: boolean } {
  const db = load();
  const actor = db.members.find(m => m.userId === input.actorId);
  const target = db.members.find(m => m.userId === input.targetId);
  if (!actor || !target) return { ok: false };
  if (actor.clanId !== target.clanId) return { ok: false };
  if (actor.role !== 'leader') return { ok: false };
  if (input.role === 'leader' && target.userId !== actor.userId) {
    // transfer leadership: demote current leader to warden by default
    actor.role = 'warden';
  } else if (target.userId === actor.userId && input.role !== 'leader') {
    // leader cannot demote themselves to ensure one leader exists
    return { ok: false };
  }
  target.role = input.role;
  save(db);
  return { ok: true };
}

export function kick(input: { actorId: string; targetId: string }): { ok: boolean } {
  const db = load();
  const actor = db.members.find(m => m.userId === input.actorId);
  const target = db.members.find(m => m.userId === input.targetId);
  if (!actor || !target) return { ok: false };
  if (actor.clanId !== target.clanId) return { ok: false };
  if (actor.role !== 'leader') return { ok: false };
  // cannot kick self via this method
  if (target.userId === actor.userId) return { ok: false };
  db.members = db.members.filter(m => m.userId !== input.targetId);
  save(db);
  return { ok: true };
}

export function leave(input: { userId: string }): { ok: boolean } {
  const db = load();
  const me = db.members.find(m => m.userId === input.userId);
  if (!me) return { ok: false };
  const same = db.members.filter(m => m.clanId === me.clanId);
  const isLeader = me.role === 'leader';
  db.members = db.members.filter(m => m.userId !== input.userId);
  if (isLeader) {
    const next = same.find(m => m.userId !== input.userId);
    if (next) next.role = 'leader';
  }
  save(db);
  return { ok: true };
}
