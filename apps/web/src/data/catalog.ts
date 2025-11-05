import type { ItemDef } from '../store/economy';

const tiers = [
  { t:1, lvl:1,   rarity:'common'   as const, price:120 },
  { t:2, lvl:20,  rarity:'uncommon' as const, price:320 },
  { t:3, lvl:40,  rarity:'rare'     as const, price:780 },
  { t:4, lvl:60,  rarity:'epic'     as const, price:1500 },
];

// Extend catalog with class weapons (4 tiers each)
CATALOG.push(
  ...makeWeapons('warrior'),
  ...makeWeapons('volkhv'),
  ...makeWeapons('hunter'),
);

const slots = ['helmet','chest','pants','boots','gloves'] as const;

function nameFor(cls: string, slot: string, tier: number): string {
  const slotRu: Record<string,string> = { helmet:'Шлем', chest:'Верх', pants:'Штаны', boots:'Ботинки', gloves:'Перчатки' };
  const tierRu = ['Новобранец','Ветеран','Элитный','Чемпион'];
  const classRu: Record<string,string> = { warrior:'Воина', volkhv:'Волхва', hunter:'Охотника' };
  return `${slotRu[slot]} ${tierRu[tier-1]} ${classRu[cls]}`;
}

function makeSet(cls: 'warrior'|'volkhv'|'hunter'): ItemDef[] {
  const out: ItemDef[] = [];
  for (const { t, lvl, rarity, price } of tiers) {
    for (const s of slots) {
      out.push({
        id: `${cls}_${s}_t${t}`,
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

function weaponNameFor(cls: 'warrior'|'volkhv'|'hunter', tier: number): string {
  const clsName: Record<string,string> = { warrior:'Warrior', volkhv:'Volkhv', hunter:'Hunter' };
  const tierName = ['T1','T2','T3','T4'][tier-1] ?? `T${tier}`;
  const weaponByClass: Record<string,string> = { warrior:'Sword', volkhv:'Staff', hunter:'Bow' };
  return `${weaponByClass[cls]} ${tierName} ${clsName[cls]}`;
}

function makeWeapons(cls: 'warrior'|'volkhv'|'hunter'): ItemDef[] {
  const out: ItemDef[] = [];
  for (const { t, lvl, rarity, price } of tiers) {
    out.push({
      id: `${cls}_weapon_t${t}`,
      name: weaponNameFor(cls, t),
      slot: 'weapon',
      rarity,
      basePrice: Math.round(price * 1.5),
      requiredLevel: lvl,
      classReq: cls,
    });
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
