'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import styles from './BookView.module.css';
import Card from '@/components/atoms/Card/Card';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import { mockServices, mockStylists, generateTimeSlots } from '@/lib/mockData';
import { Service, Stylist } from '@/lib/types';

interface BookViewProps {
  onSuccess: () => void;
}

type Step = 'service' | 'stylist' | 'datetime' | 'confirm';

const categoryIcons: Record<string, string> = {
  'Cabello': '💇‍♀️', 'Uñas': '💅', 'Facial': '🧖‍♀️',
  'Cuerpo': '✨', 'Maquillaje': '💄',
};

export default function BookView({ onSuccess }: BookViewProps) {
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState('2026-03-28');
  const [selectedTime, setSelectedTime] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  const timeSlots = generateTimeSlots(selectedDate);

  // Generate calendar days
  const today = new Date(2026, 2, 26); // March 26, 2026
  const calendarDays: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    calendarDays.push(d);
  }

  const handleConfirm = () => {
    setIsBooked(true);
    setTimeout(() => onSuccess(), 2000);
  };

  if (isBooked) {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <Check size={40} />
          </div>
          <h2>¡Cita Reservada!</h2>
          <p>{selectedService?.name}</p>
          <p className={styles.successDate}>{selectedDate} a las {selectedTime}</p>
          <p className={styles.successNote}>
            Recuerda que el pago se realiza en efectivo al asistir al salón.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Steps Indicator */}
      <div className={styles.steps}>
        {['Servicio', 'Profesional', 'Fecha y Hora', 'Confirmar'].map((s, i) => {
          const stepKeys: Step[] = ['service', 'stylist', 'datetime', 'confirm'];
          const isActive = step === stepKeys[i];
          const isDone = stepKeys.indexOf(step) > i;
          return (
            <div key={s} className={`${styles.step} ${isActive ? styles.activeStep : ''} ${isDone ? styles.doneStep : ''}`}>
              <div className={styles.stepDot}>{isDone ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Service */}
      {step === 'service' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>¿Qué servicio deseas?</h3>
          <div className={styles.serviceGrid}>
            {mockServices.map((srv) => (
              <div
                key={srv.id}
                className={`${styles.serviceOption} ${selectedService?.id === srv.id ? styles.selected : ''}`}
                onClick={() => setSelectedService(srv)}
              >
                <span className={styles.serviceEmoji}>{categoryIcons[srv.category] || '✂️'}</span>
                <span className={styles.serviceName}>{srv.name}</span>
                <span className={styles.serviceMeta}>{srv.durationMinutes}min · ${srv.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className={styles.navButtons}>
            <div />
            <Button
              variant="primary"
              onClick={() => setStep('stylist')}
              disabled={!selectedService}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Stylist */}
      {step === 'stylist' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Selecciona un profesional</h3>
          <div className={styles.stylistGrid}>
            {mockStylists.map((sty) => (
              <div
                key={sty.id}
                className={`${styles.stylistCard} ${selectedStylist?.id === sty.id ? styles.selected : ''}`}
                onClick={() => setSelectedStylist(sty)}
              >
                <Avatar name={sty.name} size="lg" />
                <div className={styles.stylistInfo}>
                  <span className={styles.stylistName}>{sty.name}</span>
                  <span className={styles.stylistSpecialty}>{sty.specialty}</span>
                  <p className={styles.stylistDesc}>{sty.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.navButtons}>
            <Button variant="ghost" onClick={() => setStep('service')} icon={<ChevronLeft size={18} />}>
              Atrás
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep('datetime')}
              disabled={!selectedStylist}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 'datetime' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Selecciona fecha y hora</h3>

          {/* Date Selector */}
          <div className={styles.dateScroller}>
            {calendarDays.map((d) => {
              const dateStr = d.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              const dayName = d.toLocaleDateString('es', { weekday: 'short' });
              return (
                <button
                  key={dateStr}
                  className={`${styles.dateChip} ${isSelected ? styles.dateActive : ''}`}
                  onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }}
                >
                  <span className={styles.dayName}>{dayName}</span>
                  <span className={styles.dayNum}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className={styles.timeGrid}>
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                className={`${styles.timeSlot} ${selectedTime === slot.time ? styles.timeActive : ''} ${!slot.available ? styles.timeDisabled : ''}`}
                onClick={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
              >
                {slot.time}
              </button>
            ))}
          </div>

          <div className={styles.navButtons}>
            <Button variant="ghost" onClick={() => setStep('stylist')} icon={<ChevronLeft size={18} />}>
              Atrás
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep('confirm')}
              disabled={!selectedTime}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && selectedService && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Confirma tu reserva</h3>

          <Card className={styles.confirmCard}>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Servicio</span>
              <span className={styles.confirmValue}>{selectedService.name}</span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Duración</span>
              <span className={styles.confirmValue}>{selectedService.durationMinutes} minutos</span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Profesional</span>
              <span className={styles.confirmValue}>{selectedStylist?.name}</span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Fecha</span>
              <span className={styles.confirmValue}>{selectedDate}</span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Hora</span>
              <span className={styles.confirmValue}>{selectedTime} hrs</span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Precio</span>
              <span className={`${styles.confirmValue} ${styles.confirmPrice}`}>
                ${selectedService.price.toLocaleString()} MXN
              </span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Pago</span>
              <span className={styles.confirmValue}>💵 Efectivo en el local</span>
            </div>
          </Card>

          <div className={styles.navButtons}>
            <Button variant="ghost" onClick={() => setStep('datetime')} icon={<ChevronLeft size={18} />}>
              Atrás
            </Button>
            <Button variant="primary" size="lg" onClick={handleConfirm} icon={<Check size={18} />}>
              Confirmar Reserva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
