type Props = { label: string; value: number; max: number };
export default function StatBar({ label, value, max }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div style={{display:'grid', gap:6}}>
      <div style={{fontSize:12, opacity:.9}}>{label}: {value}/{max}</div>
      <div style={{height:8, borderRadius:8, background:'rgba(255,255,255,0.06)', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{width:`${pct}%`, height:'100%', background:'linear-gradient(90deg, rgba(216,180,106,0.6), rgba(216,180,106,0.9))'}} />
      </div>
    </div>
  );
}
