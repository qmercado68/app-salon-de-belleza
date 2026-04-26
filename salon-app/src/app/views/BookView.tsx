import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Search } from 'lucide-react';
import styles from './BookView.module.css';
import Card from '@/components/atoms/Card/Card';
import ServiceCard from '@/components/molecules/ServiceCard/ServiceCard';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Input from '@/components/atoms/Input/Input';
import { api } from '@/lib/api';
import { Service, Stylist, Profile, Salon } from '@/lib/types';

interface BookViewProps {
  onSuccess: () => void;
  userId?: string;
  userRole?: string;
}

type Step = 'salon' | 'client' | 'service' | 'stylist' | 'datetime' | 'confirm';

const categoryIcons: Record<string, string> = {
  'Cabello': '💇‍♀️', 'Uñas': '💅', 'Facial': '🧖‍♀️',
  'Cuerpo': '✨', 'Maquillaje': '💄',
};

function getStepList(userRole?: string): { labels: string[]; keys: Step[] } {
  if (userRole === 'superadmin') {
    return {
      labels: ['Salón', 'Cliente', 'Servicio', 'Profesional', 'Fecha y Hora', 'Confirmar'],
      keys: ['salon', 'client', 'service', 'stylist', 'datetime', 'confirm'],
    };
  }
  if (userRole === 'admin') {
    return {
      labels: ['Cliente', 'Servicio', 'Profesional', 'Fecha y Hora', 'Confirmar'],
      keys: ['client', 'service', 'stylist', 'datetime', 'confirm'],
    };
  }
  return {
    labels: ['Servicio', 'Profesional', 'Fecha y Hora', 'Confirmar'],
    keys: ['service', 'stylist', 'datetime', 'confirm'],
  };
}

export default function BookView({ onSuccess, userId, userRole }: BookViewProps) {
  const isSuperadmin = userRole === 'superadmin';
  const isStaff = userRole === 'admin' || isSuperadmin;
  const { labels: stepLabels, keys: stepKeys } = getStepList(userRole);

  const [step, setStep] = useState<Step>(stepKeys[0]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('sv'));
  const [selectedTime, setSelectedTime] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Salon selection (superadmin)
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);

  // Client selection (staff)
  const [clients, setClients] = useState<Profile[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientQuery, setClientQuery] = useState('');

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loadingStylists, setLoadingStylists] = useState(false);
  const [stylistQuery, setStylistQuery] = useState('');

  const [timeSlots, setTimeSlots] = useState<{time: string, available: boolean}[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // The effective salonId for filtering
  const effectiveSalonId = isSuperadmin ? selectedSalon?.id : undefined;
  const salonsById = useMemo(
    () => new Map(salons.map((s) => [s.id, s.name])),
    [salons]
  );

  // 1. Load salons for superadmin
  useEffect(() => {
    if (isSuperadmin) {
      const fetch = async () => {
        try {
          setLoadingSalons(true);
          const data = await api.getSalons();
          setSalons(data);
        } catch (err) {
          console.error('Error al cargar salones:', err);
        } finally {
          setLoadingSalons(false);
        }
      };
      fetch();
    }
  }, [isSuperadmin]);

  // 2. Load clients when entering client step
  useEffect(() => {
    if (step === 'client' && isStaff) {
      const fetch = async () => {
        try {
          setLoadingClients(true);
          let data = await api.getBookableClients(userId, effectiveSalonId);
          if (isSuperadmin && effectiveSalonId && data.length === 0) {
            data = await api.getBookableClients(userId);
          }
          setClients(data);
        } catch (err) {
          console.error('Error al cargar clientes:', err);
        } finally {
          setLoadingClients(false);
        }
      };
      fetch();
    }
  }, [step, isStaff, isSuperadmin, effectiveSalonId]);

  const filteredClients = useMemo(() => {
    return clients.filter(c =>
      c.fullName.toLowerCase().includes(clientQuery.toLowerCase()) ||
      (c.phone || '').includes(clientQuery) ||
      (c.email || '').toLowerCase().includes(clientQuery.toLowerCase())
    );
  }, [clients, clientQuery]);

  // 3. Load services when entering service step
  useEffect(() => {
    if (step === 'service') {
      setActiveCategory('Todos');
      const fetch = async () => {
        try {
          setLoadingServices(true);
          const data = await api.getBookableServices(userId, effectiveSalonId);
          setServices(data.filter((s) => s.isActive !== false));
        } catch (err) {
          console.error('Error al cargar servicios:', err);
        } finally {
          setLoadingServices(false);
        }
      };
      fetch();
    }
  }, [step, userId, effectiveSalonId]);

  // Derived: category filter for services
  const serviceCategories = ['Todos', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServicesByCategory =
    activeCategory === 'Todos'
      ? services
      : services.filter((s) => s.category === activeCategory);

  // 4. Load stylists when entering stylist step
  useEffect(() => {
    if (step === 'stylist') {
      const fetch = async () => {
        try {
          setLoadingStylists(true);
          let data = await api.getStylists(userId, effectiveSalonId);
          if (isSuperadmin && effectiveSalonId && data.length === 0) {
            data = await api.getStylists(userId);
          }
          setStylists(data);
        } catch (err) {
          console.error('Error al cargar estilistas:', err);
        } finally {
          setLoadingStylists(false);
        }
      };
      fetch();
    }
  }, [step, userId, effectiveSalonId, isSuperadmin]);

  const filteredStylists = useMemo(() => {
    return stylists.filter(s =>
      s.name.toLowerCase().includes(stylistQuery.toLowerCase()) ||
      s.specialty.toLowerCase().includes(stylistQuery.toLowerCase())
    );
  }, [stylists, stylistQuery]);

  // Derived: total duration and price from all selected services
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // 5. Load time slots
  useEffect(() => {
    if (step === 'datetime' && selectedStylist && selectedServices.length > 0) {
      const fetch = async () => {
        try {
          setLoadingTimeSlots(true);
          const workStart = selectedStylist.workStartTime || '09:00';
          const workEnd = selectedStylist.workEndTime || '18:00';
          const slots = await api.getAvailableTimeSlots(
            selectedDate,
            selectedStylist.id,
            totalDurationMinutes,
            workStart,
            workEnd,
            selectedStylist.breakStartTime,
            selectedStylist.breakEndTime,
            selectedStylist.isAvailable ?? true
          );
          setTimeSlots(slots);
        } catch (err) {
          console.error('Error fetching time slots:', err);
        } finally {
          setLoadingTimeSlots(false);
        }
      };
      fetch();
    }
  }, [step, selectedDate, selectedStylist, selectedServices, totalDurationMinutes]);

  // Calendar days
  const today = new Date();
  const calendarDays: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    calendarDays.push(d);
  }

  // Navigation helpers
  const prevStep = () => {
    const idx = stepKeys.indexOf(step);
    if (idx > 0) setStep(stepKeys[idx - 1]);
  };

  const nextStep = () => {
    const idx = stepKeys.indexOf(step);
    if (idx < stepKeys.length - 1) setStep(stepKeys[idx + 1]);
  };

  const handleConfirm = async () => {
    if (selectedServices.length === 0) return;
    const clientId = isStaff && selectedClient ? selectedClient.id : userId;
    const primaryService = selectedServices[0];
    try {
      setBookingError(null);
      await api.createAppointment(
        {
          clientId,
          serviceId: primaryService.id,
          serviceIds: selectedServices.map((s) => s.id),
          serviceName: selectedServices.map((s) => s.name).join(', '),
          stylistId: selectedStylist?.id,
          stylistName: selectedStylist?.name,
          appointmentDate: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
          status: 'pendiente',
          isPaid: false,
          paymentMethod: 'efectivo',
          salonId: effectiveSalonId,
        },
        userId
      );
      setIsBooked(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err: any) {
      console.error('Error al crear cita:', err);
      setBookingError(err?.message || 'No se pudo reservar la cita.');
    }
  };

  if (isBooked) {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <Check size={40} />
          </div>
          <h2>¡Cita Reservada!</h2>
          <p>{selectedServices.map((s) => s.name).join(', ')}</p>
          <p className={styles.successDate}>{selectedDate} a las {selectedTime}</p>
          {selectedSalon && <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>{selectedSalon.name}</p>}
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
        {stepLabels.map((s, i) => {
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

      {bookingError && (
        <div style={{ marginBottom: '1rem', color: 'var(--danger-600)', fontWeight: 600 }}>
          {bookingError}
        </div>
      )}

      {/* Step: Select Salon (superadmin only) */}
      {step === 'salon' && isSuperadmin && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>¿En qué salón se reservará la cita?</h3>

          {loadingSalons ? (
            <p>Cargando salones...</p>
          ) : (
            <div className={styles.serviceGrid}>
              {salons.map((salon) => (
                <div
                  key={salon.id}
                  className={`${styles.serviceOption} ${selectedSalon?.id === salon.id ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedSalon(salon);
                    // Reset dependent selections
                    setSelectedClient(null);
                    setSelectedServices([]);
                    setSelectedStylist(null);
                    setSelectedTime('');
                  }}
                >
                  <span className={styles.serviceEmoji}>🏪</span>
                  <span className={styles.serviceName}>{salon.name}</span>
                  {salon.address && <span className={styles.serviceMeta}>{salon.address}</span>}
                </div>
              ))}
            </div>
          )}

          <div className={styles.navButtons}>
            <div />
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={!selectedSalon}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step: Select Client (staff only) */}
      {step === 'client' && isStaff && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>¿Para qué cliente es la cita?</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              icon={<Search size={18} />}
              placeholder="Buscar por nombre, teléfono o email..."
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
            />
          </div>

          {loadingClients ? (
            <p>Cargando clientes...</p>
          ) : (
            <div className={styles.stylistGrid}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`${styles.stylistCard} ${selectedClient?.id === client.id ? styles.selected : ''}`}
                  onClick={() => setSelectedClient(client)}
                >
                  <Avatar name={client.fullName} size="lg" imageUrl={client.avatarUrl} />
                  <div className={styles.stylistInfo}>
                    <span className={styles.stylistName}>{client.fullName}</span>
                    <span className={styles.stylistSpecialty}>
                      {client.role === 'client' ? 'Cliente' : client.role === 'admin' ? 'Admin' : client.role === 'stylist' ? 'Estilista' : client.role}
                    </span>
                    {client.salonId && salonsById.get(client.salonId) && (
                      <span className={styles.stylistDesc}>Salón: {salonsById.get(client.salonId)}</span>
                    )}
                    {client.phone && <span className={styles.stylistDesc}>{client.phone}</span>}
                  </div>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem', color: 'var(--neutral-500)' }}>
                  <p>No se encontraron clientes.</p>
                </div>
              )}
            </div>
          )}

          <div className={styles.navButtons}>
            {isSuperadmin ? (
              <Button variant="ghost" onClick={prevStep} icon={<ChevronLeft size={18} />}>Atrás</Button>
            ) : <div />}
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={!selectedClient}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step: Select Service (Enhanced Catalog — multi-select) */}
      {step === 'service' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>¿Qué servicios deseas?</h3>
          {selectedServices.length > 0 && (
            <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--primary-600)' }}>
              {selectedServices.length} servicio{selectedServices.length > 1 ? 's' : ''} seleccionado{selectedServices.length > 1 ? 's' : ''} — {totalDurationMinutes} min — ${totalPrice.toLocaleString()} MXN
            </p>
          )}

          {/* Category Filters */}
          {!loadingServices && services.length > 0 && (
            <div className={styles.categoryFilters}>
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryBtn} ${activeCategory === cat ? styles.categoryActive : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loadingServices ? (
            <p>Cargando catálogo...</p>
          ) : (
            <div className={styles.catalogGrid}>
              {filteredServicesByCategory.map((srv, i) => {
                const isSelected = selectedServices.some((s) => s.id === srv.id);
                return (
                  <div
                    key={srv.id}
                    className={`${styles.catalogCardWrap} ${isSelected ? styles.catalogCardSelected : ''}`}
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() =>
                      setSelectedServices((prev) =>
                        prev.some((s) => s.id === srv.id)
                          ? prev.filter((s) => s.id !== srv.id)
                          : [...prev, srv]
                      )
                    }
                  >
                    <ServiceCard service={srv} isSelected={isSelected} />
                    {isSelected && (
                      <div className={styles.catalogCheckmark}>
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loadingServices && filteredServicesByCategory.length === 0 && (
            <div className={styles.catalogEmpty}>
              <p>No hay servicios en esta categoría</p>
            </div>
          )}

          <div className={styles.navButtons}>
            {isStaff ? (
              <Button variant="ghost" onClick={prevStep} icon={<ChevronLeft size={18} />}>Atrás</Button>
            ) : <div />}
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={selectedServices.length === 0}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step: Select Stylist */}
      {step === 'stylist' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Selecciona un profesional</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              icon={<Search size={18} />}
              placeholder="Buscar por nombre o especialidad..."
              value={stylistQuery}
              onChange={(e) => setStylistQuery(e.target.value)}
            />
          </div>

          {loadingStylists ? (
            <p>Buscando profesionales...</p>
          ) : (
              <div className={styles.stylistGrid}>
                {filteredStylists.map((sty) => (
                  (() => {
                    const isStylistAvailable = sty.isAvailable !== false;
                    return (
                  <div
                    key={sty.id}
                    className={`${styles.stylistCard} ${selectedStylist?.id === sty.id ? styles.selected : ''} ${!isStylistAvailable ? styles.stylistDisabled : ''}`}
                    onClick={() => isStylistAvailable && setSelectedStylist(sty)}
                  >
                    <Avatar name={sty.name} size="lg" imageUrl={sty.avatarUrl} />
                    <div className={styles.stylistInfo}>
                      <span className={styles.stylistName}>{sty.name}</span>
                      <span className={styles.stylistSpecialty}>{sty.specialty}</span>
                      <p className={styles.stylistDesc}>{sty.description}</p>
                      {!isStylistAvailable && (
                        <span className={styles.stylistUnavailable}>No disponible</span>
                      )}
                    </div>
                  </div>
                    );
                  })()
                ))}
              {filteredStylists.length === 0 && (
                <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem', color: 'var(--neutral-500)' }}>
                  <p>No se encontraron profesionales.</p>
                </div>
              )}
            </div>
          )}

          <div className={styles.navButtons}>
            <Button variant="ghost" onClick={prevStep} icon={<ChevronLeft size={18} />}>Atrás</Button>
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={!selectedStylist}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step: Select Date & Time */}
      {step === 'datetime' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Selecciona fecha y hora</h3>

          <div className={styles.dateScroller}>
            {calendarDays.map((d) => {
              const dateStr = d.toLocaleDateString('sv');
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

          <div style={{ minHeight: '120px' }}>
            {loadingTimeSlots ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: 'var(--neutral-400)' }}>
                Consultando disponibilidad...
              </div>
            ) : timeSlots.length > 0 ? (
              <div className={styles.timeGrid}>
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    className={`${styles.timeSlot} ${selectedTime === slot.time ? styles.timeActive : ''} ${!slot.available ? styles.timeDisabled : ''}`}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    title={!slot.available ? 'Horario ocupado' : 'Disponible'}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-500)' }}>
                No hay horarios disponibles para esta fecha.
              </div>
            )}
          </div>

          <div className={styles.navButtons}>
            <Button variant="ghost" onClick={prevStep} icon={<ChevronLeft size={18} />}>Atrás</Button>
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={!selectedTime}
              icon={<ChevronRight size={18} />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selectedServices.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Confirma tu reserva</h3>

          <Card className={styles.confirmCard}>
            {isSuperadmin && selectedSalon && (
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Salón</span>
                <span className={styles.confirmValue}>{selectedSalon.name}</span>
              </div>
            )}
            {isStaff && selectedClient && (
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Cliente</span>
                <span className={styles.confirmValue}>{selectedClient.fullName}</span>
              </div>
            )}
            {/* Lista de servicios seleccionados */}
            <div className={styles.confirmRow} style={{ alignItems: 'flex-start' }}>
              <span className={styles.confirmLabel}>
                {selectedServices.length > 1 ? 'Servicios' : 'Servicio'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'right' }}>
                {selectedServices.map((s) => (
                  <span key={s.id} className={styles.confirmValue} style={{ fontSize: '0.9rem' }}>
                    {s.name}
                    <span style={{ color: 'var(--neutral-500)', marginLeft: '0.5rem' }}>
                      ({s.durationMinutes} min — ${s.price.toLocaleString()})
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Duración total</span>
              <span className={styles.confirmValue}>{totalDurationMinutes} minutos</span>
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
              <span className={styles.confirmLabel}>Precio total</span>
              <span className={`${styles.confirmValue} ${styles.confirmPrice}`}>
                ${totalPrice.toLocaleString()} MXN
              </span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Pago</span>
              <span className={styles.confirmValue}>Efectivo en el local</span>
            </div>
          </Card>

          <div className={styles.navButtons}>
            <Button variant="ghost" onClick={prevStep} icon={<ChevronLeft size={18} />}>Atrás</Button>
            <Button variant="primary" size="lg" onClick={handleConfirm} icon={<Check size={18} />}>
              Confirmar Reserva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
