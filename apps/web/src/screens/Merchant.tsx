import { useMemo, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player, Item } from '../store/player';
import { savePlayer } from '../store/player';
import { loadEconomy, saveEconomy, type MerchantState } from '../store/economy';
import { generateDailyInventory, isStale } from '../utils/merchant';
import { CATALOG } from '../data/catalog';
import { sellPriceFor } from '../utils/pricing';
import { notifyAll } from '../utils/notify';

type Props = { player: Player; onBack: () => void; onUpdatePlayer: (p: Player) => void };

function rarityColor(r: string) {
  if (r === 'common') return '#9aa3ad';
  if (r === 'uncommon') return '#3fb950';
  if (r === 'rare') return '#539bf5';
  return '#a371f7';
}

export default function Merchant({ player, onBack, onUpdatePlayer }: Props) {
  const [tab, setTab] = useState<'buy'|'sell'>('buy'); const [slotTab, setSlotTab] = useState<'all'|'helmet'|'chest'|'pants'|'boots'|'gloves'|'misc'>('all');
  const [eco, setEco] = useState<MerchantState>(() => {
    const s = loadEconomy();
    if (!s || isStale(s)) {
      const gen = generateDailyInventory(player);
      saveEconomy(gen);
      return gen;
    }
    return s;
  });

  const defsById = useMemo(() => new Map(CATALOG.map(d => [d.id, d])), []);

  function buy(itemId: string) {
    const offIdx = eco.offers.findIndex(o => o.itemId === itemId);
    if (offIdx === -1) return;
    const offer = eco.offers[offIdx];
    const def = defsById.get(itemId);
    if (!def || offer.qty <= 0 || player.gold < offer.price) return;

    const newItem: Item = { id: def.id, name: def.name, slot: def.slot as any, rarity: def.rarity, requiredLevel: (def as any).requiredLevel, classReq: (def as any).classReq };
    const pNext: Player = { ...player, gold: player.gold - offer.price, inventory: [...player.inventory, newItem] };
    savePlayer(pNext); onUpdatePlayer(pNext);

    const offers = eco.offers.slice();
    offers[offIdx] = { ...offer, qty: offer.qty - 1 };
    const nextEco = { ...eco, offers };
    setEco(nextEco); saveEconomy(nextEco);

    notifyAll('quest', 'Покупка', { gold: -offer.price });
    const tg = (window as any).Telegram?.WebApp; tg?.sendData?.(JSON.stringify({ type:'purchase', title:def.name, price:offer.price, qty:1 }));
  }

  function sell(invIndex: number) {
    const it = player.inventory[invIndex];
    if (!it) return;
    const def = defsById.get(it.id);
    const price = def ? sellPriceFor(def, player) : 10;

    const newInv = player.inventory.slice();
    newInv.splice(invIndex, 1);
    const pNext: Player = { ...player, gold: player.gold + price, inventory: newInv };
    savePlayer(pNext); onUpdatePlayer(pNext);

    notifyAll('quest', 'Продажа', { gold: price });
    const tg = (window as any).Telegram?.WebApp; tg?.sendData?.(JSON.stringify({ type:'sale', title:def?.name ?? it.name ?? 'Товар', price, qty:1 }));
  }

  return (
    <div style={{display:'grid', gap:12, padding:16}}>
      <Header title="Торговец" gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      <div style={{display:'flex', gap:8}}>
        <Button onClick={()=>setTab('buy')} disabled={tab==='buy'}>Купить</Button>
        <Button onClick={()=>setTab('sell')} disabled={tab==='sell'}>Продать</Button>
      </div>

      {tab==='buy' && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            {eco.offers.length===0 && <div style={{opacity:.8}}>Сегодня товаров нет.</div>}
            {eco.offers.filter(o => { const d = defsById.get(o.itemId); return slotTab==='all' ? true : (d && d.slot===slotTab); }).map(o => {
              const def = defsById.get(o.itemId);
              if (!def) return null;
              const out = o.qty<=0; const cant = player.gold < o.price || out;
              return (
                <div key={o.itemId} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>
                    <div style={{fontWeight:700}}>{def.name} <span style={{color:rarityColor(o.rarity), fontSize:12, marginLeft:6}}>Редкость: {o.rarity}</span></div>
                    <div style={{opacity:.85, fontSize:12}}>Цена: 🪙 {o.price} • Доступно: {o.qty}</div>
                  </div>
                  <Button onClick={()=>buy(o.itemId)} disabled={cant}>{out? 'Нет в наличии' : 'Купить'}</Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab==='sell' && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            {player.inventory.length===0 && <div style={{opacity:.8}}>У вас нет предметов для продажи.</div>}
            {player.inventory.map((it, idx) => {
              const def = defsById.get(it.id);
              const price = def ? sellPriceFor(def, player) : 10;
              return (
                <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>
                    <div style={{fontWeight:700}}>{it.name ?? def?.name ?? it.id} {def && <span style={{color:rarityColor(def.rarity), fontSize:12, marginLeft:6}}>Редкость: {def.rarity}</span>}</div>
                    <div style={{opacity:.85, fontSize:12}}>Цена продажи: 🪙 {price}</div>
                  </div>
                  <Button onClick={()=>sell(idx)}>Продать</Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}


