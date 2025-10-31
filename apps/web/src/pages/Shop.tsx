import { useState } from 'react';
import WebApp from '@/lib/telegram';
import { api } from '@/lib/apiClient';
import { usePlayerStore } from '@/store/player';
import styles from '@/styles/Page.module.css';

type TabKey = 'decor' | 'utility' | 'chests';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'decor', label: 'РЈРєСЂР°С€РµРЅРёСЏ' },
  { key: 'utility', label: 'РЈРґРѕР±СЃС‚РІРѕ' },
  { key: 'chests', label: 'РЎСѓРЅРґСѓРєРё' },
];

type Item = { sku: string; name: string; price: number };

const catalog: Record<TabKey, Item[]> = {
  decor: [
    { sku: 'decor_avatar_frame_1', name: 'Р Р°РјРєР° Р°РІР°С‚Р°СЂР° I', price: 19 },
    { sku: 'decor_avatar_frame_2', name: 'Р Р°РјРєР° Р°РІР°С‚Р°СЂР° II', price: 39 },
  ],
  utility: [
    { sku: 'utility_extra_slot', name: 'Р”РѕРї. СЃР»РѕС‚ Р·Р°РґР°РЅРёСЏ', price: 49 },
    { sku: 'utility_speed_boost', name: 'РЈСЃРєРѕСЂРµРЅРёРµ СЂР°Р±РѕС‚', price: 29 },
  ],
  chests: [
    { sku: 'chest_small', name: 'РњР°Р»С‹Р№ СЃСѓРЅРґСѓРє', price: 25 },
    { sku: 'chest_big', name: 'Р‘РѕР»СЊС€РѕР№ СЃСѓРЅРґСѓРє', price: 75 },
  ],
};

async function openInvoice(slug: string): Promise<'paid' | 'cancelled' | 'failed'> {
  return new Promise((resolve) => {
    try {
      WebApp.openInvoice(slug, (status: any) => {
        resolve((status || 'failed') as any);
      });
    } catch (e) {
      console.debug('openInvoice fallback', e);
      // Outside Telegram вЂ” emulate success for dev
      resolve('paid');
    }
  });
}

export default function Shop() {
  const [tab, setTab] = useState<TabKey>('decor');
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  async function buy(item: Item) {
    const inv = await api.post<{ slug: string }>(`/payments/invoice`, { sku: item.sku });
    const status = await openInvoice(inv.slug);
    if (status === 'paid') {
      await api.post('/payments/confirm', { sku: item.sku, status });
      // refresh profile
      const me = await api.get('/me');
      setPlayer(me as any);
      WebApp.HapticFeedback?.notificationOccurred?.('success');
    } else {
      WebApp.HapticFeedback?.notificationOccurred?.('error');
    }
  }

  return (
    <div className={styles.page}>
      <h1>РњР°РіР°Р·РёРЅ</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: tab === t.key ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'inherit' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {catalog[tab].map((it) => (
          <li key={it.sku} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
            <div>
              <div>{it.name}</div>
              <div style={{ fontSize: 12, color: 'var(--hint-color)' }}>{it.price} XTR</div>
            </div>
            <button onClick={() => buy(it)} style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--button-color)', color: 'var(--button-text-color)', border: 'none' }}>
              РљСѓРїРёС‚СЊ
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
