'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import styles from './AdminView.module.css';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import AlertBanner from '@/components/molecules/AlertBanner/AlertBanner';
import { api } from '@/lib/api';
import { Appointment, AppointmentStatus, Profile } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminViewProps {
  userId?: string;
}

export default function AdminView({ userId }: AdminViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAppointments(undefined, userId);
        setAppointments(data);
      } catch (err) {
        console.error('Error al cargar citas:', err);
        setError('No se pudieron cargar las citas.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [userId]);

  const handleMarkPaid = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPaid: true } : a))
    );
  };

  const handleComplete = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'completada' as AppointmentStatus } : a))
    );
  };

  // Detect allergy info from appointments
  // appointments joined with profiles via Supabase return profile data in nested object
  const getClientAllergy = (apt: Appointment): string | null => {
    // When data comes from Supabase join, allergies may be available on the raw object
    const raw = apt as any;
    return raw?.profiles?.allergies || raw?.allergies || null;
  };

  // Build allergy alerts from appointments that have allergy info
  const appointmentsWithAllergies = appointments.filter((apt) => getClientAllergy(apt));

  if (loading) {
    return <div className={styles.page}><p>Cargando...</p></div>;
  }

  if (error) {
    return <div className={styles.page}><p>{error}</p></div>;
  }

  return (
    <div className={styles.page}>
      {/* Allergy Alerts Section */}
      {appointmentsWithAllergies.length > 0 && (
        <Card className={styles.alertCard}>
          <div className={styles.sectionHeader}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            <h2 className={styles.sectionTitle}>⚠️ Alertas de Salud - Alergias</h2>
          </div>
          <div className={styles.alertsList}>
            {appointmentsWithAllergies.map((apt) => {
              const allergy = getClientAllergy(apt);
              const raw = apt as any;
              const bloodType = raw?.profiles?.blood_type || '';
              const medicalConditions = raw?.profiles?.medical_conditions || '';
              return (
                <AlertBanner
                  key={apt.id}
                  type="danger"
                  title={`${apt.clientName}${bloodType ? ` - Tipo de sangre: ${bloodType}` : ''}`}
                  message={`Alergias: ${allergy}${medicalConditions ? ` | Condiciones: ${medicalConditions}` : ''}`}
                />
              );
            })}
          </div>
        </Card>
      )}

      {/* All Appointments Management */}
      <Card className={styles.tableCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Gestión de Citas</h2>
          <Badge variant="info" size="md">
            {appointments.length} citas
          </Badge>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Cliente</span>
            <span>Servicio</span>
            <span>Fecha / Hora</span>
            <span>Estado</span>
            <span>Pago</span>
            <span>Acciones</span>
          </div>
          <div className={styles.tableBody}>
            {appointments.length === 0 ? (
              <div className={styles.tableRow}>
                <span style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', opacity: 0.6 }}>
                  No hay citas registradas.
                </span>
              </div>
            ) : (
              appointments.map((apt) => {
                const allergy = getClientAllergy(apt);
                return (
                  <div key={apt.id} className={`${styles.tableRow} ${allergy ? styles.hasAlert : ''}`}>
                    <div className={styles.clientCell}>
                      <Avatar name={apt.clientName} size="sm" />
                      <div>
                        <span className={styles.clientName}>{apt.clientName}</span>
                        {allergy && (
                          <span className={styles.allergyTag}>
                            <AlertTriangle size={12} /> Alergias
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={styles.serviceCell}>{apt.serviceName}</span>
                    <div className={styles.dateCell}>
                      <span>{format(new Date(apt.appointmentDate), "d MMM yyyy", { locale: es })}</span>
                      <span className={styles.timeText}>{format(new Date(apt.appointmentDate), "HH:mm")} hrs</span>
                    </div>
                    <div>
                      <Badge variant={apt.status}>{apt.status}</Badge>
                    </div>
                    <div>
                      {apt.isPaid ? (
                        <Badge variant="pagada">
                          <CheckCircle2 size={12} /> Pagada
                        </Badge>
                      ) : (
                        <span className={styles.unpaid}>Pendiente</span>
                      )}
                    </div>
                    <div className={styles.actionsCell}>
                      {(apt.status === 'pendiente' || apt.status === 'confirmada') && (
                        <Button size="sm" variant="secondary" onClick={() => handleComplete(apt.id)}>
                          <CheckCircle2 size={14} /> Completar
                        </Button>
                      )}
                      {apt.status === 'completada' && !apt.isPaid && (
                        <Button size="sm" variant="primary" onClick={() => handleMarkPaid(apt.id)}>
                          <DollarSign size={14} /> Marcar Pagada
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
