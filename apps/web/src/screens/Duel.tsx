import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { apiDuelChallenge, apiDuelAccept, apiDuelGet, apiDuelAct } from '../utils/api';

type Props = { player: Player; onBack: () => void };

export default function Duel({ player, onBack }: Props) {
  const [duelId, setDuelId] = useState<string>('');
  const [inputId, setInputId] = useState<string>('');
  const [state, setState] = useState<any>(null);

  const myTurn = useMemo(() => {
    if (!state?.data?.state) return false;
    const st = state.data.state as any;
    const isA = st.current === 'A';
    const aId = st.a?.id; const bId = st.b?.id;
    return (isA ? aId : bId) === (player as any).id || (isA ? aId : bId) === undefined; // best-effort
  }, [state, player]);

  useEffect(() => {
    if (!duelId) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await apiDuelGet(duelId);
        if (!stop && res?.ok) setState(res);
      } catch {}
      if (!stop && state?.data?.status !== 'finished') setTimeout(tick, 1500);
    };
    tick();
    return () => { stop = true; };
  }, [duelId]);

  async function makeChallenge() {
    const res = await apiDuelChallenge();
    if (res?.ok && res.id) setDuelId(res.id);
  }
  async function accept() {
    if (!inputId) return;
    const res = await apiDuelAccept(inputId.trim());
    if (res?.ok && res.id) setDuelId(res.id);
  }
  async function act(kind: 'attack'|'defend'|'skill') {
    if (!duelId) return;
    const res = await apiDuelAct(duelId, kind);
    if (res?.ok) setState(res);
  }

  const st: any = state?.data?.state || null;
  return (
    <div style={{ display:'grid', gap:12, padding:16 }}>
      <Header title="PvP Duel" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      {!duelId && (
        <section style={{ padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', display:'grid', gap:8 }}>
          <div style={{display:'flex', gap:8}}>
            <Button onClick={makeChallenge}>Create Challenge</Button>
            <input value={inputId} onChange={e=>setInputId(e.target.value)} placeholder="Enter duel id" style={{flex:1, padding:'8px 10px', borderRadius:10, background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'inherit'}} />
            <Button onClick={accept} disabled={!inputId}>Accept</Button>
          </div>
        </section>
      )}

      {duelId && (
        <section style={{ padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', display:'grid', gap:10 }}>
          <div style={{opacity:.9}}>Duel ID: <code>{duelId}</code></div>
          <div style={{display:'flex', gap:12}}>
            <Fighter label="A" data={st?.a} active={st?.current==='A'} />
            <Fighter label="B" data={st?.b} active={st?.current==='B'} />
          </div>
          <div style={{display:'flex', gap:8}}>
            <Button onClick={()=>act('attack')} disabled={!myTurn || state?.data?.status==='finished'}>Attack</Button>
            <Button onClick={()=>act('defend')} disabled={!myTurn || state?.data?.status==='finished'}>Defend</Button>
            <Button onClick={()=>act('skill')} disabled={!myTurn || state?.data?.status==='finished'}>Skill</Button>
          </div>
          <div style={{padding:10, borderRadius:10, background:'rgba(255,255,255,0.04)'}}>
            <b>Log</b>
            <div style={{display:'grid', gap:4, marginTop:6}}>
              {(st?.log || []).slice().reverse().map((l:string, i:number)=>(<div key={i} style={{opacity:.9}}>{l}</div>))}
            </div>
          </div>
          {state?.data?.status==='finished' && <div style={{fontWeight:700}}>Finished</div>}
        </section>
      )}
    </div>
  );
}

function Fighter({ label, data, active }: { label: string; data?: any; active?: boolean }) {
  return (
    <div style={{flex:1, padding:10, borderRadius:12, border:'1px solid rgba(255,255,255,0.1)'}}>
      <div style={{display:'flex', justifyContent:'space-between'}}>
        <b>{label}: {data?.name || '-'}</b>
        {active && <span style={{opacity:.8}}>Your turn</span>}
      </div>
      <div style={{marginTop:6}}>HP: {data?.hp ?? 0}/{data?.maxHp ?? 0}</div>
    </div>
  );
}

