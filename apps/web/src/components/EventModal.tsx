import React from 'react';
import Button from './Button';

type Props = {
  open: boolean;
  title: string;
  text: string;
  art?: string;
  choices: { id: string; label: string; onPick: () => void }[];
  onClose: () => void;
};

export default function EventModal({ open, title, text, art, choices, onClose }: Props) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, display:'grid', placeItems:'center', zIndex:1000,
      background:'rgba(0,0,0,0.55)', backdropFilter:'blur(2px)'
    }}>
      <div style={{
        width:'min(720px, 92vw)', borderRadius:16, padding:16,
        background:'var(--panel-bg)', border:'var(--panel-border)', boxShadow:'var(--shadow)',
        display:'grid', gap:12
      }}>
        {art && (
          <div style={{ overflow:'hidden', borderRadius:12, height:180 }}>
            <img src={art} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
          </div>
        )}
        <div style={{ fontSize:18, fontWeight:700 }}>{title}</div>
        <div style={{ opacity:.9, lineHeight:1.5 }}>{text}</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {choices.map((c) => (
            <Button key={c.id} onClick={c.onPick}>{c.label}</Button>
          ))}
          <div style={{flex:1}} />
          <Button onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  );
}

