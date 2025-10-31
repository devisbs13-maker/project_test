import * as jsonClan from './clanRepo.js';
import * as jsonUser from './userRepo.js';
import * as jsonLb from './leaderboardRepo.js';
import { ensureSchema, prisma } from '../prisma/client.js';
import * as prismaRepo from './prismaBackend.js';

function wantJson(): boolean {
  const backend = (process.env.PRISMA_BACKEND || '').toLowerCase();
  if (backend === 'json') return true;
  if (backend === 'prisma') return false;
  return process.env.NODE_ENV === 'development';
}

export async function initStorage() {
  if (!wantJson()) {
    try { await ensureSchema(); } catch {}
  }
}

// Unified exports
export const createClan = async (args: { name: string; tag: string; ownerId?: string }) => wantJson() ? jsonClan.createClan(args) : prismaRepo.createClan(args);
export const getClanByTag = async (tag: string) => wantJson() ? jsonClan.getClanByTag(tag) : prismaRepo.getClanByTag(tag);
export const addMember = async (args: { userId: string; tag: string }) => wantJson() ? jsonClan.addMember(args) : prismaRepo.addMember(args);
export const getClanByUser = async (userId: string) => wantJson() ? jsonClan.getClanByUser(userId) : prismaRepo.getClanByUser(userId);
export const contribute = async (args: { userId: string; amount: number }) => wantJson() ? jsonClan.contribute(args) : prismaRepo.contribute(args);
export const listMembers = async (clanId: string) => jsonClan.listMembers(clanId);
export const setRole = async (args: { actorId: string; targetId: string; role: jsonClan.ClanRole }) => jsonClan.setRole(args);
export const kick = async (args: { actorId: string; targetId: string }) => jsonClan.kick(args);
export const leave = async (args: { userId: string }) => jsonClan.leave(args);

export const getOrCreateUser = async (id: string, name: string) => wantJson() ? jsonUser.getOrCreateUser(id, name) : prismaRepo.upsertUser(id, name);
export const trySpendGold = async (id: string, amount: number) => wantJson() ? jsonUser.trySpendGold(id, amount) : prismaRepo.trySpendGold(id, amount);

export const addTick = async (userId: string, name: string, delta: number) => wantJson() ? jsonLb.addTick(userId, name, delta) : prismaRepo.addTick(userId, name, delta);
export const getWeeklyTop = async (limit = 20) => wantJson() ? jsonLb.getWeeklyTop(limit) : prismaRepo.getWeeklyTop(limit);
