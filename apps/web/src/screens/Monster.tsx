import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { effectiveStats, savePlayer } from '../store/player';
import { loadBattle, saveBattle, startBattle, isBattleActive, type BattleState, MONSTERS, startBattleWith } from '../store/battle';
import { loadGame } from '../store/game';
import { remainingMs } from '../utils/time';
import { notifyAll, showToast } from '../utils/notify';
import { grantReward } from '../utils/progression';
import { CATALOG } from '../data/catalog';

type Props = { player: Player; onBack: () => void; onUpdatePlayer: (p: Player) => void };

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60).toString().padStart(2,'0');
  const ss = (s % 60).toString().padStart(2,'0');
  return `${mm}:${ss}`;
}

export default function Monster({ player, onBack, onUpdatePlayer }: Props) {
  const [battle, setBattle] = useState<BattleState | null>(() => loadBattle());
  const active = isBattleActive(battle);
  const msLeft = battle ? remainingMs(battle.endsAt) : 0;
  const power = useMemo(() => {
    const st = effectiveStats(player);
    return st.str + st.agi + st.int + st.vit + player.progress.level * 2;
  }, [player]);

  useEffect(() => {
    const id = setInterval(() => {
      const b = loadBattle();
      setBattle(b);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function begin() {
    if (active) return;
    try { const g = loadGame(); if ((g.active||[]).length > 0) { alert('РЎРЅР°С‡Р°Р»Р° Р·Р°РІРµСЂС€РёС‚Рµ С‚РµРєСѓС‰РёРµ Р·Р°РґР°РЅРёСЏ/СЂР°Р±РѕС‚С‹.'); return; } } catch {}
    const pick = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    const b = startBattleWith(player, pick);
    setBattle(b);
  }

  function fight(m: any) {
    if (active) return;
    try { const g = loadGame(); if ((g.active||[]).length > 0) { alert('РЎРЅР°С‡Р°Р»Р° Р·Р°РІРµСЂС€РёС‚Рµ С‚РµРєСѓС‰РёРµ Р·Р°РґР°РЅРёСЏ/СЂР°Р±РѕС‚С‹.'); return; } } catch {}
    const b = startBattleWith(player, m);
    setBattle(b);
  }

  function resolve() {
    if (!battle) return;
    if (remainingMs(battle.endsAt) > 0) return;
    // Chance based on power vs difficulty
    const diff = battle.difficulty;
    const base = 0.5 + (power - diff) / 100; // +/-1 power ~ +/-1%
    const chance = Math.max(0.05, Math.min(0.95, base));
    const roll = Math.random();
    const win = roll < chance;
    saveBattle(null);
    setBattle(null);
    if (win) {
      // Rewards: gold, xp, and random clothing drop
      const level = player.progress.level;
      const margin = power - diff;
      const mult = Math.max(0.7, Math.min(1.5, 1 + (margin / 120))); // -120..+120 -> ~0.0..+1.0
      const rMul = (battle as any).rewardMul ?? 1.0;
      const jitter = 0.9 + Math.random() * 0.2;
      const gold = Math.max(5, Math.round((30 + level * 6) * mult * rMul * jitter));
      const xp = Math.max(5, Math.round((18 + level * 3) * mult * rMul * jitter));

      // Apply gold/xp
      const p1 = grantReward(player, { gold, xp });

      // Clothing drop chance based on luck and margin
      const luck = Math.max(0, Math.min(30, player.luck ?? 0));
      const dropChance = Math.max(0.08, Math.min(0.5, 0.18 + luck * 0.008 + Math.max(0, margin) * 0.003));
      let pFinal = p1;
      if (Math.random() < dropChance) {
        // pick tier by level: 1/20/40/60
        const tiers = [ { t:1, lvl:1 }, { t:2, lvl:20 }, { t:3, lvl:40 }, { t:4, lvl:60 } ];
        const tier = [...tiers].reverse().find(x => level >= x.lvl) ?? tiers[0];
        const cls = player.classId;
        const pool = CATALOG.filter(d => (d as any).classReq === cls && /_t\d+$/.test(d.id) && d.id.endsWith(`t${tier.t}`));
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          const newItem = { id: pick.id, name: pick.name, slot: pick.slot as any, rarity: pick.rarity, requiredLevel: (pick as any).requiredLevel, classReq: (pick as any).classReq } as any;
          const inv = [...p1.inventory, newItem];
          pFinal = { ...p1, inventory: inv } as Player;
        }
      }

      notifyAll('quest', 'РџРѕР±РµРґР° РЅР°Рґ РјРѕРЅСЃС‚СЂРѕРј', { gold, xp });
      try { showToast('РџРѕР±РµРґР° РЅР°Рґ РјРѕРЅСЃС‚СЂРѕРј! РќР°РіСЂР°РґР° РїРѕР»СѓС‡РµРЅР°.'); } catch {}
      savePlayer(pFinal);
      onUpdatePlayer(pFinal);
    } else {
      try { showToast('РџРѕСЂР°Р¶РµРЅРёРµ. РњРѕРЅСЃС‚СЂ РѕРєР°Р·Р°Р»СЃСЏ СЃРёР»СЊРЅРµРµ.'); } catch {}
    }
  }

  return (
    <div style={{display:'grid', gap:12, padding:16}}>
      <Header title="Р‘РѕР№ СЃ РјРѕРЅСЃС‚СЂРѕРј" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      {!active && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            <div>Р’С‹ РјРѕР¶РµС‚Рµ РѕС‚РїСЂР°РІРёС‚СЊСЃСЏ РЅР° Р±РѕР№ СЃ РјРѕРЅСЃС‚СЂРѕРј. Р‘РѕР№ РґР»РёС‚СЃСЏ 30 РјРёРЅСѓС‚. РџРѕРєР° Р±РѕР№ РёРґРµС‚, РЅРµР»СЊР·СЏ РІС‹РїРѕР»РЅСЏС‚СЊ Р·Р°РґР°РЅРёСЏ Рё СЂР°Р±РѕС‚Р°С‚СЊ.</div>
            <div style={{opacity:.85, fontSize:12}}>РўРµРєСѓС‰Р°СЏ РјРѕС‰СЊ: {power}</div>
            <div style={{display:'grid', gap:8, marginTop:8}}>
              {[...MONSTERS].sort((a:any,b:any)=>a.diffMul-b.diffMul).map((m) => {
                const level = player.progress.level;
                const difficulty = Math.round((40 + level * 8) * m.diffMul);
                const base = 0.5 + (power - difficulty) / 100;
                const chance = Math.max(0.05, Math.min(0.95, base));
                return (
                  <div key={m.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      {m.image ? <img src={m.image} alt={m.name} style={{width:40,height:40,objectFit:'cover',borderRadius:8}} /> : <div style={{width:40,height:40,borderRadius:8,background:'rgba(255,255,255,0.07)'}} />} 
                      <div>
                        <div style={{fontWeight:700}}>{m.name}</div>
                        <div style={{opacity:.85, fontSize:12}}>Сложность: {difficulty} • Шанс победы: {Math.round(chance*100)}% • Награда x{m.rewardMul}</div>
                      </div>
                    </div>
                    <Button onClick={() => fight(m)}>Сразиться</Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {active && battle && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            <div style={{fontWeight:700}}>{battle.monster}</div>
            <div style={{opacity:.85}}>РРґРµС‚ Р±РѕР№вЂ¦ РћСЃС‚Р°Р»РѕСЃСЊ: {fmt(msLeft)}</div>
            <div style={{opacity:.85, fontSize:12}}>РњРѕС‰СЊ: {power} вЂў РЎР»РѕР¶РЅРѕСЃС‚СЊ: {battle.difficulty}</div>
            <Button disabled={remainingMs(battle.endsAt) > 0} onClick={resolve}>Р—Р°РІРµСЂС€РёС‚СЊ Р±РѕР№</Button>
          </div>
        </section>
      )}
    </div>
  );
}
