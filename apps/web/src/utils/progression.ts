import { saveProgression, loadProgression, initProgression, type ProgressionState, type Reward, todayKey, generateDailies, streakReward } from '../store/progression';
import { savePlayer, addXp } from '../store/player';
import type { Player } from '../store/player';
import { notifyAll } from './notify';
import { loadSession } from '../store/session';
import { apiClanContribute } from './api';

function getState(): ProgressionState {
  const s = loadProgression();
  return s ?? initProgression();
}

export function ensureProgressionRotated(): ProgressionState {
  const st = getState();
  const tk = todayKey();
  if (st.dateKey !== tk) {
    st.dateKey = tk;
    st.dailies = generateDailies();
    saveProgression(st);
  }
  return st;
}

export function updateStreakOnLogin(): ProgressionState {
  const st = ensureProgressionRotated();
  const tk = todayKey();
  const last = st.streak.lastLoginDate;
  if (last === tk) return st;
  const prev = last ? new Date(last) : null;
  const y = new Date(tk);
  const yesterday = new Date(y);
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0,10);
  if (last === yKey) {
    st.streak.count += 1;
  } else {
    st.streak.count = Math.max(1, st.streak.count || 0);
  }
  st.streak.lastLoginDate = tk;
  st.streak.claimAvailable = true;
  saveProgression(st);
  return st;
}

export function incrementDaily(id: string) {
  const st = ensureProgressionRotated();
  const d = st.dailies.find(x => x.id === id);
  if (!d) return;
  if (d.claimed) return;
  d.progress = Math.min(d.target, d.progress + 1);
  saveProgression(st);
}

export function syncAchievementsWithPlayer(p: Player) {
  const st = getState();
  const map: Record<string, number> = {
    a_lvl5: p.progress.level,
    a_social: (p as any).sociality ?? 0,
    a_karma: (p as any).karma ?? 0,
    a_luck: (p as any).luck ?? 0,
    a_gold1k: (p as any).goldTotal ?? (p.gold ?? 0),
  };
  for (const a of st.achievements) {
    if (map[a.id] != null) a.progress = Math.max(a.progress, map[a.id]!);
  }
  saveProgression(st);
}

export function grantReward(p: Player, r: Reward): Player {
  let next = { ...p } as any as Player & { goldTotal?: number };
  if (r.gold) {
    next.gold += r.gold;
    next.goldTotal = (next as any).goldTotal ? (next as any).goldTotal + r.gold : r.gold;
  }
  if (r.xp) { let xp = r.xp; try { const raw = localStorage.getItem('mirevald:clan'); if (raw) xp = Math.round(xp * 1.1); } catch {} next = addXp(next, xp); }
  if (r.energy) next.energy = Math.min(next.energyMax, next.energy + r.energy);
  savePlayer(next);
  return next;
}

export function claimGeneric(kind: 'daily'|'achv'|'streak', title: string, reward: Reward, player: Player, setPlayer: (p:Player)=>void) {
  const next = grantReward(player, reward);
  setPlayer(next);
  notifyAll('quest', `${kind === 'daily' ? 'Р”РµР№Р»РёРє' : kind === 'achv' ? 'Р”РѕСЃС‚РёР¶РµРЅРёРµ' : 'РЎС‚СЂРёРє'}: ${title}`, reward);
  const tg = (window as any).Telegram?.WebApp;
  tg?.sendData?.(JSON.stringify({ type:'progress_claim', kind, title, reward }));
  // clan contribution by XP (fallback 1)
  try {
    const s = loadSession();
    const amount = reward?.xp ?? 1;
    if (s && amount > 0) apiClanContribute(s.userId, amount, `progress_${kind}`).catch(()=>{});
  } catch {}
}

export function claimDaily(id: string, player: Player, setPlayer: (p:Player)=>void) {
  const st = getState();
  const d = st.dailies.find(x => x.id === id);
  if (!d || d.claimed || d.progress < d.target) return;
  d.claimed = true;
  saveProgression(st);
  claimGeneric('daily', d.title, d.reward, player, setPlayer);
}

export function claimAchievement(id: string, player: Player, setPlayer: (p:Player)=>void) {
  const st = getState();
  const a = st.achievements.find(x => x.id === id);
  if (!a || a.claimed || a.progress < a.target) return;
  a.claimed = true;
  saveProgression(st);
  claimGeneric('achv', a.title, a.reward, player, setPlayer);
}

export function claimStreak(player: Player, setPlayer: (p:Player)=>void) {
  const st = getState();
  if (!st.streak.claimAvailable) return;
  const r = streakReward(st.streak.count || 1);
  st.streak.claimAvailable = false;
  saveProgression(st);
  claimGeneric('streak', `Р”РµРЅСЊ ${st.streak.count}`, r, player, setPlayer);
}

