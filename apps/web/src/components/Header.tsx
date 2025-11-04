type Props = { title?: string; gold: number; energy: number; level: number; onBack?: () => void; badgeTag?: string | null };
export default function Header({ title='Заголовок', gold, energy, level, onBack, badgeTag }: Props) {
  return (
    <div style={{
      display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:'12px 14px',borderRadius:16,
      background:'linear-gradient(180deg, var(--gold-weak2), rgba(255,255,255,0.02))',
      border:'1px solid var(--gold-weak)', boxShadow:'var(--shadow)'
    }}>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        {onBack ? <button onClick={onBack} aria-label="Назад" style={{opacity:.8}}>←</button> : null}
        <b>{title}</b>
        {badgeTag ? <span style={{fontSize:12, opacity:.9, padding:'2px 6px', border:'1px solid rgba(255,255,255,.2)', borderRadius:8}}>🏷 {badgeTag}</span> : null}
      </div>
      <div style={{display:'flex',gap:12,opacity:.9,fontSize:12}}>
        <span>⚡ {energy}</span>
        <span>🪙 {gold}</span>
        <span>ур. {level}</span>
      </div>
    </div>
  );
}

