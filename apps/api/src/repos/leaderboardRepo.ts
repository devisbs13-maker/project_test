import { readJson, writeJson } from './fileStore.js';

export type LeaderboardRow = { userId: string; name: string; score: number };
type LeaderboardDB = { weekKey: string; rows: LeaderboardRow[] };

const FILE = 'leaderboard.json';

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const wk = String(weekNo).padStart(2, '0');
  return `${date.getUTCFullYear()}-${wk}`;
}

function load(): LeaderboardDB {
  const cur = readJson<LeaderboardDB>(FILE, { weekKey: isoWeekKey(), rows: [] });
  const wk = isoWeekKey();
  if (cur.weekKey !== wk) {
    const fresh: LeaderboardDB = { weekKey: wk, rows: [] };
    writeJson(FILE, fresh);
    return fresh;
  }
  return cur;
}

function save(db: LeaderboardDB) {
  writeJson(FILE, db);
}

export function addTick(userId: string, name: string, delta: number): number {
  const db = load();
  const rows = db.rows;
  let r = rows.find(x => x.userId === userId);
  if (!r) {
    r = { userId, name, score: 0 };
    rows.push(r);
  } else if (r.name !== name) {
    r.name = name;
  }
  r.score += delta;
  save(db);
  return r.score;
}

export function getWeeklyTop(limit = 20): LeaderboardRow[] {
  const db = load();
  return [...db.rows].sort((a,b) => b.score - a.score).slice(0, limit);
}

export function getWeekKey(): string { return load().weekKey; }

