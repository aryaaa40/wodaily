import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Asterisk, Inbox, LayoutGrid, Lightbulb } from 'lucide-react';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Kanban', Icon: LayoutGrid, end: true },
  { to: '/capture', label: 'Capture', Icon: Inbox, end: false },
  { to: '/learning', label: 'Learning', Icon: Lightbulb, end: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Asterisk size={20} strokeWidth={2.5} aria-hidden />
          <span className={styles.brandName}>Wodaily</span>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
              }
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      {action}
    </header>
  );
}
