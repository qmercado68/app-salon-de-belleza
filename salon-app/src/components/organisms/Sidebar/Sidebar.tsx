'use client';

import React from 'react';
import { Scissors, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';
import NavItem from '@/components/molecules/NavItem/NavItem';
import Avatar from '@/components/atoms/Avatar/Avatar';
import { NavItemData } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';


interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
  userName: string;
  userRole: string;
  salonName?: string | null;
  isOpen?: boolean;
  onToggle?: () => void;
}

const navItems: NavItemData[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { id: 'pos', label: 'Punto de Venta', icon: 'sales', href: '/pos' },
  { id: 'appointments', label: 'Mis Citas', icon: 'appointments', href: '/appointments', badge: 3 },
  { id: 'book', label: 'Reservar', icon: 'history', href: '/appointments/book' },
  { id: 'sales', label: 'Historial Ventas', icon: 'sales', href: '/sales' },
  { id: 'profile', label: 'Mi Perfil', icon: 'profile', href: '/profile' },
];

const adminItems: NavItemData[] = [
  { id: 'admin', label: 'Panel Admin', icon: 'admin', href: '/admin', badge: 2 },
  { id: 'salones', label: 'Salones', icon: 'dashboard', href: '/salones' },
  { id: 'inventory', label: 'Bodega / Stock', icon: 'inventory', href: '/inventory' },
  { id: 'reports', label: 'Reportes', icon: 'reports', href: '/reports' },
  { id: 'users', label: 'Usuarios', icon: 'profile', href: '/users' },
  { id: 'admin-services', label: 'Gestión Servicios', icon: 'services', href: '/admin-services' },
  { id: 'terceros', label: 'Terceros', icon: 'profile', href: '/terceros' },
];

export default function Sidebar({
  activeId,
  onNavigate,
  userName,
  userRole,
  salonName,
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
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

        {/* Salon Indicator */}
        <div style={{
          margin: '0 1rem 0.75rem',
          padding: '0.5rem 0.75rem',
          background: salonName ? 'rgba(236,72,153,0.08)' : 'rgba(99,102,241,0.08)',
          borderRadius: 8,
          fontSize: '0.75rem',
          color: salonName ? '#db2777' : '#6366f1',
          fontWeight: 600,
          textAlign: 'center',
          borderLeft: `3px solid ${salonName ? '#ec4899' : '#6366f1'}`,
        }}>
          <div>{salonName ?? (userRole === 'superadmin' ? 'Plataforma Global' : 'Sin salón asignado')}</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.8, marginTop: 2 }}>
            {userRole === 'superadmin' ? 'Super Admin' : userRole === 'admin' ? 'Administrador' : userRole === 'stylist' ? 'Estilista' : 'Cliente'}
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

          {(userRole === 'admin' || userRole === 'superadmin') && (
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
                {userRole === 'superadmin' ? 'Super Admin' : userRole === 'admin' ? 'Administradora' : userRole === 'stylist' ? 'Estilista' : 'Cliente'}
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
