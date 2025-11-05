import { RU } from './ru';
import { EN } from './en';

export type Lang = 'ru' | 'en';
export function getLang(): Lang {
  try { const v = localStorage.getItem('mirevald:lang') as Lang | null; if (v === 'en' || v === 'ru') return v; } catch {}
  return 'ru';
}
export function setLang(l: Lang) {
  try { localStorage.setItem('mirevald:lang', l); } catch {}
}
export function getT() { return getLang() === 'en' ? EN : RU; }

