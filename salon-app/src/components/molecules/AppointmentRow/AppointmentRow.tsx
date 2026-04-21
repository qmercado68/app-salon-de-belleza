import React from 'react';
import styles from './AppointmentRow.module.css';
import Badge from '@/components/atoms/Badge/Badge';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Button from '@/components/atoms/Button/Button';
import { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentRowProps {
  appointment: Appointment;
  showClient?: boolean;
  onCancel?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  showMedicalAlert?: boolean;
}

export default function AppointmentRow({
  appointment,
  showClient = false,
  onCancel,
  onMarkPaid,
  onDelete,
  canDelete = false,
  showMedicalAlert = false,
}: AppointmentRowProps) {
  const date = new Date(appointment.appointmentDate);
  const canCancel =
    appointment.status === 'pendiente' || appointment.status === 'confirmada';
  const hasMedicalAlert = showMedicalAlert
    && appointment.medicalFormRequested
    && ((appointment.allergies || '').trim() || (appointment.medicalConditions || '').trim());

  return (
    <div className={styles.row}>
      <div className={styles.info}>
        {showClient && (
          <Avatar name={appointment.clientName} size="sm" />
        )}
        <div className={styles.details}>
          <span className={styles.service}>{appointment.serviceName}</span>
          {showClient && (
            <>
              <span className={styles.client}>{appointment.clientName}</span>
              {appointment.clientPhone && (
                <a 
                  href={`tel:${appointment.clientPhone}`} 
                  className={styles.phoneLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  {appointment.clientPhone}
                </a>
              )}
              {hasMedicalAlert && (
                <div className={styles.medicalAlert}>
                  {appointment.allergies && (
                    <div><strong>Alergias:</strong> {appointment.allergies}</div>
                  )}
                  {appointment.medicalConditions && (
                    <div><strong>Condiciones:</strong> {appointment.medicalConditions}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className={styles.dateCol}>
        <span className={styles.date}>
          {format(date, "d MMM yyyy", { locale: es })}
        </span>
        <span className={styles.time}>
          {format(date, "HH:mm")} hrs
        </span>
      </div>
      <div className={styles.stylistCol}>
        <span className={styles.stylist}>{appointment.stylistName || '-'}</span>
      </div>
      <div className={styles.statusCol}>
        <Badge variant={appointment.status}>{appointment.status}</Badge>
        {appointment.isPaid && <Badge variant="pagada">Pagada</Badge>}
      </div>
      <div className={styles.actions}>
        {canCancel && onCancel && (
          <Button size="sm" variant="ghost" onClick={() => onCancel(appointment.id)}>
            Cancelar
          </Button>
        )}
        {onMarkPaid && !appointment.isPaid && appointment.status === 'completada' && (
          <Button size="sm" variant="secondary" onClick={() => onMarkPaid(appointment.id)}>
            Marcar Pagada
          </Button>
        )}
        {onDelete && canDelete && (
          <Button size="sm" variant="danger" onClick={() => onDelete(appointment.id)}>
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
