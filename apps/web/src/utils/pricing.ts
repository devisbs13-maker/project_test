import type { Side } from '../store/economy';
import type { Player, Item } from '../store/player';
import type { ItemDef } from '../store/economy';

// clamp helper
const clamp = (v:number, lo:number, hi:number) => Math.max(lo, Math.min(hi, v));

/**
 * Price modifiers:
 * - karma: fair play в†’ discount on buy, premium on sell (merchant trusts you),
 *          low karma в†’ markup on buy, worse sell rates.
 * - luck: small extra discount and higher chance for rare stock.
 * - sociality: small discount on buy (haggling).
 * Rarity multiplier handled outside (catalog/offer).
 */
export function priceFor(side: Side, base: number, p: Player): number {
  const karma = p.karma ?? 0;        // typically -30..+30
  const luck = p.luck ?? 0;          // 0..30
  const soc = p.sociality ?? 0;      // 0..50+

  // KARMA effect (linear, symmetric, clamped)
  // range ~ [-12%, +12%]
  const kNorm = clamp(karma, -30, 30) / 30;
  const kBuy  = 1 - (kNorm * 0.12);  // high karma -> cheaper
  const kSell = 1 + (kNorm * 0.08);  // high karma -> better sell price

  // LUCK small bonus: up to -4% on buy, +3% on sell
  const lNorm = clamp(luck, 0, 30) / 30;
  const lBuy  = 1 - (lNorm * 0.04);
  const lSell = 1 + (lNorm * 0.03);

  // SOCIALITY (haggling): every +5 sociality ~ -1% on buy, capped 8%
  const socDisc = - Math.min(0.08, Math.floor(soc / 5) * 0.01);
  const sBuy = 1 + socDisc;

  const buyMul  = kBuy * lBuy * sBuy;
  const sellMul = kSell * lSell;

  const mul = side === 'buy' ? buyMul : sellMul;

  // wobble: В±2% small daily randomness to avoid perfect arbitrage
  const wobble = side === 'buy' ? 1 + (Math.random()*0.02 - 0.01) : 1 + (Math.random()*0.02 - 0.01);

  const raw = base * mul * wobble;
  // round to sensible granularity
  return Math.max(1, Math.round(raw));
}

// rarity multiplier (adds scarcity into base before modifiers)
export function rarityFactor(r: 'common'|'uncommon'|'rare'|'epic'): number {
  if (r === 'common') return 1.0;
  if (r === 'uncommon') return 1.2;
  if (r === 'rare') return 1.6;
  return 2.2; // epic
}

export function sellPriceFor(def: ItemDef, p: Player): number {
  const base = Math.round((def.sellBase ?? def.basePrice * 0.45) * rarityFactor(def.rarity));
  return priceFor('sell', base, p);
}

