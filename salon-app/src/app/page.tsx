'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/templates/DashboardLayout/DashboardLayout';
import DashboardView from './views/DashboardView';
import AppointmentsView from './views/AppointmentsView';
import BookView from './views/BookView';
import ProfileView from './views/ProfileView';
import AdminView from './views/AdminView';
import ReportsView from './views/ReportsView';
import InventoryView from './views/InventoryView';
import UsersView from './views/UsersView';
import AdminServicesView from './views/AdminServicesView';
import POSView from './views/POSView';
import SalonesView from './views/SalonesView';
import TercerosView from './views/TercerosView';
import LoginView from './views/LoginView';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Profile } from '@/lib/types';

type ViewId = 'login' | 'dashboard' | 'appointments' | 'book' | 'profile' | 'admin' | 'reports' | 'inventory' | 'users' | 'admin-services' | 'pos' | 'salones' | 'terceros';

const pageTitles: Record<ViewId, { title: string; subtitle?: string }> = {
  login: { title: 'Iniciar Sesión' },
  dashboard: { title: 'Dashboard', subtitle: 'Revisa la actividad de tu salón hoy' },
  appointments: { title: 'Mis Citas', subtitle: 'Gestiona tus citas y revisa tu historial' },
  book: { title: 'Reservar Cita', subtitle: 'Selecciona un servicio, fecha y hora' },
  profile: { title: 'Mi Perfil', subtitle: 'Tu información personal y ficha médica' },
  admin: { title: 'Panel de Administración', subtitle: 'Gestión de citas, pagos y alertas de salud' },
  reports: { title: 'Reportes y Estadísticas', subtitle: 'Análisis detallado del rendimiento de tu salón' },
  inventory: { title: 'Inventario de Productos', subtitle: 'Gestión de catálogo, existencias y precios' },
  users: { title: 'Directorio de Usuarios', subtitle: 'Gestión completa de clientes, administradores y staff' },
  'admin-services': { title: 'Gestión de Catálogo', subtitle: 'Administra tus servicios, precios e imágenes' },
  pos: { title: 'Punto de Pago', subtitle: 'Cobro rápido de citas y productos opcionales' },
  salones: { title: 'Gestión de Salones', subtitle: 'Administra las empresas registradas en la plataforma' },
  terceros: { title: 'Terceros', subtitle: 'Proveedores, clientes y contactos externos' },
};

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewId>('login');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [salonName, setSalonName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        
        if (authUser) {
          // Intentar obtener el perfil con reintento
          let userProfile = null;
          let retries = 0;
          while (retries < 3 && !userProfile) {
            try {
              userProfile = await api.getProfile(authUser.id);
            } catch (e) {
              console.warn(`Intento ${retries + 1} de perfil fallido. Esperando...`);
              await new Promise(r => setTimeout(r, 1000));
              retries++;
            }
          }
          
          if (userProfile) {
            setProfile(userProfile);
            if (userProfile.salonId) {
              const salon = await api.getSalonById(userProfile.salonId);
              if (salon) setSalonName(salon.name);
            }
          } else {
            // Fallback: obtener al menos el rol vía RPC para mostrar el menú correcto
            console.warn("Perfil no cargado, intentando obtener rol vía RPC...");
            try {
              const { data: role } = await supabase.rpc('get_my_role');
              setProfile({
                id: authUser.id,
                fullName: authUser.email?.split('@')[0] || 'Usuario',
                email: authUser.email || '',
                role: role || 'client',
              } as Profile);
            } catch (rpcError) {
              console.error("RPC get_my_role también falló:", rpcError);
              // Último recurso: asignar rol de admin si no hay perfiles
              setProfile({
                id: authUser.id,
                fullName: authUser.email?.split('@')[0] || 'Usuario',
                email: authUser.email || '',
                role: 'client',
              } as Profile);
            }
          }
          setCurrentView('dashboard');
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
        } catch (error) {
          console.warn("Profile fetch failed on state change:", error);
          // Fallback: obtener rol vía RPC
          try {
            const { data: role } = await supabase.rpc('get_my_role');
            setProfile({
              id: authUser.id,
              fullName: authUser.email?.split('@')[0] || 'Usuario',
              email: authUser.email || '',
              role: role || 'client',
            } as Profile);
          } catch (rpcErr) {
            console.error("RPC fallback también falló:", rpcErr);
          }
        }
        setCurrentView('dashboard');
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
      case 'appointments':
        return <AppointmentsView userId={userId} role={userRole} />;
      case 'book':
        return <BookView onSuccess={() => setCurrentView('appointments')} userId={userId} userRole={userRole} />;
      case 'profile':
        return <ProfileView userId={userId ?? ''} userEmail={user?.email ?? undefined} initialProfile={profile ?? undefined} />;
      case 'admin':
        return <AdminView userId={userId} />;
      case 'reports':
        return <ReportsView userId={userId} />;
      case 'inventory':
        return <InventoryView userId={userId} />;
      case 'users':
        return <UsersView currentViewerRole={userRole} />;
      case 'admin-services':
        return <AdminServicesView currentViewerRole={userRole} userId={userId} />;
      case 'pos':
        return <POSView userId={userId} />;
      case 'salones':
        return <SalonesView />;
      case 'terceros':
        return <TercerosView userId={userId} />;
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
      salonName={salonName}
    >
      {renderView()}
    </DashboardLayout>
  );
}
