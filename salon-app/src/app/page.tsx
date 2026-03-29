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
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Profile } from '@/lib/types';

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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        
        if (authUser) {
          try {
            const userProfile = await api.getProfile(authUser.id);
            setProfile(userProfile);
            setCurrentView('dashboard');
          } catch (error) {
            console.warn("Profile not synchronized yet, fallback to default.");
            setCurrentView('dashboard');
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase?.auth ? supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      // No mostrar loading en refresco de token o al volver a la pestaña
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        try {
          const userProfile = await api.getProfile(authUser.id);
          setProfile(userProfile);
          setCurrentView('dashboard');
        } catch (error) {
          console.warn("Profile fetch failed on state change:", error);
          setCurrentView('dashboard');
        }
      } else {
        setProfile(null);
        setCurrentView('login');
      }
    }) : { data: { subscription: { unsubscribe: () => {} } } };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (currentView === 'login' || !user) {
    return (
      <LoginView
        onLogin={() => {
          setUser({ id: 'demo-user', email: 'demo@salon.com' });
          setProfile({ fullName: 'Usuario Demo', role: 'admin' } as Profile);
          setCurrentView('dashboard');
        }}
      />
    );
  }

  const pageInfo = pageTitles[currentView];

  const userId = user?.id as string | undefined;
  const userRole = profile?.role;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} userId={userId} />;
      case 'services':
        return <ServicesView onBook={() => setCurrentView('book')} userId={userId} />;
      case 'appointments':
        return <AppointmentsView userId={userId} role={userRole} />;
      case 'book':
        return <BookView onSuccess={() => setCurrentView('appointments')} userId={userId} />;
      case 'profile':
        return <ProfileView userId={userId ?? ''} userEmail={user?.email ?? undefined} initialProfile={profile ?? undefined} />;
      case 'admin':
        return <AdminView userId={userId} />;
      case 'reports':
        return <ReportsView />;
      case 'sales':
        return <SalesView />;
      case 'inventory':
        return <InventoryView />;
      default:
        return <DashboardView onNavigate={setCurrentView} userId={userId} />;
    }
  };

  return (
    <DashboardLayout
      activeNav={currentView}
      onNavigate={(id) => setCurrentView(id as ViewId)}
      pageTitle={pageInfo.title}
      pageSubtitle={pageInfo.subtitle}
      userName={profile?.fullName || user.email || 'Usuario'}
      userRole={profile?.role || 'client'}
    >
      {renderView()}
    </DashboardLayout>
  );
}
