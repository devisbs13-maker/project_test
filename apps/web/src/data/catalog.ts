import type { ItemDef } from '../store/economy';

const tiers = [
  { t:1, lvl:1,   rarity:'common'   as const, price:120 },
  { t:2, lvl:20,  rarity:'uncommon' as const, price:320 },
  { t:3, lvl:40,  rarity:'rare'     as const, price:780 },
  { t:4, lvl:60,  rarity:'epic'     as const, price:1500 },
];

const slots = ['helmet','chest','pants','boots','gloves'] as const;

function nameFor(cls: string, slot: string, tier: number): string {
  const slotRu: Record<string,string> = { helmet:'Шлем', chest:'Верх', pants:'Штаны', boots:'Ботинки', gloves:'Перчатки' };
  const tierRu = ['Новобранец','Ветеран','Элитный','Чемпион'];
  const classRu: Record<string,string> = { warrior:'Воина', volkhv:'Волхва', hunter:'Охотника' };
  return ${slotRu[slot]}  ;
}

function makeSet(cls: 'warrior'|'volkhv'|'hunter'): ItemDef[] {
  const out: ItemDef[] = [];
  for (const { t, lvl, rarity, price } of tiers) {
    for (const s of slots) {
      out.push({
        id: ${cls}__t,
        name: nameFor(cls, s, t),
        slot: s,
        rarity,
        basePrice: price,
        requiredLevel: lvl,
        classReq: cls,
      });
    }
  }
  return out;
}

export const CATALOG: ItemDef[] = [
  ...makeSet('warrior'),
  ...makeSet('volkhv'),
  ...makeSet('hunter'),
  { id:'herb', name:'Травы', slot:'misc', rarity:'common', basePrice:12 },
  { id:'hide', name:'Шкура зверя', slot:'misc', rarity:'common', basePrice:28 },
];

