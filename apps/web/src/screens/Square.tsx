import { useMemo } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { savePlayer } from '../store/player';
import { showToast } from '../utils/notify';

type Props = { player: Player; onBack?: () => void; onUpdatePlayer: (p: Player) => void };

const mocked = [
  { id: 1, name: 'РҐР°Р»РґСЂ', level: 5, class: 'Р’РѕРёРЅ', status: 'РћРЅР»Р°Р№РЅ', avatar: '/images/avatar1.png' },
  { id: 2, name: 'РЎР°СЌР»РёСЏ', level: 4, class: 'Р’РѕР»С…РІ', status: 'РќРµРґР°РІРЅРѕ', avatar: '/images/avatar2.png' },
  { id: 3, name: 'РћС…РѕС‚РЅРёРє РўР°СЂРµРЅ', level: 3, class: 'РћС…РѕС‚РЅРёРє', status: 'РћРЅР»Р°Р№РЅ', avatar: '/images/avatar3.png' },
];

export default function Square({ player, onBack, onUpdatePlayer }: Props) {
  const players = useMemo(() => mocked, []);

  function greet(name: string) {
    const next: Player = { ...player, sociality: (player.sociality ?? 0) + 1 };
    savePlayer(next); onUpdatePlayer(next);
    showToast(`Р’С‹ РїРѕР·РґРѕСЂРѕРІР°Р»РёСЃСЊ СЃ ${name} рџ‘‹ (+1 Рє СЃРѕС†РёР°Р»СЊРЅРѕСЃС‚Рё)`);
  }

  return (
    <div style={{position:'relative'}}>
      <div style={{
        position:'fixed', inset:0,
        background: `linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.85)), url('/images/square_bg.jpg') center/cover no-repeat`
      }} />

      <div style={{position:'relative', padding:16, display:'grid', gap:12, maxWidth:560, margin:'0 auto'}}>
        <Header title="РџР»РѕС‰Р°РґСЊ" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

        <section style={{
          padding:12, borderRadius:16,
          background:'rgba(18,18,20,.6)', backdropFilter:'blur(6px)',
          border:'1px solid rgba(255,255,255,0.08)', boxShadow:'var(--shadow)'}}>
          <b>РџСѓС‚РЅРёРєРё Сѓ РєРѕСЃС‚СЂР°</b>
          <div style={{display:'grid', gap:10, marginTop:10}}>
            {players.map(p => (
              <div key={p.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{display:'flex', gap:12, alignItems:'center'}}>
                  <img src={p.avatar} alt={p.name} width={44} height={44} style={{borderRadius:10, objectFit:'cover'}} />
                  <div>
                    <div style={{fontWeight:700}}>{p.name}</div>
                    <div style={{opacity:.85, fontSize:12}}>РЈСЂ. {p.level} вЂў {p.class} вЂў {p.status}</div>
                  </div>
                </div>
                <Button onClick={() => greet(p.name)}>РџРѕР·РґРѕСЂРѕРІР°С‚СЊСЃСЏ</Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

