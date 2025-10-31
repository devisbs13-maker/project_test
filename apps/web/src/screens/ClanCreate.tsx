import { useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { apiClanCreate } from '../utils/api';
import { loadSession } from '../store/session';
import { useNavigate } from 'react-router-dom';

type Props = { player: Player; onBack: () => void };

export default function ClanCreate({ player, onBack }: Props) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const s = loadSession();
  async function submit() {
    if (!s) return;
    const cleanTag = tag.toUpperCase().trim();
    if (!/^[A-Z]{2,5}$/.test(cleanTag)) { alert('Р СћР ВµР С–: 2РІР‚вЂњ5 Р В·Р В°Р С–Р В»Р В°Р Р†Р Р…РЎвЂ№РЎвЂ¦ AРІР‚вЂњZ'); return; }
    setBusy(true);
    try {
      const res = await apiClanCreate(s.userId, name.trim(), cleanTag);
      if (res?.error) alert(res.error); else { alert('Р С™Р В»Р В°Р Р… РЎРѓР С•Р В·Р Т‘Р В°Р Р…'); navigate('/clan'); }
    } finally { setBusy(false); }
  }
  return (
    <div style={{display:'grid', gap:12, padding:16}}>
      <Header title={RU.clans.title} gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />
      <div style={{display:'grid', gap:8}}>
        <label>Р СњР В°Р В·Р Р†Р В°Р Р…Р С‘Р Вµ</label>
        <input value={name} onChange={(e)=>setName((e.target as any).value)} placeholder="Р ВР СРЎРЏ Р С”Р В»Р В°Р Р…Р В°" style={{padding:'8px 10px', borderRadius:8}} />
        <label>Р СћР ВµР С– (2РІР‚вЂњ5 Р В·Р В°Р С–Р В»Р В°Р Р†Р Р…РЎвЂ№РЎвЂ¦ AРІР‚вЂњZ)</label>
        <input value={tag} onChange={(e)=>setTag((e.target as any).value)} placeholder="TAG" style={{padding:'8px 10px', borderRadius:8}} />
      </div>
      <div style={{display:'flex', gap:8}}>
        <Button disabled={!s || busy || !name || !tag} onClick={submit}>Р РЋР С•Р В·Р Т‘Р В°РЎвЂљРЎРЉ</Button>
      </div>
    </div>
  );
}

