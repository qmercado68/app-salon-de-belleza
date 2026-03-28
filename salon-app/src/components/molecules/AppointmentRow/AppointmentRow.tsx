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
}

export default function AppointmentRow({
  appointment,
  showClient = false,
  onCancel,
  onMarkPaid,
}: AppointmentRowProps) {
  const date = new Date(appointment.appointmentDate);
  const canCancel =
    appointment.status === 'pendiente' || appointment.status === 'confirmada';

  return (
    <div className={styles.row}>
      <div className={styles.info}>
        {showClient && (
          <Avatar name={appointment.clientName} size="sm" />
        )}
        <div className={styles.details}>
          <span className={styles.service}>{appointment.serviceName}</span>
          {showClient && (
            <span className={styles.client}>{appointment.clientName}</span>
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
      </div>
    </div>
  );
}
