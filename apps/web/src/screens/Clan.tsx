import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { apiClanMe, apiClanCreate, apiClanJoin, apiClanContribute, apiClanMembers, apiClanSetRole, apiClanKick, apiClanLeave } from '../utils/api';
import { showToast } from '../utils/notify';
import { loadSession } from '../store/session';

type Props = { player: Player; onBack: () => void };

type ClanInfo = { id: string; name: string; tag: string; bank: number };
type Member = { userId: string; role: 'leader'|'novice'|'warden'|'seer'; joinedAt: string; name?: string };

const ROLE_LABEL: Record<Member['role'], string> = {
  leader: 'Лидер',
  novice: 'Новичок',
  warden: 'Страж',
  seer:   'Ясновидец',
};

export default function Clan({ player, onBack }: Props) {
  const [me, setMe] = useState<ClanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [joinTag, setJoinTag] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  const session = loadSession();
  const myId = session?.userId || 'local-user';

  async function refresh() {
    setLoading(true); setErr(null);
    try {
      const res = await apiClanMe();
      if (res.ok) {
        setMe(res.data);
        if (res.data) {
          const m = await apiClanMembers();
          if (m.ok) setMembers(m.data.members || []);
        } else setMembers([]);
      } else setErr(res.error);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{display:'grid', gap:12, padding:16}}>
      <Header title={'Клан'} gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      {!me && (
        <section style={{display:'grid', gap:12, padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{fontWeight:700}}>Создать клан</div>
          <div style={{display:'grid', gap:8}}>
            <input placeholder="Название" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="TAG (A-Z, 2-5)" value={tag} onChange={e=>setTag(e.target.value.toUpperCase())} />
            <Button disabled={loading || player.progress.level < 5} onClick={async()=>{
              setErr(null); setLoading(true);
              try {
                const res = await apiClanCreate(name, tag);
                if (res.ok) { setMe(res.data); showToast('Клан создан'); refresh(); }
                else { setErr(res.error || 'Ошибка'); alert(res.error || 'Не удалось создать клан'); }
              } finally { setLoading(false); }
            }}>{player.progress.level < 5 ? 'Требуется 5 уровень' : 'Создать'}</Button>
          </div>

          <div style={{marginTop:8, fontWeight:700}}>Вступить в клан</div>
          <div style={{display:'grid', gap:8}}>
            <input placeholder="TAG" value={joinTag} onChange={e=>setJoinTag(e.target.value.toUpperCase())} />
            <Button disabled={loading} onClick={async()=>{
              setErr(null); setLoading(true);
              try {
                const res = await apiClanJoin(joinTag);
                if (res.ok) { setMe(res.data); showToast('Вы вступили в клан'); refresh(); }
                else { setErr(res.error || 'Ошибка'); alert(res.error || 'Не удалось вступить'); }
              } finally { setLoading(false); }
            }}>Вступить</Button>
          </div>

          {err && <div style={{color:'#e77'}}>{err}</div>}
        </section>
      )}

      {me && (
        <section style={{display:'grid', gap:12, padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{fontWeight:700}}>{me.name} [{me.tag}]</div>
          <div>Банк: {me.bank}</div>
          <div style={{opacity:.85}}>Бонус к прогрессу: +10% за вклад клана</div>
          <div style={{marginTop:8, fontWeight:700}}>Участники</div>
          <div style={{display:'grid', gap:6}}>
            {members.map(m => (
              <div key={m.userId} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10}}>
                <div>
                  <b>{m.userId === myId ? 'Вы' : m.name || m.userId}</b> <span style={{opacity:.8, marginLeft:8}}>{ROLE_LABEL[m.role]}</span>
                </div>
                <div style={{display:'flex', gap:6}}>
                  {members.find(x=>x.userId===myId)?.role === 'leader' && m.userId !== myId && (
                    <>
                      <select onChange={async(e)=>{ const role=e.target.value as any; const r=await apiClanSetRole(m.userId, role); if(r.ok){ showToast('Роль обновлена'); refresh(); } }} defaultValue={m.role} style={{background:'var(--panel-bg)', color:'var(--text)'}}>
                        <option value="novice">Новичок</option>
                        <option value="warden">Страж</option>
                        <option value="seer">Ясновидец</option>
                        <option value="leader">Лидер</option>
                      </select>
                      <Button onClick={async()=>{ const r = await apiClanKick(m.userId); if (r.ok) { showToast('Исключён'); refresh(); } }}>Выгнать</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:8}}>
            <input type="number" placeholder="Сумма вклада" value={amount} onChange={e=>setAmount(e.target.value)} />
            <Button disabled={loading || !amount} onClick={async()=>{
              const n = Number(amount);
              if (!Number.isFinite(n) || n<=0) { setErr('Сумма должна быть > 0'); alert('Сумма должна быть больше 0'); return; }
              setErr(null); setLoading(true);
              try {
                const res = await apiClanContribute(n);
                if (res.ok) { setMe({ ...me, bank: res.data.bank }); setAmount(''); showToast('Вклад принят!'); }
                else { setErr(res.error || 'Ошибка'); alert(res.error || 'Не удалось внести вклад'); }
              } finally { setLoading(false); }
            }}>Внести</Button>
            <Button onClick={async()=>{ const r = await apiClanLeave(); if (r.ok) { showToast('Вы покинули клан'); setMe(null); setMembers([]); refresh(); } }}>Покинуть</Button>
          </div>
          {err && <div style={{color:'#e77'}}>{err}</div>}
        </section>
      )}
    </div>
  );
}

