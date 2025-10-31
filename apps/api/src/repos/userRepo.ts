import { readJson, writeJson, nowIso } from './fileStore.js';

export type User = { id: string; name: string; gold: number; updatedAt: string };

type UserDB = { users: User[] };

const FILE = 'users.json';

function load(): UserDB {
  return readJson<UserDB>(FILE, { users: [] });
}

function save(db: UserDB) {
  writeJson(FILE, db);
}

export function getOrCreateUser(id: string, name: string): User {
  const db = load();
  let u = db.users.find(x => x.id === id);
  if (!u) {
    u = { id, name, gold: 100, updatedAt: nowIso() };
    db.users.push(u);
    save(db);
  } else if (u.name !== name) {
    u.name = name;
    u.updatedAt = nowIso();
    save(db);
  }
  return u;
}

export function trySpendGold(id: string, amount: number): { ok: boolean; gold?: number } {
  const db = load();
  const u = db.users.find(x => x.id === id);
  if (!u) return { ok: false };
  if (amount <= 0 || u.gold < amount) return { ok: false };
  u.gold -= amount;
  u.updatedAt = nowIso();
  save(db);
  return { ok: true, gold: u.gold };
}

