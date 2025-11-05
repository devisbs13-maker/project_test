import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { apiFactionList, apiFactionMe, apiFactionJoin, apiFactionLeave } from '../utils/api';

type Props = { player: Player; onBack: () => void };

export default function Factions({ player, onBack }: Props) {
  const [list, setList] = useState<Array<{id:string; name:string; members:number}>>([]);
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try { const l = await apiFactionList(); if (l?.ok && l.items) setList(l.items); } catch {}
      try { const m = await apiFactionMe(); if (m?.ok) setMine((m.factionId ?? null) as any); } catch {}
    })();
  }, []);

  async function join(id: string) {
    const res = await apiFactionJoin(id);
    if (res?.ok && res.factionId) setMine(res.factionId);
  }
  async function leave() {
    const res = await apiFactionLeave();
    if (res?.ok) setMine(null);
  }

  return (
    <div style={{ display:'grid', gap:12, padding:16 }}>
      <Header title="Factions" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      <section style={{ padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', display:'grid', gap:10 }}>
        <div style={{opacity:.9}}>Your faction: <b>{mine ? (list.find(x=>x.id===mine)?.name || mine) : 'None'}</b></div>
        {mine && <Button onClick={leave}>Leave faction</Button>}
      </section>

      <section style={{ display:'grid', gap:8 }}>
        {list.map(f => (
          <div key={f.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
            <div>
              <div style={{fontWeight:700}}>{f.name}</div>
              <div style={{opacity:.85, fontSize:12}}>Members: {f.members}</div>
            </div>
            <Button onClick={() => join(f.id)} disabled={mine===f.id}> {mine===f.id ? 'Joined' : 'Join'} </Button>
          </div>
        ))}
      </section>
    </div>
  );
}

