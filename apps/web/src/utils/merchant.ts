import { CATALOG } from '../data/catalog';
import { rarityFactor } from './pricing';
import type { MerchantState, Offer } from '../store/economy';
import type { Player } from '../store/player';
import { priceFor } from './pricing';

// simple daily seed from date
const todayKey = () => new Date().toISOString().slice(0,10); // YYYY-MM-DD

export function generateDailyInventory(p: Player): MerchantState {
  const dateKey = todayKey();
  const pool = CATALOG.slice();

  // luck influences chance to include higher rarity items
  const luck = Math.min(30, Math.max(0, p.luck ?? 0));
  const chanceRare = 0.15 + luck * 0.01;  // 15% + 1% per luck
  const chanceEpic = 0.04 + luck * 0.004; // 4% + 0.4% per luck

  const rnd = () => Math.random();

  const chosen: Offer[] = [];
  while (chosen.length < 6 && pool.length) {
    const idx = Math.floor(rnd() * pool.length);
    const def = pool.splice(idx, 1)[0];

    const rf = rarityFactor(def.rarity);
    const base = Math.round(def.basePrice * rf);

    if (def.rarity === 'rare'   && rnd() > chanceRare) continue;
    if (def.rarity === 'epic'   && rnd() > chanceEpic) continue;

    const unitPrice = priceFor('buy', base, p);
    chosen.push({ itemId: def.id, qty: 1 + Math.floor(rnd() * 3), price: unitPrice, rarity: def.rarity });
  }

  return { dateKey, offers: chosen };
}

export function isStale(state: MerchantState): boolean {
  return state.dateKey !== todayKey();
}

