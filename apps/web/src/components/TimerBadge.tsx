import { useEffect, useState } from 'react';
import { remainingMs, formatRemaining } from '../utils/time';

export default function TimerBadge({ endsAt }: { endsAt: number }) {
  const [left, setLeft] = useState(remainingMs(endsAt));
  useEffect(() => {
    const id = setInterval(() => setLeft(remainingMs(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return (
    <span style={{
      padding:'4px 8px', borderRadius:10,
      border:'1px solid rgba(255,255,255,0.1)',
      background:'var(--panel-bg)'
    }}>
      Осталось: {formatRemaining(left)}
    </span>
  );
}
