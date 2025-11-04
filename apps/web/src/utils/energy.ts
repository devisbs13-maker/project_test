export function notifyEnergyFull() {
  try {
    // Toast
    const evt = new CustomEvent('mire:toast', { detail: 'Энергия полная ⚡' });
    window.dispatchEvent(evt);
    // Fallback toast if no listener
    const el = document.getElementById('mire-toast');
    if (el) { el.textContent = 'Энергия полная ⚡'; (el as HTMLElement).style.opacity = '1'; setTimeout(()=>((el as HTMLElement).style.opacity='0'), 2500); }
  } catch {}
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') new Notification('Энергия', { body: 'Энергия полная' });
      else if (Notification.permission === 'default') Notification.requestPermission();
    }
  } catch {}
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && typeof tg.sendData === 'function') {
      tg.sendData(JSON.stringify({ type: 'energy_full' }));
    }
  } catch {}
}

export function msToNextEnergy(lastEnergyTs: number, intervalMs: number, energy: number, energyMax: number, now: number = Date.now()): number {
  if (energy >= energyMax) return 0;
  const elapsed = Math.max(0, now - (lastEnergyTs || now));
  const rem = intervalMs - (elapsed % intervalMs);
  return rem === intervalMs ? 0 : rem;
}

