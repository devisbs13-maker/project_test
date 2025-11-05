import Button from '../components/Button';
import Header from '../components/Header';
import type { Player, ClassId } from '../store/player';
import { createPlayer } from '../store/player';
import { getT } from '../i18n';

export default function ClassSelect({ onPick }: { onPick: (p: Player) => void }) {
  const T = getT();
  const options: Array<{ id: ClassId; title: string; sub: string }> = [
    { id: 'warrior', title: (T.classSelect as any)?.warrior?.name ?? 'Warrior', sub: (T.classSelect as any)?.warrior?.subtitle ?? 'Strength and fortitude' },
    { id: 'volkhv', title: (T.classSelect as any)?.mage?.name ?? 'Volkhv', sub: (T.classSelect as any)?.mage?.subtitle ?? 'Magic and wisdom' },
    { id: 'hunter', title: (T.classSelect as any)?.hunter?.name ?? 'Hunter', sub: (T.classSelect as any)?.hunter?.subtitle ?? 'Agility and accuracy' },
  ];
  return (
    <div style={{padding:16, display:'grid', gap:12}}>
      <Header title={(T.classSelect as any)?.title ?? 'Choose Class'} gold={0} energy={0} level={1} onBack={() => history.back()} />
      <div style={{display:'grid', gap:10}}>
        {options.map(o => (
          <div key={o.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
            <div>
              <div style={{fontWeight:700}}>{o.title}</div>
              <div style={{opacity:.85, fontSize:12}}>{o.sub}</div>
            </div>
            <Button onClick={() => onPick(createPlayer(o.id, o.title))}>{T.buttons?.confirm ?? 'Choose'}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
