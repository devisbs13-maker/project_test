export type Reward = { gold?: number; xp?: number; energy?: number };
export type TaskKind = 'quest' | 'job';

export type TaskDef = {
  id: string;
  kind: TaskKind;
  title: string;
  desc?: string;
  durationSec: number;
  costEnergy?: number;
  reward: Reward;
};

export type ActiveTask = {
  id: string;
  kind: TaskKind;
  startedAt: number;
  endsAt: number;
};

export type RewardEntry = {
  id: string;
  kind: TaskKind;
  title: string;
  reward: Reward;
  completedAt: number;
};

export type Limits = {
  quest: number; // max active quests at a time
  job: number;   // max active jobs at a time
};

export type GameState = {
  tasks: TaskDef[];
  active: ActiveTask[];
  vault: RewardEntry[];
  limits: Limits;
};

const STORAGE_KEY = 'mirevald:game';

export function defaultTasks(): TaskDef[] {
  return [
    // Quests
    { id:'q-wolves', kind:'quest', title:'Волки на опушке', desc:'Прогнать волков рядом с деревней.', durationSec: 60*3,  costEnergy:2, reward:{ xp:40, gold:20 } },
    { id:'q-roots',  kind:'quest', title:'Корни для знахарки', desc:'Найти лекарственные корни на лугу.', durationSec: 60*5,  costEnergy:3, reward:{ xp:70, gold:35 } },
    { id:'q-ruins',  kind:'quest', title:'Разведка руин',      desc:'Проверить руины у старого тракта.',   durationSec: 60*8,  costEnergy:4, reward:{ xp:110,gold:60 } },
    // Jobs
    { id:'j-sawmill',kind:'job',   title:'Помощь на лесопилке', desc:'Погрузка брёвен на повозку.',        durationSec: 60*5,  costEnergy:2, reward:{ gold:50, xp:10 } },
    { id:'j-mine',   kind:'job',   title:'Рудник',             desc:'Сортировка руды у шахты.',           durationSec: 60*10, costEnergy:3, reward:{ gold:90, xp:15 } },
  ];
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tasks: defaultTasks(), active: [], vault: [], limits: { quest: 1, job: 2 } };
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaultTasks(),
      active: Array.isArray(parsed.active) ? parsed.active : [],
      vault: Array.isArray(parsed.vault) ? parsed.vault : [],
      limits: parsed.limits ?? { quest: 1, job: 2 },
    };
  } catch {
    return { tasks: defaultTasks(), active: [], vault: [], limits: { quest: 1, job: 2 } };
  }
}

export function saveGame(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
