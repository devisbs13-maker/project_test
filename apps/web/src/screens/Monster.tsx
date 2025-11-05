import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import TimerBadge from '../components/TimerBadge';
import type { Player } from '../store/player';
import { effectiveStats, savePlayer } from '../store/player';
import { loadBattle, saveBattle, isBattleActive, type BattleState, MONSTERS, startBattleWith } from '../store/battle';
import { loadGame } from '../store/game';
import { remainingMs } from '../utils/time';
import { notifyAll, showToast } from '../utils/notify';
import { grantReward } from '../utils/progression';
import { CATALOG } from '../data/catalog';
import { getT } from '../i18n';

type Props = { player: Player; onBack: () => void; onUpdatePlayer: (p: Player) => void };

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function Monster({ player, onBack, onUpdatePlayer }: Props) {
  const T = getT();
  const [battle, setBattle] = useState<BattleState | null>(() => loadBattle());
  const active = isBattleActive(battle);
  const msLeft = battle ? remainingMs(battle.endsAt) : 0;
  const power = useMemo(() => {
    const st = effectiveStats(player);
    return st.str + st.agi + st.int + st.vit + player.progress.level * 2;
  }, [player]);

  useEffect(() => {
    const id = setInterval(() => setBattle(loadBattle()), 1000);
    return () => clearInterval(id);
  }, []);

  function fight(m: any) {
    if (active) return;
    try {
      const g = loadGame();
      if ((g.active || []).length > 0) {
        alert(T.monster?.finishOthers ?? 'Finish other activities first (quests/jobs).');
        return;
      }
    } catch {}
    const b = startBattleWith(player, m);
    setBattle(b);
  }

  function resolve() {
    if (!battle) return;
    if (remainingMs(battle.endsAt) > 0) return;
    const diff = battle.difficulty;
    const base = 0.5 + (power - diff) / 100;
    const chance = Math.max(0.05, Math.min(0.95, base));
    const win = Math.random() < chance;
    saveBattle(null);
    setBattle(null);
    if (win) {
      const level = player.progress.level;
      const margin = power - diff;
      const mult = Math.max(0.7, Math.min(1.5, 1 + margin / 120));
      const rMul = (battle as any).rewardMul ?? 1.0;
      const jitter = 0.9 + Math.random() * 0.2;
      const gold = Math.max(5, Math.round((30 + level * 6) * mult * rMul * jitter));
      const xp = Math.max(5, Math.round((18 + level * 3) * mult * rMul * jitter));

      let pNext = grantReward(player, { gold, xp });
      const luck = Math.max(0, Math.min(30, player.luck ?? 0));
      const dropChance = Math.max(0.08, Math.min(0.5, 0.18 + luck * 0.008 + Math.max(0, margin) * 0.003));
      if (Math.random() < dropChance) {
        const tiers = [
          { t: 1, lvl: 1 },
          { t: 2, lvl: 20 },
          { t: 3, lvl: 40 },
          { t: 4, lvl: 60 },
        ];
        const tier = [...tiers].reverse().find((x) => level >= x.lvl) ?? tiers[0];
        const cls = player.classId;
        const pool = CATALOG.filter((d) => (d as any).classReq === cls && /_t\d+$/.test(d.id) && d.id.endsWith(`t${tier.t}`));
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          const newItem = {
            id: pick.id,
            name: pick.name,
            slot: pick.slot as any,
            rarity: pick.rarity,
            requiredLevel: (pick as any).requiredLevel,
            classReq: (pick as any).classReq,
          } as any;
          pNext = { ...pNext, inventory: [...pNext.inventory, newItem] } as Player;
        }
      }
      notifyAll('quest', T.monster?.defeated ?? 'Monster defeated', { gold, xp });
      try { showToast(T.monster?.victory ?? 'Victory! Rewards granted.'); } catch {}
      savePlayer(pNext);
      onUpdatePlayer(pNext);
    } else {
      try { showToast(T.monster?.defeat ?? 'Defeat. Try a weaker monster.'); } catch {}
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12, padding: 16 }}>
      <Header title={T.buttons?.monster ?? 'Monster Hunt'} gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      {!active && (
        <section style={{ padding: 12, borderRadius: 16, background: 'var(--panel-bg)', border: 'var(--panel-border)' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              {[...MONSTERS].sort((a: any, b: any) => a.diffMul - b.diffMul).map((m) => {
                const level = player.progress.level;
                const difficulty = Math.round((40 + level * 8) * m.diffMul);
                const base = 0.5 + (power - difficulty) / 100;
                const chance = Math.max(0.05, Math.min(0.95, base));
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: 'var(--panel-bg)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {m.image ? (
                        <img src={m.image} alt={m.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.07)' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{m.name}</div>
                        <div style={{ opacity: 0.85, fontSize: 12 }}>
                          {(T.monster?.difficulty ?? 'Difficulty')}: {difficulty} • {(T.monster?.winChance ?? 'Win chance')}: {Math.round(chance * 100)}% • {(T.monster?.reward ?? 'Reward')} x{m.rewardMul}
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => fight(m)}>{T.monster?.fight ?? 'Fight'}</Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {active && battle && (
        <section style={{ padding: 12, borderRadius: 16, background: 'var(--panel-bg)', border: 'var(--panel-border)' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{battle.monster}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TimerBadge endsAt={battle.endsAt} />
              <span style={{ opacity: 0.85 }}>{fmt(msLeft)}</span>
            </div>
            <div style={{ opacity: 0.85, fontSize: 12 }}>{(T.monster?.power ?? 'Power')}: {power} • {(T.monster?.difficulty ?? 'Difficulty')}: {battle.difficulty}</div>
            <Button disabled={remainingMs(battle.endsAt) > 0} onClick={resolve}>{T.monster?.resolve ?? 'Resolve Battle'}</Button>
          </div>
        </section>
      )}
    </div>
  );
}

