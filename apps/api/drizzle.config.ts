import type { Config } from 'drizzle-kit';
import path from 'node:path';

export default {
  schema: path.resolve('src/db/schema.ts'),
  out: path.resolve('drizzle'),
  dialect: 'sqlite',
  dbCredentials: {
    url: path.resolve('dev.sqlite'),
  },
} satisfies Config;

