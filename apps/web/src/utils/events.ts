import { loadEvents, saveEvents, eventCatalog, type EventsState, type VillageEvent, type EventChoice } from '../store/events';
import type { Player } from '../store/player';
import { savePlayer, addXp } from '../store/player';
import { notifyAll } from './notify';
import { loadSession } from '../store/session';
import { postScoreTick } from './api';
import { showToast } from './notify';
import { incrementDaily, syncAchievementsWithPlayer } from './progression';

// returns [canRoll, msLeft]
export function canRollEvent(st: EventsState): [boolean, number] {
  if (!st.lastRollAt) return [true, 0];
  const msLeft = st.cooldownMs - (Date.now() - st.lastRollAt);
  return [msLeft <= 0, Math.max(0, msLeft)];
}

export function rollRandomEvent(st: EventsState): EventsState {
  const pool = eventCatalog();
  const ev = pool[Math.floor(Math.random() * pool.length)];
  const next = { ...st, active: ev, lastRollAt: Date.now() };
  saveEvents(next);
  return next;
}

export function applyChoice(p: Player, st: EventsState, ev: VillageEvent, ch: EventChoice): { player: Player; state: EventsState } {
  let next = { ...p } as Player;
  const imp = ch.impact || {};
  if (imp.gold)   { next.gold = Math.max(0, (next.gold ?? 0) + imp.gold); if (imp.gold > 0) (next as any).goldTotal = ((next as any).goldTotal ?? 0) + imp.gold; }
  if (imp.energy) next.energy = Math.min(next.energyMax, Math.max(0, (next.energy ?? 0) + imp.energy));
  if (imp.xp)     next = addXp(next, imp.xp);
  if (imp.sociality) next.sociality = Math.max(0, (next.sociality ?? 0) + imp.sociality);
  if (imp.karma)     next.karma = (next.karma ?? 0) + imp.karma;
  if (imp.luck)      next.luck = Math.max(0, (next.luck ?? 0) + imp.luck);

  savePlayer(next);
  try { syncAchievementsWithPlayer(next); } catch {}

  const historyEntry = { id: ev.id, ts: Date.now(), choiceId: ch.id };
  const nextState: EventsState = { ...st, active: null, history: [...st.history, historyEntry] };
  saveEvents(nextState);

  // toast + (if in Telegram) sendData
  notifyAll('quest', `Событие: ${ev.title}`, { gold: imp.gold, xp: imp.xp, energy: imp.energy });
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.sendData) {
    tg.sendData(JSON.stringify({ type: 'event_choice', title: ev.title, choice: ch.label, impact: imp }));
  }

  incrementDaily('dq_events');
  const s = loadSession();
  if (s && (imp.xp ?? 0) > 0) { postScoreTick(imp.xp as number, 'event').then(()=> showToast(`+${imp.xp} очков в недельный рейтинг`)).catch(()=>{}); }
  return { player: next, state: nextState };
}
