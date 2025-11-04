import { now, secs } from '../utils/time';
import type { Player } from './player';

export type MonsterDef = {
  id: string;
  name: string;
  diffMul: number;   // multiplier to base difficulty
  rewardMul: number; // reward multiplier
};

export const MONSTERS: MonsterDef[] = [
  { id:'m1',  name:'Дикий кабан',           diffMul: 0.6, rewardMul: 0.7 },
  { id:'m2',  name:'Гоблин-разбойник',      diffMul: 0.75, rewardMul: 0.85 },
  { id:'m3',  name:'Волк-альфа',            diffMul: 0.9, rewardMul: 1.0 },
  { id:'m4',  name:'Отшельник-маг',         diffMul: 1.0, rewardMul: 1.1 },
  { id:'m5',  name:'Гнолл-воин',            diffMul: 1.1, rewardMul: 1.25 },
  { id:'m6',  name:'Тролль-бродяга',        diffMul: 1.2, rewardMul: 1.35 },
  { id:'m7',  name:'Огр-громила',           diffMul: 1.35, rewardMul: 1.5 },
  { id:'m8',  name:'Дух леса',              diffMul: 1.5, rewardMul: 1.65 },
  { id:'m9',  name:'Дракончик',             diffMul: 1.65, rewardMul: 1.8 },
  { id:'m10', name:'Древний ужас',          diffMul: 1.8, rewardMul: 2.0 },
];

export type BattleState = {
  active: boolean;
  startedAt: number;
  endsAt: number;
  seed: number;
  monster: string;
  monsterId?: string;
  difficulty: number; // abstract power target
  rewardMul?: number;
};

const KEY = 'mirevald:battle';

export function loadBattle(): BattleState | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as BattleState) : null;
  } catch { return null; }
}

export function saveBattle(b: BattleState | null) {
  if (!b) { try { localStorage.removeItem(KEY); } catch {} ; return; }
  localStorage.setItem(KEY, JSON.stringify(b));
}

export function isBattleActive(b: BattleState | null): boolean {
  if (!b || !b.active) return false;
  return b.endsAt > now();
}

function baseDifficulty(level: number): number {
  return 40 + level * 8;
}

export function startBattle(p: Player): BattleState {
  const start = now();
  const duration = secs(30 * 60); // 30 minutes
  const seed = Math.floor(Math.random() * 1e9);
  const level = p.progress?.level ?? 1;
  const difficulty = baseDifficulty(level); // simple scaling target
  const state: BattleState = {
    active: true,
    startedAt: start,
    endsAt: start + duration,
    seed,
    monster: 'Дикий монстр',
    difficulty,
  };
  saveBattle(state);
  return state;
}

export function startBattleWith(p: Player, def: MonsterDef): BattleState {
  const start = now();
  const duration = secs(30 * 60); // 30 minutes
  const seed = Math.floor(Math.random() * 1e9);
  const level = p.progress?.level ?? 1;
  const difficulty = Math.round(baseDifficulty(level) * def.diffMul);
  const state: BattleState = {
    active: true,
    startedAt: start,
    endsAt: start + duration,
    seed,
    monster: def.name,
    monsterId: def.id,
    difficulty,
    rewardMul: def.rewardMul,
  };
  saveBattle(state);
  return state;
}
