export type TGWebApp = typeof window.Telegram.WebApp;

export function getTG(): TGWebApp | null {
  if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function initTelegram() {
  const ensure = () => {
    const tg = getTG();
    if (!tg) return false;
    try {
      tg.ready?.();
      tg.expand?.();
      tg.setBackgroundColor?.('#0b0b0b');
    } catch {}
    return true;
  };
  // Try immediately; if SDK or object isn't ready yet, retry a few times
  if (ensure()) return;
  let tries = 0;
  const id = setInterval(() => {
    tries += 1;
    if (ensure() || tries > 40) clearInterval(id);
  }, 50);
}
