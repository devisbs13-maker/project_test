import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getWeeklyLeaderboard } from '../utils/api';
import type { Player } from '../store/player';

type Props = { player: Player; onBack: () => void };

type Row = { userId: string; name: string; score: number };

export default function Leaderboard({ player, onBack }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { getWeeklyLeaderboard(20).then(setRows).catch(()=>setRows([])); }, []);

  return (
    <div style={{display:'grid', gap:12, padding:16}}>
      <Header title="Р РµР№С‚РёРЅРі" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />
      <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
        <div style={{display:'grid', gap:6}}>
          {rows.length===0 && <div style={{opacity:.8}}>РџРѕРєР° РїСѓСЃС‚Рѕ.</div>}
          {rows.map((r, i) => (
            <div key={r.userId+':'+i} style={{display:'flex', justifyContent:'space-between', padding:'8px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)'}}>
              <div><b>{i+1}.</b> {r.name}</div>
              <div>в­ђ {r.score}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

