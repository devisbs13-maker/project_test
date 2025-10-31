CREATE TABLE IF NOT EXISTS `classes` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `locations` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `quests` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `reward_gold` integer NOT NULL DEFAULT 0,
  `location_id` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_quests_location_id` ON `quests` (`location_id`);

