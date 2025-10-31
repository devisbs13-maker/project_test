import { z } from 'zod';
import { CharacterClass, Location, PaymentStatus, Currency } from './constants.js';

export const CharacterClassSchema = z.nativeEnum(CharacterClass);
export const LocationSchema = z.nativeEnum(Location);
export const PaymentStatusSchema = z.nativeEnum(PaymentStatus);
export const CurrencySchema = z.nativeEnum(Currency);

export const JobSchema = z.object({
  id: z.string(),
  name: z.string(),
  rewardGold: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  requiredLevel: z.number().int().positive().optional(),
  requiredClass: CharacterClassSchema.optional(),
});

export const QuestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  requiredLevel: z.number().int().positive().optional(),
  rewardGold: z.number().nonnegative(),
  rewardItems: z.array(z.string()).optional(),
});

export const ArenaOpponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().nonnegative(),
  class: CharacterClassSchema,
  powerScore: z.number().nonnegative(),
});

export const BattleResultSchema = z.object({
  winnerPlayerId: z.string(),
  loserPlayerId: z.string(),
  turns: z.number().int().positive(),
  damageDealtByWinner: z.number().nonnegative(),
  lootGold: z.number().nonnegative().optional(),
  endedAt: z.string(), // ISO date
});

export const PaymentSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  status: PaymentStatusSchema,
  createdAt: z.string(), // ISO date
});

export const PlayerJobSchema = z.object({
  playerId: z.string(),
  jobId: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  startedAt: z.string().optional(), // ISO date
  completedAt: z.string().optional(), // ISO date
});

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().nonnegative(),
  class: CharacterClassSchema,
  location: LocationSchema,
  gold: z.number().nonnegative(),
  activeJobs: z.array(PlayerJobSchema).optional(),
  quests: z.array(QuestSchema).optional(),
});

export type Job = z.infer<typeof JobSchema>;
export type Quest = z.infer<typeof QuestSchema>;
export type ArenaOpponent = z.infer<typeof ArenaOpponentSchema>;
export type BattleResult = z.infer<typeof BattleResultSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type PlayerJob = z.infer<typeof PlayerJobSchema>;
export type Player = z.infer<typeof PlayerSchema>;

