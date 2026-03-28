'use client';

import React, { useState } from 'react';
import { CalendarDays, Users, DollarSign, TrendingUp, Scissors, Clock } from 'lucide-react';
import styles from './DashboardView.module.css';
import StatCard from '@/components/atoms/StatCard/StatCard';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Button from '@/components/atoms/Button/Button';
import { mockDashboardStats, mockAppointments, mockServices, mockStylists } from '@/lib/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNavigate: (id: any) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);
  
  const stats = mockDashboardStats;
  
  const filteredAppointments = selectedStylistId 
    ? mockAppointments.filter(a => a.stylistId === selectedStylistId)
    : mockAppointments;

  const todayAppointments = filteredAppointments.filter(
    (a) => a.status === 'pendiente' || a.status === 'confirmada'
  );
  
  const topServices = mockServices.slice(0, 4);

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

          <div className={styles.filterBar}>
            <button 
              className={`${styles.filterChip} ${selectedStylistId === null ? styles.activeFilter : ''}`}
              onClick={() => setSelectedStylistId(null)}
            >
              Todos
            </button>
            {mockStylists.map(sty => (
              <button 
                key={sty.id}
                className={`${styles.filterChip} ${selectedStylistId === sty.id ? styles.activeFilter : ''}`}
                onClick={() => setSelectedStylistId(sty.id)}
              >
                {sty.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className={styles.appointmentsList}>
            {todayAppointments.map((apt, i) => (
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
            ))}
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
