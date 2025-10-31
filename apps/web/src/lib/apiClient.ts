export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private get initData(): string | undefined {
    try {
      return window?.Telegram?.WebApp?.initData;
    } catch {
      return undefined;
    }
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(this.base(path), {
      ...init,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init': this.initData ?? '',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const res = await fetch(this.base(path), {
      ...init,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init': this.initData ?? '',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  }

  private base(path: string): string {
    const trimmed = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl.replace(/\/$/, '')}/${trimmed}`;
  }
}

export const api = new ApiClient(import.meta.env.VITE_API_URL || '');
