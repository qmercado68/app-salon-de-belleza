'use client';

import React, { useState, useEffect } from 'react';
import styles from './AppointmentsView.module.css';
import Card from '@/components/atoms/Card/Card';
import AppointmentRow from '@/components/molecules/AppointmentRow/AppointmentRow';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/lib/types';

type FilterStatus = 'todas' | AppointmentStatus;

interface AppointmentsViewProps {
  userId?: string;
  role?: string;
}

export default function AppointmentsView({ userId, role }: AppointmentsViewProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        // Admin: todas las citas del salón; Cliente: solo sus propias citas
        const data = role === 'admin'
          ? await api.getAppointments(undefined, userId)
          : await api.getAppointments(userId, userId);
        setAppointments(data);
      } catch (err) {
        console.error('Error al cargar citas:', err);
        setError('No se pudieron cargar las citas.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [userId, role]);

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'Todas', value: 'todas' },
    { label: 'Pendientes', value: 'pendiente' },
    { label: 'Confirmadas', value: 'confirmada' },
    { label: 'Completadas', value: 'completada' },
    { label: 'Canceladas', value: 'cancelada' },
  ];

  const filtered =
    filterStatus === 'todas'
      ? appointments
      : appointments.filter((a) => a.status === filterStatus);

  const handleCancel = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelada' as AppointmentStatus } : a))
    );
  };

  if (loading) {
    return <div className={styles.page}><p>Cargando...</p></div>;
  }

  if (error) {
    return <div className={styles.page}><p>{error}</p></div>;
  }

  return (
    <div className={styles.page}>
      {/* Filter Row */}
      <div className={styles.filterRow}>
        <div className={styles.filters}>
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filterStatus === f.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className={styles.count}>
          {filtered.length} cita{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Appointments Table */}
      <Card padding="sm">
        <div className={styles.tableHeader}>
          <span>Servicio</span>
          <span>Fecha</span>
          <span>Estilista</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        <div className={styles.tableBody}>
          {filtered.map((apt) => (
            <AppointmentRow
              key={apt.id}
              appointment={apt}
              showClient
              onCancel={handleCancel}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            No hay citas para mostrar
          </div>
        )}
      </Card>
    </div>
  );
}
