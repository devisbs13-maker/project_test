-- Drizzle initial migration
CREATE TABLE IF NOT EXISTS `players` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `level` integer NOT NULL DEFAULT 1,
  `class` text NOT NULL,
  `gold` integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `jobs` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `reward_gold` integer NOT NULL DEFAULT 0,
  `duration_minutes` integer NOT NULL,
  `required_level` integer,
  `required_class` text
);

