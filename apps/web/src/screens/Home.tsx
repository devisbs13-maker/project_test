import Header from '../components/Header';
import Button from '../components/Button';
import { RU } from '../i18n/ru';
import { Player } from '../store/player';
import s from './Home.module.css';
import { CLASS_ASSETS } from '../assets/classes';
import PortraitCard from '../components/PortraitCard';
import { useEffect, useState } from 'react';

type Props = {
  player: Player;
  onOpenQuests: () => void;
  onOpenJobs: () => void;
  onOpenArena: () => void;
  onOpenGuild: () => void;
  onOpenCharacter: () => void;
  setScreen?: (s: string) => void;
  onUpdatePlayer?: (p: Player) => void;
};

export default function Home({ player, onOpenQuests, onOpenJobs, onOpenArena, onOpenGuild, onOpenCharacter, setScreen }: Props) {
  const cls = CLASS_ASSETS[player.classId];
  const [clanTag, setClanTag] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    import('../utils/api').then(async ({ apiClanMe }) => {
      try {
        const res = await apiClanMe();
        if (!done && res?.ok && res.data) setClanTag(res.data.tag);
      } catch {}
    });
    return () => { done = true; };
  }, []);

  return (
    <div className={s.wrap}>
      <Header title={RU.title} gold={player.gold} energy={player.energy} level={player.progress.level} badgeTag={clanTag} />

      <section className={`${s.panel} ${s.panelGlow} ${s.appear}`}>
        <PortraitCard
          img={cls.img}
          title={cls.title}
          subtitle={`${cls.desc}. ${RU.stats.level} ${player.progress.level} • ${RU.stats.energy}: ${player.energy}/${player.energyMax}`}
          size="md"
          rightSlot={
            <div style={{display:'flex', gap:8}}>
              <Button className={s.btnFull} onClick={() => setScreen?.('square')}>{RU.navWhere}</Button>
              <Button className={s.btnFull} onClick={onOpenCharacter}>{RU.buttons.character}</Button>
            </div>
          }
        />
      </section>

      <section className={`${s.panel} ${s.panelGlow} ${s.appear}`}>
        <div className={s.titleRow}><span style={{opacity:.85}}>{RU.navWhere}</span></div>
        <div className={s.buttonList}>
          <Button className={s.btnFull} onClick={() => { setScreen?.('quests'); onOpenQuests(); }}>{RU.buttons.quests}</Button>
          <Button className={s.btnFull} onClick={() => { setScreen?.('jobs'); onOpenJobs(); }}>{RU.buttons.jobs}</Button>
          <Button className={s.btnFull} onClick={() => setScreen?.('merchant')}>Торговец</Button>
          <Button className={s.btnFull} onClick={() => setScreen?.('leaderboard')}>Таблица лидеров</Button>
          <Button className={s.btnFull} onClick={onOpenArena}>{RU.buttons.arena}</Button>
          <Button className={s.btnFull} onClick={onOpenGuild}>{RU.buttons.guild}</Button>
        </div>
      </section>
    </div>
  );
}
