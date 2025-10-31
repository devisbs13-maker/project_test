export const now = () => Date.now();
export const secs = (n:number) => n*1000;
export const remainingMs = (end:number) => Math.max(0, end - now());
export const formatRemaining = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}м ${r}с` : `${r}с`;
};
