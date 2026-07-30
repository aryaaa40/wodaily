import type { StatusMeta } from '../lib/status';
import styles from './StatusPill.module.css';

interface StatusPillProps {
  meta: StatusMeta;
  size?: 'sm' | 'md';
}

export function StatusPill({ meta, size = 'md' }: StatusPillProps) {
  const { label, tone, Icon } = meta;
  return (
    <span className={`${styles.pill} ${styles[tone]} ${styles[size]}`}>
      <Icon size={size === 'sm' ? 12 : 14} aria-hidden />
      {label}
    </span>
  );
}
