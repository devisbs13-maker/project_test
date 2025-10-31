import crypto from 'node:crypto';

export function parseInitData(raw: string): Record<string, string> {
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

export function verifyInitData(initData: string, botToken: string): { ok: boolean; user?: any } {
  try {
    const parsed = parseInitData(initData);
    const providedHash = parsed['hash'];
    if (!providedHash) return { ok: false };
    const data: string[] = [];
    for (const [k, v] of Object.entries(parsed)) {
      if (k === 'hash') continue;
      data.push(`${k}=${v}`);
    }
    data.sort();
    const dataCheckString = data.join('\n');
    const secretKey = crypto.createHmac('sha256', botToken).update('WebAppData').digest();
    const hex = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (hex !== providedHash.toLowerCase()) return { ok: false };
    let user: any = undefined;
    if (parsed.user) user = JSON.parse(parsed.user);
    return { ok: true, user };
  } catch {
    return { ok: false };
  }
}

