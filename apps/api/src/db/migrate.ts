import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sqlite } from './client.js';
import path from 'node:path';

async function main() {
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  migrate(sqlite, { migrationsFolder });
  console.log('Migrations applied');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

