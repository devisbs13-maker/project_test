export type CompletePayload = {
  type: 'task_complete';
  kind: 'quest' | 'job';
  title: string;
  reward: { gold?: number; xp?: number; energy?: number };
};

export function showToast(text: string) {
  let box = document.getElementById('mire-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'mire-toast';
    box.style.cssText =
      'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
      'max-width:80vw;padding:10px 14px;border-radius:12px;' +
      'background:rgba(18,18,20,.92);color:#e8eef5;border:1px solid rgba(255,255,255,.08);' +
      'box-shadow:0 10px 30px rgba(0,0,0,.4);font-size:14px;z-index:9999;opacity:0;transition:.2s;';
    document.body.appendChild(box);
  }
  box.textContent = text;
  (box as HTMLElement).style.opacity = '1';
  setTimeout(() => ((box as HTMLElement)!.style.opacity = '0'), 2500);
}

export async function notifyBrowser(title: string, body: string) {
  if (!('Notification' in window)) return;
  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {}
}

export function notifyTelegram(payload: CompletePayload) {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg || typeof tg.sendData !== 'function') return;
  try {
    tg.sendData(JSON.stringify(payload));
  } catch {}
}

export function notifyAll(kind: 'quest'|'job', title: string, reward: {gold?:number; xp?:number; energy?:number}) {
  const prefix = kind === 'quest' ? 'Квест' : 'Работа';
  const nice = `${prefix}: ${title} • +${reward.gold ?? 0} зол., +${reward.xp ?? 0} XP${reward.energy ? `, энергия +${reward.energy}` : ''}`;
  showToast(nice);
  notifyBrowser(prefix, `${title}. Награда: золото ${reward.gold ?? 0}, XP ${reward.xp ?? 0}${reward.energy ? `, энергия ${reward.energy}` : ''}.`);
  notifyTelegram({ type:'task_complete', kind, title, reward });
}
