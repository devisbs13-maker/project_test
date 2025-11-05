import { useEffect, useState } from 'react';
import Header from '../components/Header';
import type { Player } from '../store/player';
import { getWeeklyLeaderboard } from '../utils/api';

export default function Leaderboard({ player, onBack }: { player: Player; onBack: () => void }) {
  const [rows, setRows] = useState<Array<{ name: string; username?: string; score: number }>>([]);
  useEffect(() => { (async () => { try { const r = await getWeeklyLeaderboard(20); setRows(r as any); } catch {} })(); }, []);
  return (
    <div style={{padding:16, display:'grid', gap:12}}>
      <Header title="Таблица лидеров" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />
      <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', display:'grid', gap:6}}>
        {rows.length===0 && <div style={{opacity:.8}}>Пока пусто…</div>}
        {rows.map((r, i) => (
          <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)'}}>
            <div>
              <div style={{fontWeight:700}}>{i+1}. {r.name}{r.username?` @${r.username}`:''}</div>
              <div style={{opacity:.85, fontSize:12}}>Очки: {r.score}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

