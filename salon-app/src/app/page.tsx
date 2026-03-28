'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/templates/DashboardLayout/DashboardLayout';
import DashboardView from './views/DashboardView';
import ServicesView from './views/ServicesView';
import AppointmentsView from './views/AppointmentsView';
import BookView from './views/BookView';
import ProfileView from './views/ProfileView';
import AdminView from './views/AdminView';
import ReportsView from './views/ReportsView';
import SalesView from './views/SalesView';
import InventoryView from './views/InventoryView';
import LoginView from './views/LoginView';
import { mockAdminUser } from '@/lib/mockData';

type ViewId = 'login' | 'dashboard' | 'services' | 'appointments' | 'book' | 'profile' | 'admin' | 'reports' | 'sales' | 'inventory';

const pageTitles: Record<ViewId, { title: string; subtitle?: string }> = {
  login: { title: 'Iniciar Sesión' },
  dashboard: { title: 'Buenos Días, Ana 👋', subtitle: 'Revisa la actividad de tu salón hoy' },
  services: { title: 'Catálogo de Servicios', subtitle: 'Explora todos nuestros tratamientos' },
  appointments: { title: 'Mis Citas', subtitle: 'Gestiona tus citas y revisa tu historial' },
  book: { title: 'Reservar Cita', subtitle: 'Selecciona un servicio, fecha y hora' },
  profile: { title: 'Mi Perfil', subtitle: 'Tu información personal y ficha médica' },
  admin: { title: 'Panel de Administración', subtitle: 'Gestión de citas, pagos y alertas de salud' },
  reports: { title: 'Reportes y Estadísticas', subtitle: 'Análisis detallado del rendimiento de tu salón' },
  sales: { title: 'Ventas y Facturación', subtitle: 'Registro histórico de transacciones y pagos' },
  inventory: { title: 'Inventario de Productos', subtitle: 'Gestión de catálogo, existencias y precios' },
};

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewId>('login');
  const currentUser = mockAdminUser;

  if (currentView === 'login') {
    return (
      <LoginView
        onLogin={() => setCurrentView('dashboard')}
      />
    );
  }

  const pageInfo = pageTitles[currentView];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />;
      case 'services':
        return <ServicesView onBook={() => setCurrentView('book')} />;
      case 'appointments':
        return <AppointmentsView />;
      case 'book':
        return <BookView onSuccess={() => setCurrentView('appointments')} />;
      case 'profile':
        return <ProfileView />;
      case 'admin':
        return <AdminView />;
      case 'reports':
        return <ReportsView />;
      case 'sales':
        return <SalesView />;
      case 'inventory':
        return <InventoryView />;
      default:
        return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <DashboardLayout
      activeNav={currentView}
      onNavigate={(id) => setCurrentView(id as ViewId)}
      pageTitle={pageInfo.title}
      pageSubtitle={pageInfo.subtitle}
      userName={currentUser.fullName}
      userRole={currentUser.role}
    >
      {renderView()}
    </DashboardLayout>
  );
}
