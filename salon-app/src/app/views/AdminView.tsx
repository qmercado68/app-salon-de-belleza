'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import styles from './AdminView.module.css';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import AlertBanner from '@/components/molecules/AlertBanner/AlertBanner';
import { mockAppointments, mockClients } from '@/lib/mockData';
import { Appointment, AppointmentStatus } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminView() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);

  // Clients with allergies
  const clientsWithAllergies = mockClients.filter((c) => c.allergies && c.allergies.length > 0);

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

  // Get client allergy info for appointment
  const getClientAllergy = (clientId: string): string | null => {
    const client = mockClients.find((c) => c.id === clientId);
    return client?.allergies || null;
  };

  return (
    <div className={styles.page}>
      {/* Allergy Alerts Section */}
      <Card className={styles.alertCard}>
        <div className={styles.sectionHeader}>
          <AlertTriangle size={20} className={styles.warningIcon} />
          <h2 className={styles.sectionTitle}>⚠️ Alertas de Salud - Alergias</h2>
        </div>
        <div className={styles.alertsList}>
          {clientsWithAllergies.map((client) => (
            <AlertBanner
              key={client.id}
              type="danger"
              title={`${client.fullName} - Tipo de sangre: ${client.bloodType}`}
              message={`Alergias: ${client.allergies}${client.medicalConditions ? ` | Condiciones: ${client.medicalConditions}` : ''}`}
            />
          ))}
        </div>
      </Card>

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
            {appointments.map((apt) => {
              const allergy = getClientAllergy(apt.clientId);
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
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
