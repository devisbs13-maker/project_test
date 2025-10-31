import { db } from './client.js';
import { players, jobs, classes, locations, quests, clanQuests } from './schema.js';
import { eq } from 'drizzle-orm';
import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sqlite } from './client.js';

async function main() {
  // Ensure migrations applied before seeding
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  migrate(sqlite, { migrationsFolder });

  // simple idempotent seed: upsert by id logic
  const seedPlayers = [
    { id: 'p1', name: 'Alice', level: 5, class: 'Warrior', gold: 100 },
    { id: 'p2', name: 'Bob', level: 3, class: 'Mage', gold: 50 },
  ];

  for (const p of seedPlayers) {
    const existing = db.select().from(players).where(eq(players.id, p.id)).all();
    if (existing.length === 0) {
      db.insert(players).values(p).run();
    } else {
      db.update(players).set(p).where(eq(players.id, p.id)).run();
    }
  }

  const seedJobs = [
    { id: 'job_lumberjack', name: 'Лесоруб', rewardGold: 15, durationMinutes: 20, requiredLevel: 1 },
    { id: 'job_fisher', name: 'Рыболов', rewardGold: 12, durationMinutes: 15, requiredLevel: 1 },
    { id: 'job_leshiy_hunter', name: 'Охотник на леших', rewardGold: 30, durationMinutes: 40, requiredLevel: 3 },
    { id: 'job_miner', name: 'Рудокоп', rewardGold: 25, durationMinutes: 35, requiredLevel: 2 },
  ];
  for (const j of seedJobs) {
    const existing = db.select().from(jobs).where(eq(jobs.id, j.id)).all();
    if (existing.length === 0) {
      db.insert(jobs).values(j).run();
    } else {
      db.update(jobs).set(j).where(eq(jobs.id, j.id)).run();
    }
  }

  // classes
  const seedClasses = [
    { id: 'vitiaz', name: 'Витязь' },
    { id: 'volhv', name: 'Волхв' },
    { id: 'ohotnik', name: 'Охотник' },
    { id: 'berserk', name: 'Берсерк' },
  ];
  for (const c of seedClasses) {
    const existing = db.select().from(classes).where(eq(classes.id, c.id)).all();
    if (existing.length === 0) {
      db.insert(classes).values(c).run();
    } else {
      db.update(classes).set(c).where(eq(classes.id, c.id)).run();
    }
  }

  // locations
  const seedLocations = [
    { id: 'bor', name: 'Бор' },
    { id: 'bolotya', name: 'Болотья' },
    { id: 'dolina', name: 'Долина' },
    { id: 'kurgany', name: 'Курганы' },
  ];
  for (const loc of seedLocations) {
    const existing = db.select().from(locations).where(eq(locations.id, loc.id)).all();
    if (existing.length === 0) {
      db.insert(locations).values(loc).run();
    } else {
      db.update(locations).set(loc).where(eq(locations.id, loc.id)).run();
    }
  }

  // quests: 5 per location
  for (const loc of seedLocations) {
    for (let i = 1; i <= 5; i++) {
      const q = {
        id: `${loc.id}_q${i}`,
        title: `Квест ${i}: ${loc.name}`,
        description: `Выполнить задание ${i} в локации ${loc.name}.`,
        rewardGold: 5 * i,
        locationId: loc.id,
      };
      const existing = db.select().from(quests).where(eq(quests.id, q.id)).all();
      if (existing.length === 0) {
        db.insert(quests).values(q).run();
      } else {
        db.update(quests).set(q).where(eq(quests.id, q.id)).run();
      }
    }
  }

  // clan quests catalog seed
  const cq = [
    { id: 'cq_daily_help', title: 'Помогите жителям (суммарно 50 очков сегодня)', target: 50, period: 'daily', rewardGold: 60, rewardXp: 30 },
    { id: 'cq_weekly_hunt', title: 'Охота на чудищ (суммарно 500 очков за неделю)', target: 500, period: 'weekly', rewardGold: 400, rewardXp: 200 },
  ];
  for (const q of cq) {
    const existing = db.select().from(clanQuests).where(eq(clanQuests.id, q.id)).all();
    if (existing.length === 0) {
      db.insert(clanQuests).values(q).run();
    } else {
      db.update(clanQuests).set(q).where(eq(clanQuests.id, q.id)).run();
    }
  }

  console.log('Seeding completed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
