export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

// POST /clan/create
export type ClanCreateRequest = { name: string; tag: string };
export type ClanCreateResponse = ApiResponse<{ id: string; name: string; tag: string; bank: number }>;

// POST /clan/join
export type ClanJoinRequest = { tag: string };
export type ClanJoinResponse = ApiResponse<{ id: string; name: string; tag: string; bank: number }>;

// GET /clan/me
export type ClanMeResponse = ApiResponse<{ id: string; name: string; tag: string; bank: number } | null>;

// POST /clan/contribute
export type ClanContributeRequest = { amount: number };
export type ClanContributeResponse = ApiResponse<{ bank: number }>;

