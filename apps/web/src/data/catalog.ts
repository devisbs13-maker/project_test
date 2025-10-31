import type { ItemDef } from '../store/economy';

export const CATALOG: ItemDef[] = [
  { id:'herb',    name:'Травы',             slot:'misc',   rarity:'common',   basePrice: 12 },
  { id:'hide',    name:'Выделанная кожа',    slot:'misc',   rarity:'common',   basePrice: 28 },
  { id:'oakbow',  name:'Дубовый лук',        slot:'weapon', rarity:'uncommon', basePrice: 95 },
  { id:'coat',    name:'Плотный плащ',       slot:'armor',  rarity:'uncommon', basePrice: 110 },
  { id:'rune',    name:'Руна силы',          slot:'amulet', rarity:'rare',     basePrice: 240 },
  { id:'sword',   name:'Стальной меч',       slot:'weapon', rarity:'rare',     basePrice: 320 },
  { id:'amulet',  name:'Амулет удачи',       slot:'amulet', rarity:'epic',     basePrice: 560 },
];

