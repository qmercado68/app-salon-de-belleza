'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Users, DollarSign, TrendingUp, Scissors, Clock } from 'lucide-react';
import styles from './DashboardView.module.css';
import StatCard from '@/components/atoms/StatCard/StatCard';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { Appointment, Service, DashboardStats } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNavigate: (id: any) => void;
  userId?: string;
}

export default function DashboardView({ onNavigate, userId }: DashboardViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appts, svcs] = await Promise.all([
          api.getAppointments(undefined, userId),
          api.getServices(userId),
        ]);
        setAppointments(appts);
        setServices(svcs);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Calculate stats from real data
  const today = new Date().toISOString().split('T')[0];
  const stats: DashboardStats = {
    todayAppointments: appointments.filter(
      (a) => a.appointmentDate?.startsWith(today)
    ).length,
    pendingAppointments: appointments.filter((a) => a.status === 'pendiente').length,
    completedAppointments: appointments.filter((a) => a.status === 'completada').length,
    monthlyRevenue: appointments
      .filter((a) => a.status === 'completada' && a.isPaid)
      .reduce((sum) => sum, 0),
    totalClients: new Set(appointments.map((a) => a.clientId)).size,
    popularService: services[0]?.name || '—',
  };

  const todayAppointments = appointments.filter(
    (a) => a.status === 'pendiente' || a.status === 'confirmada'
  );

  const topServices = services.slice(0, 4);

  if (loading) {
    return <div className={styles.dashboard}><p>Cargando...</p></div>;
  }

  return (
    <div className={styles.dashboard}>
      {/* Stats Row */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<CalendarDays size={22} />}
          value={stats.todayAppointments}
          label="Citas Hoy"
          trend={{ value: 12, isPositive: true }}
          color="purple"
        />
        <StatCard
          icon={<Clock size={22} />}
          value={stats.pendingAppointments}
          label="Pendientes"
          color="orange"
        />
        <StatCard
          icon={<Users size={22} />}
          value={stats.totalClients}
          label="Clientes Totales"
          trend={{ value: 8, isPositive: true }}
          color="blue"
        />
        <StatCard
          icon={<DollarSign size={22} />}
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          label="Ingresos del Mes"
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
      </div>

      {/* Content Row */}
      <div className={styles.contentGrid}>
        {/* Upcoming Appointments */}
        <Card className={styles.appointmentsCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Próximas Citas</h2>
              <p className={styles.cardSubtitle}>Citas pendientes y confirmadas</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('appointments')}>
              Ver todas
            </Button>
          </div>

          <div className={styles.appointmentsList}>
            {todayAppointments.length === 0 ? (
              <p className={styles.cardSubtitle}>No hay citas pendientes o confirmadas.</p>
            ) : (
              todayAppointments.map((apt, i) => (
                <div key={apt.id} className={styles.aptItem} style={{ animationDelay: `${i * 0.1}s` }}>
                  <Avatar name={apt.clientName} size="sm" />
                  <div className={styles.aptInfo}>
                    <span className={styles.aptClient}>{apt.clientName}</span>
                    <span className={styles.aptService}>{apt.serviceName}</span>
                  </div>
                  <div className={styles.aptMeta}>
                    <span className={styles.aptTime}>
                      {format(new Date(apt.appointmentDate), "HH:mm")}
                    </span>
                    <span className={styles.aptDate}>
                      {format(new Date(apt.appointmentDate), "d MMM", { locale: es })}
                    </span>
                  </div>
                  <Badge variant={apt.status}>{apt.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Popular Services */}
        <Card className={styles.servicesCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Servicios Populares</h2>
              <p className={styles.cardSubtitle}>Los más solicitados este mes</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('services')}>
              Ver catálogo
            </Button>
          </div>
          <div className={styles.servicesList}>
            {topServices.map((srv, i) => (
              <div key={srv.id} className={styles.srvItem} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.srvRank}>#{i + 1}</div>
                <div className={styles.srvInfo}>
                  <span className={styles.srvName}>{srv.name}</span>
                  <span className={styles.srvCategory}>{srv.category}</span>
                </div>
                <div className={styles.srvPrice}>${srv.price.toLocaleString()}</div>
                <div className={styles.srvBar}>
                  <div
                    className={styles.srvBarFill}
                    style={{ width: `${100 - i * 18}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <Scissors size={16} />
              <span className={styles.quickLabel}>Servicio más popular</span>
              <span className={styles.quickValue}>{stats.popularService}</span>
            </div>
            <div className={styles.quickStat}>
              <TrendingUp size={16} />
              <span className={styles.quickLabel}>Completadas este mes</span>
              <span className={styles.quickValue}>{stats.completedAppointments}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
