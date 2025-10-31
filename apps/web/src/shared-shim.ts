export type Job = {
  id: string;
  title: string;
  rewardGold: number;
  rewardXp?: number;
  durationMin?: number;
};

export type PlayerJob = {
  jobId: string;
  startedAt: number; // ms
  endsAt: number;    // ms
};

export function greet(name = "Путник") {
  return `Добро пожаловать, ${name}!`;
}
