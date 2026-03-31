'use client';

import React from 'react';
import { Scissors, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';
import NavItem from '@/components/molecules/NavItem/NavItem';
import Avatar from '@/components/atoms/Avatar/Avatar';
import { NavItemData } from '@/lib/types';
import { CONFIG } from '@/lib/config';


interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
  userName: string;
  userRole: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const navItems: NavItemData[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { id: 'pos', label: 'Punto de Venta', icon: 'sales', href: '/pos' },
  { id: 'services', label: 'Servicios', icon: 'services', href: '/services' },
  { id: 'appointments', label: 'Mis Citas', icon: 'appointments', href: '/appointments', badge: 3 },
  { id: 'book', label: 'Reservar', icon: 'history', href: '/appointments/book' },
  { id: 'sales', label: 'Historial Ventas', icon: 'sales', href: '/sales' },
  { id: 'profile', label: 'Mi Perfil', icon: 'profile', href: '/profile' },
];

const adminItems: NavItemData[] = [
  { id: 'admin', label: 'Panel Admin', icon: 'admin', href: '/admin', badge: 2 },
  { id: 'inventory', label: 'Bodega / Stock', icon: 'inventory', href: '/inventory' },
  { id: 'reports', label: 'Reportes', icon: 'reports', href: '/reports' },
  { id: 'users', label: 'Usuarios', icon: 'profile', href: '/users' },
  { id: 'admin-services', label: 'Gestión Servicios', icon: 'services', href: '/admin-services' },
];

export default function Sidebar({
  activeId,
  onNavigate,
  userName,
  userRole,
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const handleSignOut = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
    } catch (_) {}
    window.location.href = '/';
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onToggle} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Scissors size={24} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>{CONFIG.LOGO.MAIN}</span>
            <span className={styles.logoSub}>{CONFIG.LOGO.SUB}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <span className={styles.navLabel}>Menú Principal</span>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              href={item.href}
              isActive={activeId === item.id}
              badge={item.badge}
              onClick={() => onNavigate(item.id)}
            />
          ))}

          {userRole === 'admin' && (
            <>
              <span className={`${styles.navLabel} ${styles.navLabelSpaced}`}>
                Administración
              </span>
              {adminItems.map((item) => (
                <NavItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  isActive={activeId === item.id}
                  badge={item.badge}
                  onClick={() => onNavigate(item.id)}
                />
              ))}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <Avatar name={userName} size="sm" />
            <div className={styles.userMeta}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>
                {userRole === 'admin' ? 'Administradora' : 'Cliente'}
              </span>
            </div>
          </div>
          <button 
            className={styles.logoutBtn} 
            title="Cerrar sesión"
            onClick={handleSignOut}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
