export type Reward = { gold?: number; xp?: number; energy?: number };

export type DailyMission = {
  id: string;
  title: string;
  progress: number;
  target: number;
  reward: Reward;
  claimed: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  desc?: string;
  progress: number;
  target: number;
  reward: Reward;
  claimed: boolean;
  oneShot?: boolean; // default true
};

export type StreakState = {
  lastLoginDate: string | null; // YYYY-MM-DD
  count: number;                // current streak length
  claimAvailable: boolean;      // can claim today's reward
};

export type ProgressionState = {
  dateKey: string;              // for dailies rotation
  dailies: DailyMission[];
  achievements: Achievement[];
  streak: StreakState;
};

const KEY = 'mirevald:progression';

export function saveProgression(s: ProgressionState) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function loadProgression(): ProgressionState | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export const todayKey = () => new Date().toISOString().slice(0,10);

// simple daily generator (rotate by day)
export function generateDailies(): DailyMission[] {
  return [
    { id:'dq_quests', title:'Р’С‹РїРѕР»РЅРё 2 РєРІРµСЃС‚Р°', progress:0, target:2, reward:{xp:25, gold:20}, claimed:false },
    { id:'dq_jobs',   title:'РћС‚СЂР°Р±РѕС‚Р°Р№ 2 СЂР°Р·Р°',  progress:0, target:2, reward:{xp:15, gold:30}, claimed:false },
    { id:'dq_events', title:'РЎС‹РіСЂР°Р№ 1 СЃРѕР±С‹С‚РёРµ',  progress:0, target:1, reward:{xp:10, energy:1}, claimed:false },
  ];
}

// baseline achievements
export function defaultAchievements(): Achievement[] {
  return [
    { id:'a_lvl5',   title:'РџРѕРґРЅСЏС‚СЊСЃСЏ РґРѕ 5 СѓСЂРѕРІРЅСЏ',         progress:0, target:5,  reward:{gold:100, xp:30}, claimed:false, oneShot:true },
    { id:'a_social', title:'Р”РѕСЃС‚РёС‡СЊ 10 СЃРѕС†РёР°Р»СЊРЅРѕСЃС‚Рё',       progress:0, target:10, reward:{gold:60,  xp:20}, claimed:false, oneShot:true },
    { id:'a_karma',  title:'РќР°Р±СЂР°С‚СЊ 5 РєР°СЂРјС‹',               progress:0, target:5,  reward:{gold:80,  xp:25}, claimed:false, oneShot:true },
    { id:'a_luck',   title:'Р”РѕСЃС‚РёС‡СЊ 8 СѓРґР°С‡Рё',               progress:0, target:8,  reward:{gold:70,  xp:20}, claimed:false, oneShot:true },
    { id:'a_gold1k', title:'Р—Р°СЂР°Р±РѕС‚Р°С‚СЊ 1000 Р·РѕР»РѕС‚Р° РІСЃРµРіРѕ',  progress:0, target:1000, reward:{xp:50}, claimed:false, oneShot:true },
  ];
}

export function initProgression(): ProgressionState {
  const dateKey = todayKey();
  return {
    dateKey,
    dailies: generateDailies(),
    achievements: defaultAchievements(),
    streak: { lastLoginDate: null, count: 0, claimAvailable: true },
  };
}

export function streakReward(count: number): Reward {
  if (count % 7 === 0) return { gold: 120, xp: 30 };
  if (count % 5 === 0) return { gold: 60, xp: 20 };
  if (count % 3 === 0) return { energy: 1, xp: 10 };
  if (count % 2 === 0) return { gold: 15 };
  return { gold: 10 };
}

