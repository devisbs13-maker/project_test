export type Rarity = 'common'|'uncommon'|'rare'|'epic';
export type Side = 'buy'|'sell';

export type ItemDef = {
  id: string;
  name: string;
  slot: 'weapon'|'armor'|'amulet'|'misc';
  rarity: Rarity;
  basePrice: number;      // for BUY baseline
  sellBase?: number;      // optional baseline for SELL (otherwise basePrice*0.45)
};

export type Offer = {
  itemId: string;
  qty: number;
  price: number;          // actual unit price for BUY
  rarity: Rarity;
};

export type MerchantState = {
  dateKey: string;        // YYYY-MM-DD
  offers: Offer[];        // BUY catalog for today
};

const ECO_KEY = 'mirevald:economy';

export function saveEconomy(s: MerchantState) {
  localStorage.setItem(ECO_KEY, JSON.stringify(s));
}
export function loadEconomy(): MerchantState|null {
  try {
    const s = localStorage.getItem(ECO_KEY);
    return s ? JSON.parse(s) as MerchantState : null;
  } catch { return null; }
}

