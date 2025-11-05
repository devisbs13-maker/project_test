const BASE = (import.meta as any)?.env?.BASE_URL || (import.meta as any)?.env?.VITE_BASE_URL || '/';
const asset = (name: string) => `${BASE}images/${name}`;

export const CLASS_ASSETS: Record<'warrior'|'volkhv'|'hunter', { img: string; title: string; desc: string }> = {
  warrior: { img: asset('warrior.png'), title: 'Воин',   desc: 'Сила и стойкость' },
  volkhv:  { img: asset('mage.png'),    title: 'Волхв',  desc: 'Магия и мудрость' },
  hunter:  { img: asset('hunter.png'),  title: 'Охотник',desc: 'Ловкость и меткость' },
};

