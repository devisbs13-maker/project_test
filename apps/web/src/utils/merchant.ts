import { CATALOG } from '../data/catalog';
import { rarityFactor } from './pricing';
import type { MerchantState, Offer } from '../store/economy';
import type { Player } from '../store/player';
import { priceFor } from './pricing';

// simple daily seed from date
const todayKey = () => new Date().toISOString().slice(0,10); // YYYY-MM-DD

export function generateDailyInventory(p: Player): MerchantState {
  const dateKey = todayKey();
  const rnd = () => Math.random();

  // 1) Guaranteed class set for player's current tier (5 pieces)
  const level = p.progress?.level ?? 1;
  const tiers = [
    { t:1, lvl:1 },
    { t:2, lvl:20 },
    { t:3, lvl:40 },
    { t:4, lvl:60 },
  ];
  const tier = [...tiers].reverse().find(x => level >= x.lvl) ?? tiers[0];

  const classSet = CATALOG.filter(d => (d as any).classReq === p.classId && /_t\d+$/.test(d.id) && d.id.endsWith(`t${tier.t}`));

  const chosen: Offer[] = [];
  for (const def of classSet) {
    const rf = rarityFactor(def.rarity);
    const base = Math.round(def.basePrice * rf);
    const unitPrice = priceFor('buy', base, p);
    chosen.push({ itemId: def.id, qty: 1, price: unitPrice, rarity: def.rarity });
  }

  // 2) Fill remaining slots with random items from catalog (excluding duplicates)
  const pool = CATALOG.filter(d => !chosen.find(o => o.itemId === d.id));
  const luck = Math.min(30, Math.max(0, p.luck ?? 0));
  const chanceRare = 0.15 + luck * 0.01;
  const chanceEpic = 0.04 + luck * 0.004;

  while (chosen.length < 8 && pool.length) {
    const idx = Math.floor(rnd() * pool.length);
    const def = pool.splice(idx, 1)[0];
    if (def.rarity === 'rare'   && rnd() > chanceRare) continue;
    if (def.rarity === 'epic'   && rnd() > chanceEpic) continue;
    const rf = rarityFactor(def.rarity);
    const base = Math.round(def.basePrice * rf);
    const unitPrice = priceFor('buy', base, p);
    chosen.push({ itemId: def.id, qty: 1 + Math.floor(rnd() * 2), price: unitPrice, rarity: def.rarity });
  }

  return { dateKey, offers: chosen };
}

export function isStale(state: MerchantState): boolean {
  return state.dateKey !== todayKey();
}
