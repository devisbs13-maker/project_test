export function getInitData(): string {
  const tg = (window as any).Telegram?.WebApp;
  const s = tg?.initData as string | undefined;
  return s || '';
}

export function parseInitData(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (raw || '').split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const k = i >= 0 ? part.slice(0, i) : part;
    const v = i >= 0 ? part.slice(i + 1) : '';
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

export function getTelegramUser(): { id: number; username?: string; first_name?: string; last_name?: string } | null {
  try {
    const raw = getInitData();
    if (!raw) return null;
    const parsed = parseInitData(raw);
    if (!parsed.user) return null;
    const user = JSON.parse(parsed.user);
    if (!user || typeof user !== 'object') return null;
    return user;
  } catch { return null; }
}
