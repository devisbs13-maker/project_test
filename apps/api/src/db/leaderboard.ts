import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const lbPlayers = sqliteTable('lb_players', {
  id: text('id').primaryKey(), // Telegram user id as string
  name: text('name').notNull(),
  username: text('username'),
  createdAt: integer('created_at').notNull(),
});

export const lbScoresAll = sqliteTable('lb_scores_all', {
  userId: text('user_id').primaryKey(),
  score: integer('score').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
});

export const lbScoresWeekly = sqliteTable('lb_scores_weekly', {
  userId: text('user_id').notNull(),
  weekKey: text('week_key').notNull(),
  score: integer('score').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
}, (t) => ({
  pk: { columns: [t.userId, t.weekKey], primary: true },
}));

