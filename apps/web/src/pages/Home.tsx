import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 16, color: '#e8eef5', display:'grid', gap:12 }}>
      <h1 style={{margin:0}}>MIREVALD</h1>
      <p>РљСѓРґР° РЅР°РїСЂР°РІРёРјСЃСЏ?.</p>
      <div style={{display:'grid', gap:8, maxWidth: 320}}>
        <button onClick={() => navigate('/quests')}>РљРІРµСЃС‚С‹</button>
        <button onClick={() => navigate('/jobs')}>Р Р°Р±РѕС‚Р°</button>
        <button onClick={() => navigate('/character')}>РџРµСЂСЃРѕРЅР°Р¶</button>
        <button onClick={() => navigate('/leaderboard')}>Р›РёРґРµСЂС‹</button>
        <button onClick={() => navigate('/clan')}>РљР»Р°РЅ</button>
      </div>
    </div>
  );
}
