import Header from '../components/Header';
import PortraitCard from '../components/PortraitCard';
import StatBar from '../components/StatBar';
import InventoryGrid from '../components/InventoryGrid';
import { CLASS_ASSETS } from '../assets/classes';
import type { Player, Item, ItemSlot } from '../store/player';
import { effectiveStats } from '../store/player';
import { useEffect, useState } from 'react';
import { apiClanMe } from '../utils/api';
import { getT } from '../i18n';

type Props = {
  player: Player;
  onBack: () => void;
  onUpdatePlayer: (p: Player) => void;
};

export default function Character({ player, onBack, onUpdatePlayer }: Props) {
  const T = getT();
  const cls = CLASS_ASSETS[player.classId];
  const estats = effectiveStats(player);
  const [clanTag, setClanTag] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    (async () => {
      try {
        const res = await apiClanMe();
        if (!done && res?.ok && res.data) setClanTag(res.data.tag);
      } catch {}
    })();
    return () => { done = true; };
  }, []);

  function equip(item: Item) {
    const slot = item.slot as ItemSlot;
    if (item.classReq && item.classReq !== player.classId) { alert(T.character?.classMismatch ?? 'Class mismatch: cannot equip'); return; }
    if ((item.requiredLevel ?? 1) > player.progress.level) { alert(`${T.character?.levelReq ?? 'Level required'}: ${item.requiredLevel}`); return; }
    const nextInv = player.inventory.filter(i => i !== item);
    const prev = (player.equipment as any)[slot] ?? null;
    const nextEquip = { ...player.equipment, [slot]: item } as any;
    const back = prev ? [...nextInv, prev] : nextInv;
    const next = { ...player, equipment: nextEquip, inventory: back };
    onUpdatePlayer(next);
  }

  function unequip(slot: ItemSlot) {
    const cur = (player.equipment as any)[slot] ?? null;
    if (!cur) return;
    const next = {
      ...player,
      equipment: { ...(player.equipment as any), [slot]: null } as any,
      inventory: [...player.inventory, cur]
    } as Player;
    onUpdatePlayer(next);
  }

  return (
    <div style={{padding:16, display:'grid', gap:12}}>
      <Header title={T.buttons?.character ?? 'Character'} gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} badgeTag={clanTag} />
      <PortraitCard
        img={cls.img}
        title={cls.title}
        subtitle={`${T.stats.level} ${player.progress.level} • ${T.stats.energy} ${player.energy}/${player.energyMax}${clanTag ? ` • Clan: ${clanTag}` : ''}`}
        size="lg"
      />

      <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', boxShadow:'var(--shadow)', display:'grid', gap:10}}>
        <b>{T.character?.progress ?? 'Progress'}</b>
        <StatBar label={T.character?.xp ?? 'XP'} value={player.progress.xp} max={player.progress.xpToNext} />
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <div>STR: {estats.str}</div>
          <div>AGI: {estats.agi}</div>
          <div>INT: {estats.int}</div>
          <div>VIT: {estats.vit}</div>
        </div>
      </section>
      <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', boxShadow:'var(--shadow)'}}>
        <b>{T.character?.equipment ?? 'Equipment'}</b>
        <EquipRow label={T.character?.weapon ?? 'Weapon'} item={(player.equipment as any).weapon} onUnequip={() => unequip('weapon')} />
      </section>

      <section style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr', alignItems:'start'}}>
        <div style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', boxShadow:'var(--shadow)'}}>
          <b>{T.character?.armor ?? 'Armor'}</b>
          <EquipRow label={T.character?.helmet ?? 'Helmet'} item={(player.equipment as any).helmet} onUnequip={() => unequip('helmet')} />
          <EquipRow label={T.character?.chest ?? 'Chest'} item={(player.equipment as any).chest}  onUnequip={() => unequip('chest')} />
          <EquipRow label={T.character?.pants ?? 'Pants'} item={(player.equipment as any).pants}  onUnequip={() => unequip('pants')} />
          <EquipRow label={T.character?.boots ?? 'Boots'} item={(player.equipment as any).boots} onUnequip={() => unequip('boots')} />
          <EquipRow label={T.character?.gloves ?? 'Gloves'} item={(player.equipment as any).gloves} onUnequip={() => unequip('gloves')} />
        </div>

        <div style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)', boxShadow:'var(--shadow)', display:'grid', gap:8}}>
          <b>{T.character?.inventory ?? 'Inventory'}</b>
          <InventoryGrid items={player.inventory} onEquip={equip} />
        </div>
      </section>
    </div>
  );
}

function EquipRow({ label, item, onUnequip }: { label: string; item?: Item | null; onUnequip: () => void }) {
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:10}}>
      <div style={{opacity:.9}}>{label}</div>
      <div style={{opacity:.9}}>
        {item ? <span>{item.name}</span> : <span style={{opacity:.7}}>{getT().character?.empty ?? 'Empty'}</span>}
      </div>
      <div>
        <button
          disabled={!item}
          onClick={onUnequip}
          className="mire-btn"
          style={{padding:'6px 10px', borderRadius:10}}
        >
          {getT().character?.unequip ?? 'Unequip'}
        </button>
      </div>
    </div>
  );
}
