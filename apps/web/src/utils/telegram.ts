export function getInitData(): string {
  const tg = (window as any).Telegram?.WebApp;
  const s = tg?.initData as string | undefined;
  return s || '';
}

