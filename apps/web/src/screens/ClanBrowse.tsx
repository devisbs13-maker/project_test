import { RU } from '../i18n/ru';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import type { Player } from '../store/player';
import { apiClanSearch, apiClanJoin } from '../utils/api';
import { loadSession } from '../store/session';

type Props = { player: Player; onBack: () => void };

export default function ClanBrowse({ player, onBack }: Props) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const r = await apiClanSearch(q, 20, 0);
      setRows((r && (r as any).items) ? (r as any).items : []);
    } catch (e) {
      setError('Р С›РЎв‚¬Р С‘Р В±Р С”Р В° Р В·Р В°Р С–РЎР‚РЎС“Р В·Р С”Р С‘');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = loadSession();
  return (
    <div style={{ display: 'grid', gap: 12, padding: 16 }}>
      <Header title={RU.clans.search} gold={player.gold} energy={player.energy} level={player.progress.level} onBack={onBack} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={q} onChange={(e) => setQ((e.target as any).value)} placeholder="Р СњР В°Р В·Р Р†Р В°Р Р…Р С‘Р Вµ Р С‘Р В»Р С‘ РЎвЂљР ВµР С–" style={{ flex: 1, padding: '8px 10px', borderRadius: 8 }} />
        <Button onClick={search} disabled={loading}>{loading ? 'Р СџР С•Р С‘РЎРѓР С”РІР‚В¦' : 'Р СњР В°Р в„–РЎвЂљР С‘'}</Button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {!loading && rows.length === 0 && !error && (
          <div style={{ opacity: .7 }}>Р СњР С‘РЎвЂЎР ВµР С–Р С• Р Р…Р Вµ Р Р…Р В°Р в„–Р Т‘Р ВµР Р…Р С•</div>
        )}
        {error && (
          <div style={{ color: '#f88' }}>Р СџРЎР‚Р С•Р В±Р В»Р ВµР СР В° РЎРѓ РЎРѓР ВµРЎвЂљРЎРЉРЎР‹. Р СџР С•Р С”Р В°Р В·Р В°Р Р…РЎвЂ№ Р СР С•Р С”-Р Т‘Р В°Р Р…Р Р…РЎвЂ№Р Вµ.</div>
        )}
        {rows.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{c.name} [{c.tag}]</div>
            </div>
            <Button disabled={!s} onClick={async () => { if (!s) return; await apiClanJoin(c.tag); alert('Р вЂ”Р В°РЎРЏР Р†Р С”Р В° Р С•РЎвЂљР С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…Р В°'); }}>Р вЂ™РЎРѓРЎвЂљРЎС“Р С—Р С‘РЎвЂљРЎРЉ</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

