import { now, secs } from '../utils/time';
import type { Player } from './player';

export type BattleState = {
  active: boolean;
  startedAt: number;
  endsAt: number;
  seed: number;
  monster: string;
  difficulty: number; // abstract power target
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

export function startBattle(p: Player): BattleState {
  const start = now();
  const duration = secs(30 * 60); // 30 minutes
  const seed = Math.floor(Math.random() * 1e9);
  const level = p.progress?.level ?? 1;
  const difficulty = 40 + level * 8; // simple scaling target
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

