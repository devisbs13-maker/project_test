import Header from '../components/Header';
import Button from '../components/Button';
import TimerBadge from '../components/TimerBadge';
import { useEffect, useMemo, useState } from 'react';
import { notifyAll } from '../utils/notify';
import { loadGame, saveGame, type TaskDef, type GameState, type ActiveTask, type RewardEntry } from '../store/game';
import { now, secs, remainingMs } from '../utils/time';
import type { Player } from '../store/player';
import { savePlayer } from '../store/player';
import { grantReward } from '../utils/progression';

type Props = { player: Player; onBack: () => void; onUpdatePlayer: (p: Player) => void };

export default function Jobs({ player, onBack, onUpdatePlayer }: Props) {
  const [state, setState] = useState<GameState>(() => loadGame());
  const defsById = useMemo(() => new Map(state.tasks.map(t => [t.id, t])), [state.tasks]);
  const active = useMemo(() => state.active.filter(a => a.kind === 'job'), [state.active]);
  const available = useMemo(() => state.tasks.filter(t => t.kind === 'job'), [state.tasks, player.progress.level]);

  useEffect(() => {
    const id = setInterval(() => {
      const finished = state.active.filter(a => remainingMs(a.endsAt) <= 0);
      if (finished.length === 0) return;
      const still = state.active.filter(a => remainingMs(a.endsAt) > 0);
      const vault: RewardEntry[] = [...state.vault];
      for (const a of finished) {
        const def = defsById.get(a.id);
        if (!def) continue;
        vault.push({ id: def.id, kind: 'job', title: def.title, reward: def.reward, completedAt: now() });
        notifyAll('job', def.title, def.reward);
      }
      const next = { ...state, active: still, vault } as GameState;
      setState(next); saveGame(next);
    }, 1000);
    return () => clearInterval(id);
  }, [state, defsById]);

  function countActive(kind: 'quest'|'job') {
    return state.active.filter(a => a.kind === kind).length;
  }

  function start(def: TaskDef) {
    const energy = def.costEnergy ?? 0;
    if (energy > 0 && player.energy < energy) { alert('Недостаточно энергии'); return; }
    if (countActive('job') >= state.limits.job) { alert(`Достигнут лимит активных работ: ${state.limits.job}`); return; }
    const a: ActiveTask = { id: def.id, kind: 'job', startedAt: now(), endsAt: now() + secs(def.durationSec) };
    const next = { ...state, active: [...state.active, a] } as GameState;
    setState(next); saveGame(next);
    if (energy > 0) { const p = { ...player, energy: Math.max(0, player.energy - energy) }; savePlayer(p); onUpdatePlayer(p); }
  }

  function cancel(a: ActiveTask) {
    const still = state.active.filter(x => !(x.kind==='job' && x.id===a.id && x.startedAt===a.startedAt));
    const next = { ...state, active: still } as GameState;
    setState(next); saveGame(next);
  }

  function claim(e: RewardEntry) {
    const rest = state.vault.filter(v => v !== e);
    const next = { ...state, vault: rest } as GameState;
    setState(next); saveGame(next);
    const p2 = grantReward(player, e.reward); onUpdatePlayer(p2);
  }

  function claimAll() {
    let p = player;
    for (const v of state.vault) p = grantReward(p, v.reward);
    onUpdatePlayer(p);
    const next = { ...state, vault: [] } as GameState; setState(next); saveGame(next);
  }

  return (
    <div style={{padding:16, display:'grid', gap:12}}>
      <Header title="Работа" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
        <b>Активные задачи</b>
        <div style={{display:'grid', gap:8, marginTop:8}}>
          {active.length === 0 && <div style={{opacity:.8}}>Пока ничего не выполняется.</div>}
          {active.map(a => {
            const def = defsById.get(a.id);
            if (!def) return null;
            return (
              <div key={a.startedAt + a.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                <div>
                  <div style={{fontWeight:700}}>{def.title}</div>
                  <div style={{opacity:.85, fontSize:12}}>Выплата: 🪙 {def.reward.gold ?? 0} • XP {def.reward.xp ?? 0}</div>
                </div>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <TimerBadge endsAt={a.endsAt} />
                  <Button onClick={() => cancel(a)} disabled={remainingMs(a.endsAt) < 2000}>Отменить</Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
        <b>Доступные задачи</b>
        <div style={{display:'grid', gap:8, marginTop:8}}>
          {available.map(def => {
            const running = !!active.find(a => a.id === def.id);
            const cant = (def.costEnergy ?? 0) > player.energy || running || (player.progress.level < ((def as any).requiredLevel ?? 1));
            return (
              <div key={def.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                <div>
                  <div style={{fontWeight:700}}>{def.title}</div>
                  <div style={{opacity:.85, fontSize:12}}>{def.desc}</div>
                  {player.progress.level < ((def as any).requiredLevel ?? 1) && (
                    <div style={{opacity:.85, fontSize:12, marginTop:4, color:'#e7a'}}>
                      Требуется ур. {((def as any).requiredLevel ?? 1)}
                    </div>
                  )}
                  <div style={{opacity:.85, fontSize:12, marginTop:4}}>Длительность: {def.durationSec/60} мин • Цена: ⚡ {def.costEnergy ?? 0} • Выплата: 🪙 {def.reward.gold ?? 0} • XP {def.reward.xp ?? 0}</div>
                </div>
                <Button disabled={cant} onClick={() => start(def)}>{running ? 'Выполняется' : 'Начать'}</Button>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
        <b>Склад наград</b>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <Button onClick={claimAll} disabled={state.vault.length === 0}>Забрать всё</Button>
        </div>
        <div style={{display:'grid', gap:8, marginTop:10}}>
          {state.vault.length === 0 && <div style={{opacity:.8}}>Пусто.</div>}
          {state.vault.map(v => (
            <div key={v.completedAt + v.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
              <div>
                <div style={{fontWeight:700}}>{v.title}</div>
                <div style={{opacity:.85, fontSize:12}}>Награда: 🪙 {v.reward.gold ?? 0} • XP {v.reward.xp ?? 0}{v.reward.energy ? ` • энергия +${v.reward.energy}` : ''}</div>
              </div>
              <Button onClick={() => claim(v)}>Забрать</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
