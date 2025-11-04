export type ClassId = 'warrior' | 'volkhv' | 'hunter';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type ItemSlot = 'weapon' | 'armor' | 'amulet' | 'misc';

export interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  bonus?: Partial<Record<'str'|'agi'|'int'|'vit', number>>;
}

export interface Equipment {
  weapon?: Item | null;
  armor?: Item | null;
  amulet?: Item | null;
}

export interface Stats { str: number; agi: number; int: number; vit: number; }
export interface Progress { level: number; xp: number; xpToNext: number; }

export interface Player {
  name: string;
  classId: ClassId;
  gold: number;
  goldTotal?: number;
  energy: number;
  energyMax: number;
  sociality: number;
  karma: number;
  luck: number;
  lastEnergyTs: number; // unix ms of last energy regen/update
  stats: Stats;
  progress: Progress;
  inventory: Item[];
  equipment: Equipment;
}

export const STORAGE_KEY = 'mirevald:player';
const LEGACY_KEY = 'mirevald.player';

export const ENERGY_REGEN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const ENERGY_REGEN_AMOUNT = 1;
export const MAX_LEVEL = 100;

export function tickEnergy(p: Player, now: number = Date.now()): Player {
  const next = { ...p } as Player;
  if (next.energy >= next.energyMax) {
    next.lastEnergyTs = now;
    return next;
  }
  const last = next.lastEnergyTs ?? now;
  if (now <= last) return next;

  const elapsed = now - last;
  const ticks = Math.floor(elapsed / ENERGY_REGEN_INTERVAL_MS);
  if (ticks <= 0) return next;

  const gained = ticks * ENERGY_REGEN_AMOUNT;
  next.energy = Math.min(next.energyMax, next.energy + gained);
  const usedMs = ticks * ENERGY_REGEN_INTERVAL_MS;
  next.lastEnergyTs = last + usedMs;
  return next;
}

export function normalizePlayer(raw: any): Player {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid player');
  const level = raw.progress?.level ?? raw.level ?? 1;
  const xp    = raw.progress?.xp ?? 0;
  const baseStats: Stats = {
    str: raw.stats?.str ?? 5,
    agi: raw.stats?.agi ?? 5,
    int: raw.stats?.int ?? 5,
    vit: raw.stats?.vit ?? 5,
  };
  const p: Player = {
    name:    raw.name ?? 'Герой',
    classId: raw.classId ?? 'warrior',
    gold:    raw.gold ?? 0,
    goldTotal: raw.goldTotal ?? raw.goldEarnedTotal ?? 0,
    energy:  raw.energy ?? 8,
    energyMax: raw.energyMax ?? 10,
    sociality: raw.sociality ?? 0,
    karma: raw.karma ?? 0,
    luck: raw.luck ?? 0,
    lastEnergyTs: raw.lastEnergyTs ?? Date.now(),
    stats: baseStats,
    progress: {
      level: Math.min(level, MAX_LEVEL),
      xp,
      xpToNext: raw.progress?.xpToNext ?? (level >= MAX_LEVEL ? 0 : xpCurve(level)),
    },
    inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
    equipment: {
      weapon: raw.equipment?.weapon ?? null,
      armor:  raw.equipment?.armor  ?? null,
      amulet: raw.equipment?.amulet ?? null,
    },
  };
  return p;
}

export function loadPlayer(): Player | null {
  try {
    let s = localStorage.getItem(STORAGE_KEY);
    if (!s) s = localStorage.getItem(LEGACY_KEY) ?? undefined as any;
    if (!s) return null;
    const raw = JSON.parse(s);
    const normalized = normalizePlayer(raw);
    const withRegen = tickEnergy(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withRegen));
    return withRegen;
  } catch { return null; }
}

export function savePlayer(p: Player) {
  const safe = normalizePlayer(p);
  const withRegen = tickEnergy(safe);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withRegen));
}

export function baseStatsFor(classId: ClassId): Stats {
  if (classId === 'warrior') return { str: 8, agi: 4, int: 3, vit: 7 };
  if (classId === 'volkhv')  return { str: 3, agi: 4, int: 8, vit: 6 };
  return { str: 5, agi: 8, int: 3, vit: 5 }; // hunter
}

export function xpCurve(level: number): number {
  // Linear-ish curve tuned for ~30 days to cap
  return Math.max(10, Math.round(30 + 5 * level));
}

export function seedStarterItems(classId: ClassId): Item[] {
  if (classId === 'warrior') return [
    { id:'sword1', name:'Rusty Sword', slot:'weapon', rarity:'common', bonus:{ str:1 } },
    { id:'coat1',  name:'Worn Coat',   slot:'armor',  rarity:'common', bonus:{ vit:1 } },
    { id:'charm1', name:'Old Charm',   slot:'amulet', rarity:'uncommon', bonus:{ vit:1 } },
  ];
  if (classId === 'volkhv') return [
    { id:'staff1', name:'Wooden Staff', slot:'weapon', rarity:'common', bonus:{ int:1 } },
    { id:'robe1',  name:'Simple Robe',  slot:'armor',  rarity:'common', bonus:{ vit:1 } },
    { id:'rune1',  name:'Small Rune',   slot:'amulet', rarity:'uncommon', bonus:{ int:1 } },
  ];
  return [
    { id:'bow1',   name:'Old Bow',     slot:'weapon', rarity:'common', bonus:{ agi:1 } },
    { id:'vest1',  name:'Leather Vest',slot:'armor',  rarity:'common', bonus:{ vit:1 } },
    { id:'tooth1', name:'Wolf Tooth',  slot:'amulet', rarity:'uncommon', bonus:{ agi:1 } },
  ];
}

export function createPlayer(classId: ClassId, name = 'Герой'): Player {
  const stats = baseStatsFor(classId);
  return {
    name, classId, gold: 100, goldTotal: 0, energy: 8, energyMax: 10, sociality: 0, karma: 0, luck: 0,
    lastEnergyTs: Date.now(),
    stats,
    progress: { level: 1, xp: 0, xpToNext: xpCurve(1) },
    inventory: seedStarterItems(classId),
    equipment: {}
  };
}

export function addXp(p: Player, amount: number): Player {
  let { level, xp, xpToNext } = p.progress;
  xp += amount;
  while (xpToNext > 0 && xp >= xpToNext) {
    xp -= xpToNext;
    if (level >= MAX_LEVEL) {
      level = MAX_LEVEL;
      xp = 0;
      xpToNext = 0;
      break;
    }
    level += 1;
    if (level >= MAX_LEVEL) {
      xpToNext = 0;
      xp = 0;
    } else {
      xpToNext = xpCurve(level);
    }
    p.stats.vit += 1;
    if (p.classId === 'warrior') p.stats.str += 1;
    if (p.classId === 'volkhv')  p.stats.int += 1;
    if (p.classId === 'hunter')  p.stats.agi += 1;
  }
  return { ...p, progress: { level, xp, xpToNext } };
}

export function canLevelUp(p: Player): boolean {
  return p.progress.xpToNext > 0 && p.progress.xp >= p.progress.xpToNext;
}

export function levelUp(p: Player): Player {
  if (!canLevelUp(p)) return p;
  return addXp(p, 0);
}

export function addReward(p: Player, gold = 0, xp = 0): Player {
  const next = { ...p, gold: p.gold + gold, progress: { ...p.progress, xp: p.progress.xp + xp } } as Player;
  if (gold && gold > 0) (next as any).goldTotal = ((next as any).goldTotal ?? 0) + gold;
  return next;
}

export function effectiveStats(p: Player): Stats {
  const sum: Stats = { ...p.stats };
  const eq: Equipment = (p.equipment ?? {}) as Equipment;
  const apply = (it?: Item | null) => {
    if (!it || !it.bonus) return;
    if (it.bonus.str) sum.str += it.bonus.str;
    if (it.bonus.agi) sum.agi += it.bonus.agi;
    if (it.bonus.int) sum.int += it.bonus.int;
    if (it.bonus.vit) sum.vit += it.bonus.vit;
  };
  apply(eq.weapon ?? null);
  apply(eq.armor ?? null);
  apply(eq.amulet ?? null);
  return sum;
}
