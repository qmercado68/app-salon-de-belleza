'use client';

import React from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import styles from './Header.module.css';
import SearchBar from '@/components/molecules/SearchBar/SearchBar';
import Avatar from '@/components/atoms/Avatar/Avatar';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName: string;
  onMenuToggle?: () => void;
  notificationCount?: number;
}

export default function Header({
  title,
  subtitle,
  userName,
  onMenuToggle,
  notificationCount = 0,
}: HeaderProps) {
  const [isDark, setIsDark] = React.useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.right}>
        <SearchBar />
        <button
          className={styles.iconBtn}
          onClick={() => setIsDark(!isDark)}
          title="Cambiar tema"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className={styles.iconBtn} title="Notificaciones">
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className={styles.badge}>{notificationCount}</span>
          )}
        </button>
        <div className={styles.userArea}>
          <Avatar name={userName} size="sm" />
        </div>
      </div>
    </header>
  );
}
