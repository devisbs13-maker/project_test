import { useMemo, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player, Item } from '../store/player';
import { savePlayer } from '../store/player';
import { loadEconomy, saveEconomy, type MerchantState } from '../store/economy';
import { generateDailyInventory, isStale } from '../utils/merchant';
import { CATALOG } from '../data/catalog';
import { sellPriceFor, rarityFactor, priceFor } from '../utils/pricing';
import { notifyAll } from '../utils/notify';

type Props = { player: Player; onBack: () => void; onUpdatePlayer: (p: Player) => void };

const L = {
  title: 'Торговец',
  buy: 'Купить',
  sell: 'Продать',
  resources: 'Ресурсы',
  clothing: 'Одежда',
  rarity: 'редкость',
  price: 'Цена',
  levelReq: 'ур.',
  buyBtn: 'Купить',
  sellBtn: 'Продать',
  none: 'Сегодня товаров нет.'
};

function rarityColor(r: string) {
  if (r === 'common') return '#9aa3ad';
  if (r === 'uncommon') return '#3fb950';
  if (r === 'rare') return '#539bf5';
  return '#a371f7';
}

export default function Merchant({ player, onBack, onUpdatePlayer }: Props) {
  const [tab, setTab] = useState<'buy'|'sell'>('buy');
  const [category, setCategory] = useState<'resources'|'clothing'>('resources');

  // daily economy kept for future, but UI focuses on categories
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

  function buyFromCatalog(defId: string) {
    const def = defsById.get(defId);
    if (!def) return;
    const base = Math.round(def.basePrice * rarityFactor(def.rarity));
    const unitPrice = priceFor('buy', base, player);
    if (player.gold < unitPrice) return;
    const newItem: Item = { id: def.id, name: def.name, slot: def.slot as any, rarity: def.rarity, requiredLevel: (def as any).requiredLevel, classReq: (def as any).classReq };
    const pNext: Player = { ...player, gold: player.gold - unitPrice, inventory: [...player.inventory, newItem] };
    savePlayer(pNext); onUpdatePlayer(pNext);
    try {
      notifyAll('quest', 'Покупка', { gold: -unitPrice });
      const tg = (window as any).Telegram?.WebApp; tg?.sendData?.(JSON.stringify({ type:'purchase', title:def.name, price:unitPrice, qty:1 }));
    } catch {}
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
    try {
      notifyAll('quest', 'Продажа', { gold: price });
      const tg = (window as any).Telegram?.WebApp; tg?.sendData?.(JSON.stringify({ type:'sale', title:def?.name ?? it.name ?? 'Предмет', price, qty:1 }));
    } catch {}
  }

  const armorSlots = new Set(['helmet','chest','pants','boots','gloves']);
  const clothingDefs = useMemo(() => CATALOG.filter(d => armorSlots.has(d.slot)), []);
  const resourceDefs = useMemo(() => CATALOG.filter(d => d.slot === 'misc'), []);

  return (
    <div style={{display:'grid', gap:12, padding:16}}>
      <Header title={L.title} gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />

      <div style={{display:'flex', gap:8}}>
        <Button onClick={()=>setTab('buy')} disabled={tab==='buy'}>{L.buy}</Button>
        <Button onClick={()=>setTab('sell')} disabled={tab==='sell'}>{L.sell}</Button>
      </div>

      {tab==='buy' && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <Button onClick={()=>setCategory('resources')} disabled={category==='resources'}>{L.resources}</Button>
            <Button onClick={()=>setCategory('clothing')} disabled={category==='clothing'}>{L.clothing}</Button>
          </div>

          {category==='resources' && (
            <div style={{display:'grid', gap:8}}>
              {resourceDefs.map(def => {
                const base = Math.round(def.basePrice * rarityFactor(def.rarity));
                const price = priceFor('buy', base, player);
                const cant = player.gold < price;
                return (
                  <div key={def.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      {def.image ? <img src={def.image} alt={def.name} style={{width:32,height:32,objectFit:'cover',borderRadius:6}} /> : <div style={{width:32,height:32,borderRadius:6,background:'rgba(255,255,255,0.07)'}} />}
                      <div>
                        <div style={{fontWeight:700}}>{def.name} <span style={{color:rarityColor(def.rarity), fontSize:12, marginLeft:6}}>{L.rarity}: {def.rarity}</span></div>
                        <div style={{opacity:.85, fontSize:12}}>{L.price}: ₽ {price}</div>
                      </div>
                    </div>
                    <Button onClick={()=>buyFromCatalog(def.id)} disabled={cant}>{L.buyBtn}</Button>
                  </div>
                );
              })}
            </div>
          )}

          {category==='clothing' && (
            <div style={{display:'grid', gap:12}}>
              {(['warrior','volkhv','hunter'] as const).map(cls => (
                <div key={cls} style={{display:'grid', gap:8}}>
                  {[1,2,3,4].map(tier => {
                    const items = clothingDefs.filter(d => (d as any).classReq===cls && /_t\d+$/.test(d.id) && d.id.endsWith(`t${tier}`));
                    if (items.length===0) return null;
                    return (
                      <div key={`${cls}_t${tier}`} style={{display:'grid', gap:6}}>
                        <div style={{opacity:.9, fontWeight:700}}>{`Сет ${cls} t${tier}`}</div>
                        {items.map(def => {
                          const base = Math.round(def.basePrice * rarityFactor(def.rarity));
                          const price = priceFor('buy', base, player);
                          const cant = player.gold < price;
                          const locked = (((def as any).requiredLevel ?? 1) > player.progress.level) || (!!(def as any).classReq && (def as any).classReq !== player.classId);
                          return (
                            <div key={def.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                              <div style={{display:'flex', alignItems:'center', gap:10}}>
                                {def.image ? <img src={def.image} alt={def.name} style={{width:36,height:36,objectFit:'cover',borderRadius:6}} /> : <div style={{width:36,height:36,borderRadius:6,background:'rgba(255,255,255,0.07)'}} />}
                                <div>
                                  <div style={{fontWeight:700}}>{def.name} {locked && <span style={{marginLeft:6}}>🔒</span>} <span style={{color:rarityColor(def.rarity), fontSize:12, marginLeft:6}}>{L.rarity}: {def.rarity}</span></div>
                                  <div style={{opacity:.85, fontSize:12}}>{L.price}: ₽ {price} {def.requiredLevel ? `• ${L.levelReq} ${def.requiredLevel}+` : ''} {((def as any).classReq && (def as any).classReq !== player.classId) ? `• класс: ${(def as any).classReq}` : ''}</div>
                                </div>
                              </div>
                              <Button onClick={()=>buyFromCatalog(def.id)} disabled={cant}>{L.buyBtn}</Button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab==='sell' && (
        <section style={{padding:12, borderRadius:16, background:'var(--panel-bg)', border:'var(--panel-border)'}}>
          <div style={{display:'grid', gap:8}}>
            {player.inventory.length===0 && <div style={{opacity:.8}}>Инвентарь пуст.</div>}
            {player.inventory.map((it, idx) => {
              const def = defsById.get(it.id);
              const price = def ? sellPriceFor(def, player) : 10;
              return (
                <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:12, background:'var(--panel-bg)', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>
                    <div style={{fontWeight:700}}>{it.name ?? def?.name ?? it.id} {def && <span style={{color:rarityColor(def.rarity), fontSize:12, marginLeft:6}}>{L.rarity}: {def.rarity}</span>}</div>
                    <div style={{opacity:.85, fontSize:12}}>Цена продажи: ₽ {price}</div>
                  </div>
                  <Button onClick={()=>sell(idx)}>{L.sellBtn}</Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

