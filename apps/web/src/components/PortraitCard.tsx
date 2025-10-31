import type { ReactNode } from 'react';
import s from './PortraitCard.module.css';

type Props = {
  img: string;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg';     // md РґР»СЏ Home, lg РґР»СЏ Character
  rightSlot?: ReactNode;  // РєРЅРѕРїРєРё/РґРѕРї.РєРѕРЅС‚РµРЅС‚ РїРѕРґ С‚РёС‚СѓР»РѕРј
};

export default function PortraitCard({ img, title, subtitle, size='md', rightSlot }: Props) {
  const cssSize = size === 'lg' ? 'var(--hero-thumb-size-lg)' : 'var(--hero-thumb-size-md)';
  return (
    <div className={s.card} style={{ ['--size' as any]: cssSize }}>
      <div className={s.thumb}>
        <img className={s.img} src={img} alt={title} />
      </div>
      <div className={s.meta}>
        <div className={s.title}>{title}</div>
        {subtitle ? <div className={s.desc}>{subtitle}</div> : null}
        {rightSlot}
      </div>
    </div>
  );
}

