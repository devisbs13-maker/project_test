import { getInitData } from './telegram';
import type { Session } from '../store/session';
import { saveSession, loadSession } from '../store/session';
import type { ClanCreateRequest, ClanJoinRequest, ClanContributeRequest, ClanCreateResponse, ClanJoinResponse, ClanContributeResponse, ClanMeResponse, LeaderboardRow } from '@repo/shared';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:4000';

export async function apiVerifyAuth(): Promise<Session | null> {
  try {
    const initData = getInitData();
    if (!initData) return null;
    const res = await fetch(`${API_BASE}/auth/verify`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ initData }) });
    const data = await res.json();
    if (data?.ok && data.userId) {
      const s: Session = { userId: data.userId, name: data.name, username: data.username };
      saveSession(s);
      return s;
    }
  } catch {}
  return null;
}

// Helper to attach current user via headers
function withUserHeaders(init?: RequestInit): RequestInit {
  const s = loadSession();
  const uname = s?.name ? encodeURIComponent(s.name) : 'guest';
  return {
    ...(init || {}),
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': s?.userId || 'local-user',
      'x-user-name': uname,
      'x-telegram-init': getInitData() || '',
      ...(init?.headers || {}),
    },
  };
}

// Weekly leaderboard
export async function getWeeklyLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const res = await fetch(`${API_BASE}/leaderboard/weekly?limit=${limit}`, withUserHeaders());
  return res.json();
}

export async function postScoreTick(delta: number, reason: string): Promise<{ ok: boolean; data?: { score: number }; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/score/tick`, withUserHeaders({ method: 'POST', body: JSON.stringify({ delta, reason }) }));
    return res.json();
  } catch { return { ok: false, error: 'network' }; }
}

// Back-compat wrappers used elsewhere in the app
export async function submitScoreTick(_userId: string, value: number) {
  await postScoreTick(value, 'legacy');
}

export async function fetchLeaderboard(kind: 'weekly'|'alltime', limit = 20) {
  const res = await fetch(`${API_BASE}/leaderboard/${kind}?limit=${limit}`);
  return res.json();
}

// Helper to parse JSON and normalize errors
async function jsonOrError<T>(res: Response): Promise<T> {
  try {
    const data = await res.json();
    if (!res.ok) {
      const err = (data as any)?.error || `HTTP ${res.status}`;
      return { ok: false, error: err } as any;
    }
    return data as T;
  } catch {
    return { ok: false, error: 'network' } as any;
  }
}

// Clans v1 API (header-based user)
export async function apiClanMe(): Promise<ClanMeResponse> {
  const res = await fetch(`${API_BASE}/clan/me`, withUserHeaders());
  const data = await jsonOrError<ClanMeResponse>(res);
  try {
    if (data?.ok && data?.data) localStorage.setItem('mirevald:clan', JSON.stringify(data.data));
    else localStorage.removeItem('mirevald:clan');
  } catch {}
  return data;
}

export async function apiClanCreate(name: string, tag: string): Promise<ClanCreateResponse> {
  const body: ClanCreateRequest = { name, tag };
  const res = await fetch(`${API_BASE}/clan/create`, withUserHeaders({ method: 'POST', body: JSON.stringify(body) }));
  return jsonOrError<ClanCreateResponse>(res);
}

export async function apiClanJoin(idOrTag: string): Promise<ClanJoinResponse> {
  // Accept either clanId or tag; send both for compatibility
  const body: any = { clanId: idOrTag, tag: idOrTag } as ClanJoinRequest & { clanId?: string };
  const res = await fetch(`${API_BASE}/clan/join`, withUserHeaders({ method: 'POST', body: JSON.stringify(body) }));
  return jsonOrError<ClanJoinResponse>(res);
}

export async function apiClanContribute(amount: number): Promise<ClanContributeResponse> {
  const body: ClanContributeRequest = { amount };
  const res = await fetch(`${API_BASE}/clan/contribute`, withUserHeaders({ method: 'POST', body: JSON.stringify(body) }));
  return jsonOrError<ClanContributeResponse>(res);
}

// New: members/roles
export async function apiClanMembers() {
  const res = await fetch(`${API_BASE}/clan/members`, withUserHeaders());
  return jsonOrError(res);
}

export async function apiClanSetRole(userId: string, role: 'leader'|'novice'|'warden'|'seer') {
  const res = await fetch(`${API_BASE}/clan/role`, withUserHeaders({ method:'POST', body: JSON.stringify({ userId, role }) }));
  return jsonOrError(res);
}

export async function apiClanKick(userId: string) {
  const res = await fetch(`${API_BASE}/clan/kick`, withUserHeaders({ method:'POST', body: JSON.stringify({ userId }) }));
  return jsonOrError(res);
}

export async function apiClanLeave() {
  const res = await fetch(`${API_BASE}/clan/leave`, withUserHeaders({ method:'POST' }));
  return jsonOrError(res);
}

// Clan search API (with mock fallback)
export type ClanSummary = {
  id: string;
  tag: string;
  name: string;
  members: number;
  power: number;
};

export type ClanSearchResponse = {
  items: ClanSummary[];
  total: number;
};

export async function apiClanSearch(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<ClanSearchResponse> {
  const url = `${API_BASE}/clan/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ClanSearchResponse;
  } catch {
    // Fallback mock so the UI works without backend
    const all: ClanSummary[] = [
      { id: '1', tag: 'WGN', name: 'WarGeneration', members: 7, power: 1234 },
      { id: '2', tag: 'MIR', name: 'Mirevald Guard', members: 12, power: 2031 },
      { id: '3', tag: 'VOL', name: 'Volkhvy', members: 5, power: 890 },
    ];
    const filtered = all.filter(c =>
      c.name.toLowerCase().includes((query || '').toLowerCase()) ||
      c.tag.toLowerCase().includes((query || '').toLowerCase())
    );
    return { items: filtered.slice(offset, offset + limit), total: filtered.length };
  }
}




// Player persistence (DB-backed)
export async function apiPlayerMe(): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/player/me`, withUserHeaders());
    return jsonOrError(res);
  } catch { return { ok:false, error:'network' }; }
}

export async function apiPlayerSave(snapshot: any): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const body = typeof snapshot === 'object' && snapshot && !('data' in snapshot) ? { data: snapshot } : snapshot;
    const res = await fetch(`${API_BASE}/player/save`, withUserHeaders({ method:'POST', body: JSON.stringify(body) }));
    return jsonOrError(res);
  } catch { return { ok:false, error:'network' }; }
}


