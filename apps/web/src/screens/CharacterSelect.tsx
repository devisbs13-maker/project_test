import { useState } from 'react';
import styles from './CharacterSelect.module.css';
import type { ClassId } from '../store/player';

type Props = { onBack: () => void; onConfirm: (classId: ClassId) => void };

const heroes: Array<{ key: ClassId; img: string; title: string; desc: string }> = [
  { key: 'warrior', img: '/images/warrior.png', title: 'Р’РѕРёРЅ', desc: 'СЃРёР»Р°, С‡РµСЃС‚СЊ, Р±Р»РёР¶РЅРёР№ Р±РѕР№' },
  { key: 'volkhv', img: '/images/mage.png', title: 'Р’РѕР»С…РІ', desc: 'РјСѓРґСЂРѕСЃС‚СЊ, РјР°РіРёСЏ, СЃСѓРґСЊР±Р°' },
  { key: 'hunter', img: '/images/hunter.png', title: 'РћС…РѕС‚РЅРёРє', desc: 'Р»РѕРІРєРѕСЃС‚СЊ, РјРµС‚РєРѕСЃС‚СЊ, РїСЂРёСЂРѕРґР°' },
];

export default function CharacterSelect({ onBack, onConfirm }: Props) {
  const [selectedHero, setSelectedHero] = useState<ClassId | null>(null);

  const handleConfirm = () => {
    if (!selectedHero) return;
    onConfirm(selectedHero);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>Р’С‹Р±РµСЂРё РєР»Р°СЃСЃ</div>
      <div className={styles.grid}>
        {heroes.map((h) => (
          <button
            key={h.key}
            className={`${styles.card} ${selectedHero === h.key ? styles.selected : ''}`}
            onClick={() => setSelectedHero(h.key)}
          >
            <img className={styles.heroImage} src={h.img} alt={h.title} />
            <div className={styles.title}>{h.title}</div>
            <div className={styles.desc}>{h.desc}</div>
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>РќР°Р·Р°Рґ</button>
        <button className={styles.confirmBtn} disabled={!selectedHero} onClick={handleConfirm}>РџРѕРґС‚РІРµСЂРґРёС‚СЊ РІС‹Р±РѕСЂ</button>
      </div>
    </div>
  );
}
