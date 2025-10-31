import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASE = path.join(ROOT, 'apps', 'web', 'src');
const exts = new Set(['.ts', '.tsx', '.css', '.html']);
const BOM = '\uFEFF';

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function run() {
  let count = 0;
  try {
    for await (const file of walk(BASE)) {
      const ext = path.extname(file).toLowerCase();
      if (!exts.has(ext)) continue;
      const buf = await fs.readFile(file);
      let text = buf.toString('utf8');
      if (text.startsWith(BOM)) {
        text = text.slice(1);
        await fs.writeFile(file, text, { encoding: 'utf8' });
        console.log(`Stripped BOM: ${path.relative(ROOT, file)}`);
        count++;
      }
    }
    console.log(`Done. Files updated: ${count}`);
  } catch (err) {
    console.error('strip-bom failed:', err);
    process.exitCode = 1;
  }
}

await run();

