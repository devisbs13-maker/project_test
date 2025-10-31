import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { ensureProgressionRotated, updateStreakOnLogin, syncAchievementsWithPlayer, claimDaily, claimAchievement, claimStreak } from '../utils/progression';

type Props = { player: Player; onBack: () => void; onUpdatePlayer: (p: Player) => void };

export default function Progress({ player, onBack, onUpdatePlayer }: Props) {
  const [tab, setTab] = useState<'dailies'|'achv'|'streak'>('dailies');
  const [state, setState] = useState(() => ensureProgressionRotated());

  useEffect(() => {
    const s = updateStreakOnLogin();
    syncAchievementsWithPlayer(player);
    setState(s);
  }, [player]);

  const dailies = state.dailies;
  const achv = state.achievements;
  const streak = state.streak;

  return (
    <div style={{display:'grid', gap:12, padding:16}}>
      <Header title="РџСЂРѕРіСЂРµСЃСЃ" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      <div style={{display:'flex', gap:8}}>
        <Button onClick={()=>setTab('dailies')} disabled={tab==='dailies'}>Р”РµР№Р»РёРєРё</Button>
        <Button onClick={()=>setTab('achv')} disabled={tab==='achv'}>Р”РѕСЃС‚РёР¶РµРЅРёСЏ</Button>
        <Button onClick={()=>setTab('streak')} disabled={tab==='streak'}>РЎС‚СЂРёРє</Button>
      </div>

      {tab==='dailies' && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            {dailies.map(d => {
              const ready = d.progress >= d.target;
              return (
                <div key={d.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>
                    <div style={{fontWeight:700}}>{d.title}</div>
                    <div style={{opacity:.85, fontSize:12}}>РџСЂРѕРіСЂРµСЃСЃ: {d.progress}/{d.target} вЂў РќР°РіСЂР°РґР°: рџЄ™{d.reward.gold ?? 0} вЂў вњЁ{d.reward.xp ?? 0}{d.reward.energy ? ` вЂў вљЎ${d.reward.energy}` : ''}</div>
                  </div>
                  <Button disabled={!ready || d.claimed} onClick={()=>{ claimDaily(d.id, player, onUpdatePlayer); setState(ensureProgressionRotated()); }}>{d.claimed? 'Р—Р°Р±СЂР°РЅРѕ' : ready ? 'Р—Р°Р±СЂР°С‚СЊ' : 'Р’С‹РїРѕР»РЅРёС‚СЊ'}</Button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {tab==='achv' && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            {achv.map(a => {
              const ready = a.progress >= a.target;
              return (
                <div key={a.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>
                    <div style={{fontWeight:700}}>{a.title}</div>
                    <div style={{opacity:.85, fontSize:12}}>РџСЂРѕРіСЂРµСЃСЃ: {a.progress}/{a.target} вЂў РќР°РіСЂР°РґР°: рџЄ™{a.reward.gold ?? 0} вЂў вњЁ{a.reward.xp ?? 0}{a.reward.energy ? ` вЂў вљЎ${a.reward.energy}` : ''}</div>
                  </div>
                  <Button disabled={!ready || a.claimed} onClick={()=>{ claimAchievement(a.id, player, onUpdatePlayer); setState(ensureProgressionRotated()); }}>{a.claimed? 'Р—Р°Р±СЂР°РЅРѕ' : ready ? 'Р—Р°Р±СЂР°С‚СЊ' : 'Р’ РїСѓС‚Рё'}</Button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {tab==='streak' && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            <div>РўРµРєСѓС‰РёР№ СЃС‚СЂРёРє: <b>{streak.count}</b></div>
            <div>РЎС‚Р°С‚СѓСЃ: {streak.claimAvailable ? 'РќР°РіСЂР°РґР° РґРѕСЃС‚СѓРїРЅР°' : 'РЎРµРіРѕРґРЅСЏ СѓР¶Рµ РїРѕР»СѓС‡РµРЅРѕ'}</div>
            <div style={{display:'flex', gap:8}}>
              <Button disabled={!streak.claimAvailable} onClick={()=>{ claimStreak(player, onUpdatePlayer); setState(ensureProgressionRotated()); }}>Р—Р°Р±СЂР°С‚СЊ Р·Р° СЃРµРіРѕРґРЅСЏ</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}