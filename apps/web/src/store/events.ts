export type EventImpact = {
  gold?: number;      // +/- gold
  xp?: number;        // +/- xp
  energy?: number;    // +/- energy
  sociality?: number; // +/- sociality
  karma?: number;     // +/- karma
  luck?: number;      // +/- luck
};

export type EventChoice = {
  id: string;
  label: string;
  impact: EventImpact;
  // optional gating (later extendable)
  requires?: Partial<{ sociality: number; karma: number; luck: number; level: number }>;
};

export type VillageEvent = {
  id: string;
  title: string;
  text: string;
  // flavor tags (for future filtering)
  tags?: string[];
  choices: EventChoice[];
  art?: string; // optional illustration path
};

export type EventsState = {
  lastRollAt: number | null;   // unix ms of last shown event
  cooldownMs: number;          // min ms between events
  active: VillageEvent | null; // currently shown event (if any)
  history: { id: string; ts: number; choiceId: string }[]; // accepted events
};

const STORAGE_KEY = 'mirevald:events';

export function defaultCooldownMs() { return 1000 * 60 * 5; } // 5 minutes

export function loadEvents(): EventsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastRollAt: null, cooldownMs: defaultCooldownMs(), active: null, history: [] };
    const st = JSON.parse(raw);
    return {
      lastRollAt: st.lastRollAt ?? null,
      cooldownMs: st.cooldownMs ?? defaultCooldownMs(),
      active: st.active ?? null,
      history: Array.isArray(st.history) ? st.history : [],
    };
  } catch {
    return { lastRollAt: null, cooldownMs: defaultCooldownMs(), active: null, history: [] };
  }
}

export function saveEvents(s: EventsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// A small curated pool (Slavic-fantasy flavored)
export function eventCatalog(): VillageEvent[] {
  return [
    {
      id: 'market-argument',
      title: 'РЎРїРѕСЂ РЅР° Р±Р°Р·Р°СЂРµ',
      text: 'Р”РІРѕРµ СЂРµРјРµСЃР»РµРЅРЅРёРєРѕРІ СЃРїРѕСЂСЏС‚ Рѕ С†РµРЅРµ РґСѓР±Р»С‘РЅРѕР№ РєРѕР¶Рё. Р’РјРµС€Р°РµС€СЊСЃСЏ?',
      tags: ['social', 'village'],
      choices: [
        { id: 'mediate', label: 'Р Р°Р·РЅСЏС‚СЊ Рё РїСЂРёРјРёСЂРёС‚СЊ', impact: { sociality: +2, karma: +1, xp: +10 } },
        { id: 'supportA', label: 'РџРѕРґРґРµСЂР¶Р°С‚СЊ РїРµСЂРІРѕРіРѕ', impact: { gold: +10, karma: -1 } },
        { id: 'ignore', label: 'РџСЂРѕР№С‚Рё РјРёРјРѕ', impact: { luck: +1 } },
      ],
      art: '/images/events/market.jpg'
    },
    {
      id: 'herbalist-help',
      title: 'РџСЂРѕСЃСЊР±Р° Р·РЅР°С…Р°СЂРєРё',
      text: 'Р—РЅР°С…Р°СЂРєР° РїСЂРѕСЃРёС‚ РїРѕРјРѕС‡СЊ РґРѕРЅРµСЃС‚Рё С‚СЂР°РІС‹ Рє РёР·Р±Рµ.',
      tags: ['help', 'village'],
      choices: [
        { id: 'help', label: 'РџРѕРјРѕС‡СЊ', impact: { xp: +20, karma: +2, energy: -1 } },
        { id: 'ask-pay', label: 'РџРѕРїСЂРѕСЃРёС‚СЊ РїР»Р°С‚Сѓ', impact: { gold: +20, karma: -1 } },
        { id: 'refuse', label: 'РћС‚РєР°Р·Р°С‚СЊСЃСЏ', impact: { karma: -1 } },
      ],
      art: '/images/events/herbalist.jpg'
    },
    {
      id: 'lost-charm',
      title: 'РџРѕС‚РµСЂСЏРЅРЅС‹Р№ РѕР±РµСЂРµРі',
      text: 'Р РµР±С‘РЅРѕРє РёС‰РµС‚ РѕР±РµСЂРµРі, СѓРєР°Р·С‹РІР°СЏ РЅР° Р»СѓР¶Сѓ. Р”РѕСЃС‚Р°РЅРµС€СЊ?',
      tags: ['luck', 'village'],
      choices: [
        { id: 'search', label: 'РќС‹СЂРЅСѓС‚СЊ РІ РіСЂСЏР·СЊ', impact: { luck: +2, xp: +10, energy: -1 } },
        { id: 'teach', label: 'РќР°СѓС‡РёС‚СЊ РёСЃРєР°С‚СЊ РІРЅРёРјР°С‚РµР»СЊРЅРµРµ', impact: { sociality: +1, xp: +5 } },
        { id: 'leave', label: 'РћСЃС‚Р°РІРёС‚СЊ РєР°Рє РµСЃС‚СЊ', impact: { luck: -1 } },
      ],
      art: '/images/events/charm.jpg'
    },
  ];
}

