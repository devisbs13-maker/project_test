import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  level: integer('level').notNull().default(1),
  class: text('class').notNull(),
  gold: integer('gold').notNull().default(0),
});

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rewardGold: integer('reward_gold').notNull().default(0),
  durationMinutes: integer('duration_minutes').notNull(),
  requiredLevel: integer('required_level'),
  requiredClass: text('required_class'),
});

export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(), // slug/code
  name: text('name').notNull(),
});

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(), // slug/code
  name: text('name').notNull(),
});

export const quests = sqliteTable('quests', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  rewardGold: integer('reward_gold').notNull().default(0),
  locationId: text('location_id').notNull(),
});

// Clans v0
export const clans = sqliteTable('clans', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  tag: text('tag').notNull().unique(),
  createdAt: integer('created_at').notNull(),
  ownerId: text('owner_id').notNull(),
});

export const clanMembers = sqliteTable('clan_members', {
  clanId: text('clan_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(), // 'owner'|'officer'|'member'
});

export const clanScoresWeekly = sqliteTable('clan_scores_weekly', {
  clanId: text('clan_id').notNull(),
  weekKey: text('week_key').notNull(),
  score: integer('score').notNull().default(0),
});

export const clanQuests = sqliteTable('clan_quests', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  target: integer('target').notNull(),
  period: text('period').notNull(), // 'daily'|'weekly'
  rewardGold: integer('reward_gold').notNull().default(0),
  rewardXp: integer('reward_xp').notNull().default(0),
});

export const clanQuestsState = sqliteTable('clan_quests_state', {
  clanId: text('clan_id').notNull(),
  questId: text('quest_id').notNull(),
  periodKey: text('period_key').notNull(), // YYYY-MM-DD or YYYY-WW
  progress: integer('progress').notNull().default(0),
  completed: integer('completed').notNull().default(0), // 0/1
});
