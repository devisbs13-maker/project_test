import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('sqlite:')) {
    const p = url.slice('sqlite:'.length);
    return path.resolve(process.cwd(), p);
  }
  return path.resolve(process.cwd(), 'dev.sqlite');
}

const dbPath = resolveDbPath();

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);
