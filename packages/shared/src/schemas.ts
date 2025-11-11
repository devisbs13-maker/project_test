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

// Note: Do not re-export inferred types with names that clash with interfaces in types.ts
// Importers should use the explicit interfaces from types.ts or infer locally if needed.
