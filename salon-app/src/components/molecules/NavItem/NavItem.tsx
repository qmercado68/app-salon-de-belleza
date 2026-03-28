'use client';

import React from 'react';
import styles from './NavItem.module.css';
import {
  LayoutDashboard, Scissors, CalendarDays, User, Settings,
  ShieldCheck, Clock, CreditCard, BarChart3, Banknote, Package
} from 'lucide-react';

interface NavItemProps {
  label: string;
  icon: string;
  href: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  services: <Scissors size={20} />,
  appointments: <CalendarDays size={20} />,
  profile: <User size={20} />,
  admin: <ShieldCheck size={20} />,
  settings: <Settings size={20} />,
  history: <Clock size={20} />,
  payments: <CreditCard size={20} />,
  reports: <BarChart3 size={20} />,
  sales: <Banknote size={20} />,
  inventory: <Package size={20} />,
};

export default function NavItem({ label, icon, isActive = false, badge, onClick }: NavItemProps) {
  return (
    <button
      className={`${styles.navItem} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className={styles.icon}>{iconMap[icon] || <LayoutDashboard size={20} />}</span>
      <span className={styles.label}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={styles.badge}>{badge}</span>
      )}
      {isActive && <span className={styles.activeIndicator} />}
    </button>
  );
}
