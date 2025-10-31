import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function ensureSchema() {
  // Create tables if they don't exist (idempotent) for dev convenience
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gold INTEGER NOT NULL DEFAULT 0,
      energy INTEGER NOT NULL DEFAULT 100
    );
    CREATE TABLE IF NOT EXISTS WeeklyScore (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      weekKey TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS WeeklyScore_weekKey_score_idx ON WeeklyScore (weekKey, score);
    CREATE TABLE IF NOT EXISTS Clan (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tag TEXT NOT NULL UNIQUE,
      bank INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS ClanMember (
      userId TEXT NOT NULL,
      clanId TEXT NOT NULL,
      PRIMARY KEY (userId, clanId)
    );
  `);
}

