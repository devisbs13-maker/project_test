import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASE = path.join(ROOT, 'apps', 'web', 'src');
const exts = new Set(['.ts', '.tsx', '.css', '.md', '.html']);

function looksMojibake(s) {
  // Heuristics: contains these glyphs typical for mis-decoded UTF-8
  return /[РЃСЂСЊСЌвЂ�”“]/.test(s);
}

function decodeMojibake(text) {
  try {
    // Typical fix for UTF-8 read as cp1251 then re-encoded
    // eslint-disable-next-line no-escape
    const repaired = decodeURIComponent(escape(text));
    // Accept only if Cyrillic count increases notably
    const before = (text.match(/[\u0400-\u04FF]/g) || []).length;
    const after = (repaired.match(/[\u0400-\u04FF]/g) || []).length;
    if (after >= before + 3 && repaired !== text) return repaired;
  } catch {}
  return null;
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function run() {
  let changed = 0;
  for await (const file of walk(BASE)) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.has(ext)) continue;
    const buf = await fs.readFile(file);
    const text = buf.toString('utf8');
    if (!looksMojibake(text)) continue;
    const repaired = decodeMojibake(text);
    if (repaired) {
      await fs.writeFile(file, repaired, { encoding: 'utf8' });
      console.log('fixed:', path.relative(ROOT, file));
      changed++;
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

run().catch((e)=>{ console.error(e); process.exit(1); });
