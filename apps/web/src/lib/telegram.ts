export type TGWebApp = typeof window.Telegram.WebApp;

export function getTG(): TGWebApp | null {
  if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function initTelegram() {
  const tg = getTG();
  if (!tg) return;
  try {
    // Signal to Telegram that the app is ready to be shown
    // This removes the initial black placeholder in the WebView
    tg.ready?.();
    tg.expand();
    tg.setBackgroundColor('#0b0b0b');
  } catch {
    // ignore outside Telegram
  }
}
