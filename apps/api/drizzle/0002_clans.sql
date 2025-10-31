-- Clans v0 schema
CREATE TABLE IF NOT EXISTS clans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  owner_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clan_members (
  clan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY (clan_id, user_id)
);

CREATE TABLE IF NOT EXISTS clan_scores_weekly (
  clan_id TEXT NOT NULL,
  week_key TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clan_id, week_key)
);

CREATE TABLE IF NOT EXISTS clan_quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target INTEGER NOT NULL,
  period TEXT NOT NULL,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clan_quests_state (
  clan_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clan_id, quest_id, period_key)
);

