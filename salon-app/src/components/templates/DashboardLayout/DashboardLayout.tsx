'use client';

import React, { useState } from 'react';
import styles from './DashboardLayout.module.css';
import Sidebar from '@/components/organisms/Sidebar/Sidebar';
import Header from '@/components/organisms/Header/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeNav: string;
  onNavigate: (id: string) => void;
  pageTitle: string;
  pageSubtitle?: string;
  userName: string;
  userRole?: string;
  salonName?: string | null;
}

export default function DashboardLayout({
  children,
  activeNav,
  onNavigate,
  pageTitle,
  pageSubtitle,
  userName,
  userRole = 'client',
  salonName,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        activeId={activeNav}
        onNavigate={(id) => {
          onNavigate(id);
          setSidebarOpen(false);
        }}
        userName={userName}
        userRole={userRole}
        salonName={salonName}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />
      <div className={styles.mainArea}>
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          userName={userName}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationCount={3}
        />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
