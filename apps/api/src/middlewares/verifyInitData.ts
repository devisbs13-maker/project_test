import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { db } from '../db/client.js';
import { players } from '../db/schema.js';
import { eq } from 'drizzle-orm';

function parseInitData(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of raw.split('&')) {
    if (!part) continue;
    const idx = part.indexOf('=');
    const k = idx >= 0 ? part.slice(0, idx) : part;
    const v = idx >= 0 ? part.slice(idx + 1) : '';
    const key = decodeURIComponent(k);
    const val = decodeURIComponent(v);
    out[key] = val;
  }
  return out;
}

function verifySignature(initData: Record<string, string>, botToken: string): boolean {
  const providedHash = initData['hash'];
  if (!providedHash) return false;

  const data: string[] = [];
  for (const [k, v] of Object.entries(initData)) {
    if (k === 'hash') continue;
    data.push(`${k}=${v}`);
  }
  data.sort();
  const dataCheckString = data.join('\n');

  const secretKey = crypto.createHmac('sha256', botToken).update('WebAppData').digest();
  const hex = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return hex === providedHash.toLowerCase();
}

async function ensurePlayer(userPayload: any): Promise<string> {
  const tgId: string = String(userPayload?.id ?? '');
  if (!tgId) throw new Error('Invalid telegram user id');
  const existing = db.select().from(players).where(eq(players.id, tgId)).all();
  if (existing.length > 0) return existing[0].id;

  const name = [userPayload?.first_name, userPayload?.last_name].filter(Boolean).join(' ') ||
    userPayload?.username || `tg_${tgId}`;
  db.insert(players).values({ id: tgId, name, level: 1, class: 'Warrior', gold: 0 }).run();
  return tgId;
}

export async function verifyInitData(app: FastifyInstance) {
  app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    // Allow unauthenticated health checks
    if (req.method === 'GET' && req.url.startsWith('/healthz')) return;
    if (req.method === 'POST' && req.url.startsWith('/auth/verify')) return;

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    if (!botToken) {
      app.log.error('TELEGRAM_BOT_TOKEN is not set');
      reply.code(500).send({ error: 'Server misconfiguration' });
      return;
    }

    const bypass = String(process.env.TELEGRAM_AUTH_BYPASS || '').toLowerCase() === 'true';

    const header = (req.headers['x-telegram-init']
      ?? req.headers['x-telegram-initdata']
      ?? req.headers['x-telegram-init-data']) as string | undefined;

    if ((!header || Array.isArray(header)) && !bypass) {
      reply.code(401).send({ error: 'Missing X-Telegram-Init' });
      return;
    }

    let parsed: Record<string, string> = {};
    if (header) parsed = parseInitData(header);
    if (!bypass) {
      if (!verifySignature(parsed, botToken)) {
        reply.code(401).send({ error: 'Invalid initData signature' });
        return;
      }
    }

    let userPayload: any = undefined;
    try {
      if (parsed.user) userPayload = JSON.parse(parsed.user);
    } catch (e) {
      app.log.warn({ err: e }, 'Failed to parse user payload');
    }
    try {
      const playerId = userPayload ? await ensurePlayer(userPayload) : 'local-user';
      // attach to request
      // @ts-expect-error augmented via declaration merging
      req.playerId = playerId;
      // @ts-expect-error augmented via declaration merging
      req.tgUserId = String(userPayload?.id || 'local-user');
      // @ts-expect-error augmented via declaration merging
      req.tgUserName = [userPayload?.first_name, userPayload?.last_name].filter(Boolean).join(' ') || userPayload?.username || 'Путник';
      req.log.info({ tgUserId: req.tgUserId, tgUserName: req.tgUserName }, 'auth');
    } catch (e) {
      app.log.error({ err: e }, 'Failed to ensure player');
      reply.code(500).send({ error: 'Failed to process player' });
      return;
    }
  });
}
