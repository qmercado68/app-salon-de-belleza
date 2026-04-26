'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './StylistCalendarView.module.css';
import { api } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/lib/types';
import Badge from '@/components/atoms/Badge/Badge';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Button from '@/components/atoms/Button/Button';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  X,
  Calendar as CalendarIcon,
  ChevronUp,
  Phone,
  Trash2,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarViewProps {
  userId?: string;
  role?: string;
}

type CalendarViewMode = 'daily' | 'weekly';

const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const SLOT_HEIGHT_PX = 80;
const MINUTES_PER_SLOT = 60;
const MIN_EVENT_HEIGHT_PX = 22;

const getEventDurationMinutes = (evt: Appointment): number => {
  const dur = Number(evt.durationMinutes);
  return Number.isFinite(dur) && dur > 0 ? dur : 30;
};

const getEventEndDate = (evt: Appointment): Date => {
  const start = new Date(evt.appointmentDate);
  return new Date(start.getTime() + getEventDurationMinutes(evt) * 60_000);
};

const formatTimeRange = (evt: Appointment): string => {
  const start = new Date(evt.appointmentDate);
  const end = getEventEndDate(evt);
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
};

const STATUS_FILTERS: { label: string; value: AppointmentStatus; color: string }[] = [
  { label: 'Pendientes', value: 'pendiente', color: '#f59e0b' },
  { label: 'Confirmadas', value: 'confirmada', color: '#10b981' },
  { label: 'Completadas', value: 'completada', color: '#6366f1' },
  { label: 'Canceladas', value: 'cancelada', color: '#ef4444' },
];

export default function StylistCalendarView({ userId, role }: CalendarViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly');
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [authorizingId, setAuthorizingId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<AppointmentStatus>>(
    new Set(['pendiente', 'confirmada', 'completada', 'cancelada'])
  );

  const isStaff = role === 'admin' || role === 'superadmin';
  const isStylist = role === 'stylist';
  const isClient = role === 'client';
  const showMedicalAlert = isStaff || isStylist;

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        // Staff & stylists see all salon appointments; clients see only their own
        const canViewAll = isStaff || isStylist;
        const isSuperadmin = role === 'superadmin';
        const data = canViewAll
          ? await api.getAppointments(undefined, userId, { skipSalonFilter: isSuperadmin })
          : await api.getAppointments(userId, userId);

        // Stylists only see appointments assigned to them
        const filtered = isStylist && userId
          ? data.filter((apt) => apt.stylistId === userId)
          : data;

        setAppointments(filtered);
      } catch (err: any) {
        console.error('Error al cargar citas:', err);
        setLoadError(err?.message || 'No se pudieron cargar las citas.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [userId, role, isStaff, isStylist]);

  // ── Permissions ──
  const deleteThreshold = Date.now() + 24 * 60 * 60 * 1000;

  const canDeleteAppointment = (appointment: Appointment) => {
    if (appointment.isPaid) return false;
    if (appointment.status === 'cancelada' || appointment.status === 'completada') return false;
    if (isStaff) return true;
    const appointmentTime = new Date(appointment.appointmentDate).getTime();
    return appointmentTime > deleteThreshold;
  };

  const canCancelAppointment = (appointment: Appointment) => {
    return appointment.status === 'pendiente' || appointment.status === 'confirmada';
  };

  const canAuthorizeForBilling = (appointment: Appointment) => {
    if (appointment.isPaid || appointment.status === 'cancelada' || appointment.readyForBilling) return false;
    if (isClient) return false;
    if (isStylist) return appointment.stylistId === userId;
    return isStaff;
  };

  // ── Week boundaries ──
  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // ── Mini calendar days ──
  const miniCalDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarMonth]);

  // ── Dates with events ──
  const datesWithEvents = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((apt) => {
      set.add(format(new Date(apt.appointmentDate), 'yyyy-MM-dd'));
    });
    return set;
  }, [appointments]);

  // ── Filtered appointments ──
  const filteredAppointments = useMemo(
    () => appointments.filter((a) => activeFilters.has(a.status)),
    [appointments, activeFilters]
  );

  // ── Cell events ──
  const getEventsForCell = useCallback(
    (day: Date, hour: number) => {
      return filteredAppointments.filter((apt) => {
        const d = new Date(apt.appointmentDate);
        return isSameDay(d, day) && d.getHours() === hour;
      });
    },
    [filteredAppointments]
  );

  // ── Next upcoming ──
  const nextAppointment = useMemo(() => {
    const now = new Date();
    return filteredAppointments
      .filter(
        (a) =>
          new Date(a.appointmentDate) >= now &&
          (a.status === 'pendiente' || a.status === 'confirmada')
      )
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      )[0];
  }, [filteredAppointments]);

  // ── Week stats ──
  const weekStats = useMemo(() => {
    const weekEnd = addDays(weekStart, 7);
    const weekEvents = filteredAppointments.filter((apt) => {
      const d = new Date(apt.appointmentDate);
      return d >= weekStart && d < weekEnd;
    });
    return {
      total: weekEvents.length,
      pendientes: weekEvents.filter((a) => a.status === 'pendiente').length,
      confirmadas: weekEvents.filter((a) => a.status === 'confirmada').length,
      completadas: weekEvents.filter((a) => a.status === 'completada').length,
    };
  }, [filteredAppointments, weekStart]);

  // ── Actions ──
  const toggleFilter = (status: AppointmentStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const handleCancel = async (id: string) => {
    try {
      await api.cancelAppointment(id);
      const canceledAt = new Date().toISOString();
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'cancelada' as AppointmentStatus,
                canceledAt,
                readyForBilling: false,
                readyForBillingAt: null,
              }
            : a
        )
      );
      setSelectedEvent((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status: 'cancelada' as AppointmentStatus,
              canceledAt,
              readyForBilling: false,
              readyForBillingAt: null,
            }
          : prev
      );
    } catch (err: any) {
      alert(err?.message || 'No se pudo cancelar la cita.');
    }
  };

  const handleDelete = async (id: string) => {
    const target = appointments.find((apt) => apt.id === id);
    if (!target || !canDeleteAppointment(target)) return;
    if (!window.confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) return;

    try {
      setDeletingId(id);
      await api.deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setSelectedEvent(null);
    } catch {
      alert('No se pudo eliminar la cita. Intenta de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAuthorizeForBilling = async (id: string) => {
    const target = appointments.find((apt) => apt.id === id);
    if (!target || !canAuthorizeForBilling(target)) return;

    try {
      setAuthorizingId(id);
      await api.markAppointmentReadyForBilling(id);
      const authorizedAt = new Date().toISOString();
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'completada' as AppointmentStatus,
                readyForBilling: true,
                readyForBillingAt: authorizedAt,
                isPaid: false,
              }
            : a
        )
      );
      setSelectedEvent((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status: 'completada' as AppointmentStatus,
              readyForBilling: true,
              readyForBillingAt: authorizedAt,
              isPaid: false,
            }
          : prev
      );
    } catch (err: any) {
      alert(err?.message || 'No se pudo autorizar la cita para facturación.');
    } finally {
      setAuthorizingId(null);
    }
  };

  const getEventClass = (status: AppointmentStatus) => {
    switch (status) {
      case 'pendiente': return styles.eventPendiente;
      case 'confirmada': return styles.eventConfirmada;
      case 'completada': return styles.eventCompletada;
      case 'cancelada': return styles.eventCancelada;
      default: return styles.eventPendiente;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate((d) => direction === 'next' ? addWeeks(d, 1) : subWeeks(d, 1));
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate((d) => direction === 'next' ? addDays(d, 1) : addDays(d, -1));
  };

  // ── Render event card (reusable for weekly & daily) ──
  const renderEventCard = (evt: Appointment) => {
    const start = new Date(evt.appointmentDate);
    const durationMinutes = getEventDurationMinutes(evt);
    const minutesIntoSlot = start.getMinutes();
    const topPx = (minutesIntoSlot / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX;
    const heightPx = Math.max(
      MIN_EVENT_HEIGHT_PX,
      (durationMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX - 4
    );
    return (
    <div
      key={evt.id}
      className={`${styles.eventCard} ${getEventClass(evt.status)}`}
      onClick={() => setSelectedEvent(evt)}
      style={{
        position: 'absolute',
        top: topPx + 2,
        left: 2,
        right: 2,
        height: heightPx,
      }}
    >
      <div className={styles.eventTitle}>{evt.serviceName}</div>
      <div className={styles.eventTime}>
        <Clock size={10} />
        {formatTimeRange(evt)}
      </div>
      <div className={styles.eventClient}>
        <User size={10} />
        {evt.clientName || 'Sin nombre'}
      </div>
      {evt.clientPhone && (
        <div className={styles.eventPhone}>
          <Phone size={9} />
          {evt.clientPhone}
        </div>
      )}
      {evt.status === 'cancelada' && evt.canceledAt && (
        <div className={styles.eventCancelledAt}>
          <Clock size={9} />
          {format(new Date(evt.canceledAt), 'dd/MM HH:mm')}
        </div>
      )}
      {/* Show stylist name for admin/superadmin/client */}
      {!isStylist && evt.stylistName && (
        <div className={styles.eventStylist}>
          <Scissors size={9} />
          {evt.stylistName}
        </div>
      )}
      {evt.salonName && (
        <div className={styles.eventSalon}>
          <Building2 size={9} />
          {evt.salonName}
        </div>
      )}
    </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.calendarLayout}>
        <p>Cargando calendario...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.calendarLayout}>
        <p style={{ color: 'var(--danger-600)', fontWeight: 600 }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className={styles.calendarLayout}>
      {/* ========== LEFT SIDEBAR ========== */}
      <div className={styles.sidebar}>
        {/* Mini Calendar */}
        <div className={styles.miniCalendar}>
          <div className={styles.miniCalHeader}>
            <span className={styles.miniCalTitle}>
              {format(calendarMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <div className={styles.miniCalNav}>
              <button
                className={styles.miniCalNavBtn}
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className={styles.miniCalNavBtn}
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className={styles.miniCalGrid}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
              <span key={i} className={styles.miniCalDayLabel}>{d}</span>
            ))}
            {miniCalDays.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasEvent = datesWithEvents.has(dateStr);
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const today = isToday(day);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <button
                  key={i}
                  className={`${styles.miniCalDay} ${
                    !isCurrentMonth ? styles.miniCalDayOther : ''
                  } ${today && !isSelected ? styles.miniCalDayToday : ''} ${
                    isSelected ? styles.miniCalDaySelected : ''
                  } ${hasEvent ? styles.miniCalDayHasEvent : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    if (!isSameMonth(day, calendarMonth)) {
                      setCalendarMonth(day);
                    }
                  }}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Appointment */}
        {nextAppointment && (
          <div className={styles.upcomingCard}>
            <div className={styles.upcomingLabel}>Próxima cita</div>
            <div className={styles.upcomingTitle}>
              {nextAppointment.serviceName}
            </div>
            <div className={styles.upcomingTime}>
              <Clock size={14} />
              {format(
                new Date(nextAppointment.appointmentDate),
                "HH:mm '—' d MMM",
                { locale: es }
              )}
            </div>
            <div className={styles.upcomingClient}>
              <Avatar name={nextAppointment.clientName || 'Cliente'} size="sm" />
              <div>
                <span className={styles.upcomingClientName}>
                  {nextAppointment.clientName || 'Sin nombre'}
                </span>
                {nextAppointment.clientPhone && (
                  <div className={styles.upcomingClientPhone}>
                    <Phone size={12} />
                    {nextAppointment.clientPhone}
                  </div>
                )}
              </div>
            </div>
            {!isStylist && nextAppointment.stylistName && (
              <div className={styles.upcomingStylist}>
                <Scissors size={12} />
                {nextAppointment.stylistName}
              </div>
            )}
            {nextAppointment.salonName && (
              <div className={styles.upcomingSalon}>
                <Building2 size={12} />
                {nextAppointment.salonName}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className={styles.filtersPanel}>
          <div className={styles.filtersPanelTitle}>
            <span>Filtros</span>
            <ChevronUp size={16} />
          </div>
          {STATUS_FILTERS.map((f) => (
            <label key={f.value} className={styles.filterOption}>
              <input
                type="checkbox"
                checked={activeFilters.has(f.value)}
                onChange={() => toggleFilter(f.value)}
                style={{ accentColor: f.color }}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      {/* ========== MAIN CALENDAR ========== */}
      <div className={styles.mainArea}>
        {/* Toolbar */}
        <div className={styles.calendarToolbar}>
          <div className={styles.toolbarLeft}>
            <button
              className={styles.navArrow}
              onClick={() =>
                viewMode === 'weekly' ? navigateWeek('prev') : navigateDay('prev')
              }
            >
              <ChevronLeft size={18} />
            </button>
            <span className={styles.weekTitle}>
              {viewMode === 'weekly'
                ? `${format(weekStart, 'd MMM', { locale: es })} — ${format(
                    addDays(weekStart, 6),
                    'd MMM yyyy',
                    { locale: es }
                  )}`
                : format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </span>
            <button
              className={styles.navArrow}
              onClick={() =>
                viewMode === 'weekly' ? navigateWeek('next') : navigateDay('next')
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewToggleBtn} ${
                  viewMode === 'daily' ? styles.viewToggleBtnActive : ''
                }`}
                onClick={() => setViewMode('daily')}
              >
                Diario
              </button>
              <button
                className={`${styles.viewToggleBtn} ${
                  viewMode === 'weekly' ? styles.viewToggleBtnActive : ''
                }`}
                onClick={() => setViewMode('weekly')}
              >
                Semanal
              </button>
            </div>
            <button
              className={styles.todayBtn}
              onClick={() => {
                setSelectedDate(new Date());
                setCalendarMonth(new Date());
              }}
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statChip}>
            <CalendarIcon size={14} />
            Esta semana: <span className={styles.statChipCount}>{weekStats.total}</span>
          </div>
          <div className={styles.statChip}>
            Pendientes: <span className={styles.statChipCount}>{weekStats.pendientes}</span>
          </div>
          <div className={styles.statChip}>
            Confirmadas: <span className={styles.statChipCount}>{weekStats.confirmadas}</span>
          </div>
          <div className={styles.statChip}>
            Completadas: <span className={styles.statChipCount}>{weekStats.completadas}</span>
          </div>
        </div>

        {/* ── Weekly Grid ── */}
        {viewMode === 'weekly' ? (
          <div className={styles.weekGrid}>
            <div className={styles.dayHeaders}>
              <div className={styles.dayHeaderEmpty}></div>
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`${styles.dayHeader} ${isToday(day) ? styles.dayHeaderToday : ''}`}
                >
                  <div className={styles.dayHeaderLabel}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={styles.dayHeaderNumber}>{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            <div className={styles.timeGrid}>
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className={styles.timeLabel}>
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day, dayIdx) => {
                    const events = getEventsForCell(day, hour);
                    return (
                      <div
                        key={dayIdx}
                        className={`${styles.timeCell} ${isToday(day) ? styles.timeCellToday : ''}`}
                      >
                        {events.map(renderEventCard)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          /* ── Daily View ── */
          <div className={styles.weekGrid}>
            <div className={styles.dayHeaders}>
              <div className={styles.dayHeaderEmpty}></div>
              <div
                className={`${styles.dayHeader} ${
                  isToday(selectedDate) ? styles.dayHeaderToday : ''
                }`}
              >
                <div className={styles.dayHeaderLabel}>
                  {format(selectedDate, 'EEEE', { locale: es })}
                </div>
                <div className={styles.dayHeaderNumber}>
                  {format(selectedDate, 'd')}
                </div>
              </div>
            </div>
            <div
              className={styles.timeGrid}
              style={{ gridTemplateColumns: '70px 1fr' }}
            >
              {HOURS.map((hour) => {
                const events = getEventsForCell(selectedDate, hour);
                return (
                  <React.Fragment key={hour}>
                    <div className={styles.timeLabel}>
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div
                      className={`${styles.timeCell} ${
                        isToday(selectedDate) ? styles.timeCellToday : ''
                      }`}
                    >
                      {events.map(renderEventCard)}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========== EVENT DETAIL POPUP ========== */}
      {selectedEvent && (
        <div
          className={styles.eventPopupOverlay}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className={styles.eventPopup}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.eventPopupHeader}>
              <div>
                <div className={styles.eventPopupTitle}>
                  {selectedEvent.serviceName}
                </div>
                <Badge variant={selectedEvent.status}>
                  {selectedEvent.status}
                </Badge>
                {selectedEvent.isPaid && (
                  <Badge variant="pagada">Pagada</Badge>
                )}
                {selectedEvent.readyForBilling && !selectedEvent.isPaid && (
                  <Badge variant="info">Lista para facturar</Badge>
                )}
              </div>
              <button
                className={styles.eventPopupClose}
                onClick={() => setSelectedEvent(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Date & time */}
            <div className={styles.eventPopupRow}>
              <Clock size={16} className={styles.eventPopupIcon} />
              <span>
                {format(
                  new Date(selectedEvent.appointmentDate),
                  "EEEE d 'de' MMMM",
                  { locale: es }
                )}
                {`, ${formatTimeRange(selectedEvent)} hrs`}
                {` (${getEventDurationMinutes(selectedEvent)} min)`}
              </span>
            </div>

            {/* Services list (handy for multi-service appointments) */}
            {selectedEvent.serviceNames && selectedEvent.serviceNames.length > 1 && (
              <div className={styles.eventPopupRow}>
                <Scissors size={16} className={styles.eventPopupIcon} />
                <span>{selectedEvent.serviceNames.join(', ')}</span>
              </div>
            )}

            {/* Client */}
            <div className={styles.eventPopupRow}>
              <User size={16} className={styles.eventPopupIcon} />
              <span>{selectedEvent.clientName || 'Sin nombre'}</span>
            </div>

            {selectedEvent.clientPhone && (
              <div className={styles.eventPopupRow}>
                <Phone size={16} className={styles.eventPopupIcon} />
                <a
                  href={`tel:${selectedEvent.clientPhone}`}
                  style={{ color: 'var(--accent-600)', textDecoration: 'none' }}
                >
                  {selectedEvent.clientPhone}
                </a>
              </div>
            )}

            {/* Stylist (visible for admin/superadmin/client) */}
            {!isStylist && selectedEvent.stylistName && (
              <div className={styles.eventPopupRow}>
                <Scissors size={16} className={styles.eventPopupIcon} />
                <span>{selectedEvent.stylistName}</span>
              </div>
            )}

            {/* Salon name */}
            {selectedEvent.salonName && (
              <div className={styles.eventPopupRow}>
                <CalendarIcon size={16} className={styles.eventPopupIcon} />
                <span>Salón: {selectedEvent.salonName}</span>
              </div>
            )}

            {/* Notes */}
            {selectedEvent.notes && (
              <div className={styles.eventPopupRow}>
                <span style={{ marginLeft: 28, fontStyle: 'italic', color: 'var(--neutral-500)' }}>
                  {selectedEvent.notes}
                </span>
              </div>
            )}

            {selectedEvent.readyForBillingAt && (
              <div className={styles.eventPopupRow}>
                <CheckCircle2 size={16} className={styles.eventPopupIcon} />
                <span>
                  Autorizada: {format(new Date(selectedEvent.readyForBillingAt), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
            )}

            {selectedEvent.status === 'cancelada' && selectedEvent.canceledAt && (
              <div className={styles.eventPopupRow}>
                <Clock size={16} className={styles.eventPopupIcon} />
                <span>
                  Cancelada: {format(new Date(selectedEvent.canceledAt), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
            )}

            {/* Medical alert (staff & stylists only) */}
            {showMedicalAlert &&
              (selectedEvent.allergies || selectedEvent.medicalConditions) && (
                <div
                  style={{
                    margin: '0.75rem 0',
                    padding: '0.5rem 0.75rem',
                    background: '#fef2f2',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: '#991b1b',
                    borderLeft: '3px solid #ef4444',
                  }}
                >
                  {selectedEvent.allergies && (
                    <div><strong>Alergias:</strong> {selectedEvent.allergies}</div>
                  )}
                  {selectedEvent.medicalConditions && (
                    <div><strong>Condiciones:</strong> {selectedEvent.medicalConditions}</div>
                  )}
                </div>
              )}

            {/* Actions */}
            <div className={styles.eventPopupActions}>
              {canAuthorizeForBilling(selectedEvent) && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAuthorizeForBilling(selectedEvent.id)}
                  disabled={authorizingId === selectedEvent.id}
                >
                  {authorizingId === selectedEvent.id ? 'Autorizando...' : 'Servicio Realizado'}
                </Button>
              )}
              {canCancelAppointment(selectedEvent) && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleCancel(selectedEvent.id)}
                >
                  Cancelar
                </Button>
              )}
              {canDeleteAppointment(selectedEvent) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(selectedEvent.id)}
                  disabled={deletingId === selectedEvent.id}
                >
                  <Trash2 size={14} />
                  {deletingId === selectedEvent.id ? 'Eliminando...' : 'Eliminar'}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedEvent(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
