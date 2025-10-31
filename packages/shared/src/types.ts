import { CharacterClass, Location, PaymentStatus, Currency } from './constants.js';

export interface Job {
  id: string;
  name: string;
  rewardGold: number;
  durationMinutes: number;
  requiredLevel?: number;
  requiredClass?: CharacterClass;
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  requiredLevel?: number;
  rewardGold: number;
  rewardItems?: string[];
}

export interface ArenaOpponent {
  id: string;
  name: string;
  level: number;
  class: CharacterClass;
  powerScore: number;
}

export interface BattleResult {
  winnerPlayerId: string;
  loserPlayerId: string;
  turns: number;
  damageDealtByWinner: number;
  lootGold?: number;
  endedAt: string; // ISO date
}

export interface Payment {
  id: string;
  playerId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  createdAt: string; // ISO date
}

export interface PlayerJob {
  playerId: string;
  jobId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string; // ISO date
  completedAt?: string; // ISO date
}

export interface Player {
  id: string;
  name: string;
  level: number;
  class: CharacterClass;
  location: Location;
  gold: number;
  activeJobs?: PlayerJob[];
  quests?: Quest[];
}

// Clans v1
export interface Clan {
  id: string;
  name: string;
  tag: string;
  bank: number;
}

export interface LeaderboardRow {
  userId: string;
  name: string;
  score: number;
}
