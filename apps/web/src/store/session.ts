export type Session = { userId: string; name: string; username?: string | null };

const KEY = 'mirevald:session';

export function loadSession(): Session | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Session : null; } catch { return null; }
}
export function saveSession(s: Session) { localStorage.setItem(KEY, JSON.stringify(s)); }

// Dev helper: ensure there is a local session and seed a default player
// Respects VITE_DEV_SESSION toggle (default on). Set VITE_DEV_SESSION=0 to disable.
export function ensureDevSession(): void {
  try {
    // toggle (default enabled)
    const flag = (import.meta as any)?.env?.VITE_DEV_SESSION;
    if (String(flag ?? '1') === '0') return;

    const existing = loadSession();
    if (!existing) {
      const dev: any = {
        userId: 'dev',
        name: 'Р’РѕРёРЅ',
        username: null,
        player: {
          id: 'dev',
          name: 'Р’РѕРёРЅ',
          class: 'warrior',
          level: 1,
          energy: 10,
          energyMax: 10,
          portrait: '/assets/warrior.png',
        },
        progress: { level: 1, xp: 0, xpToNext: 50 },
        wallet: { gold: 100 },
        stats: { str: 5, agi: 3, int: 2 },
      };
      saveSession(dev as Session);
    }
  } catch {}
}

