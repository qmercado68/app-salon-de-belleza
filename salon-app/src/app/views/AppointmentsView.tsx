'use client';

import React, { useState, useEffect } from 'react';
import styles from './AppointmentsView.module.css';
import Card from '@/components/atoms/Card/Card';
import AppointmentRow from '@/components/molecules/AppointmentRow/AppointmentRow';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/lib/types';
import { useMemo } from 'react';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import Input from '@/components/atoms/Input/Input';

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

  // Advanced Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('todos');
  const [selectedStylist, setSelectedStylist] = useState('todos');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        // Admin: todas las citas del salón; Cliente: solo sus propias citas
        const isStaff = role === 'admin' || role === 'superadmin';
        const data = isStaff
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

  const isStaff = role === 'admin' || role === 'superadmin';

  // Extract unique services and stylists for the filter dropdowns
  const availableServices = useMemo(() => {
    const services = new Set(appointments.map(a => a.serviceName));
    return Array.from(services).sort();
  }, [appointments]);

  const availableStylists = useMemo(() => {
    const stylists = new Set(appointments.filter(a => a.stylistName).map(a => a.stylistName));
    return Array.from(stylists).sort();
  }, [appointments]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesStatus = filterStatus === 'todas' || a.status === filterStatus;
      const matchesSearch = !searchTerm || 
        a.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.clientPhone && a.clientPhone.includes(searchTerm));
      const matchesService = selectedService === 'todos' || a.serviceName === selectedService;
      const matchesStylist = selectedStylist === 'todos' || a.stylistName === selectedStylist;
      const matchesDate = !selectedDate || a.appointmentDate.startsWith(selectedDate);
      
      return matchesStatus && matchesSearch && matchesService && matchesStylist && matchesDate;
    });
  }, [appointments, filterStatus, searchTerm, selectedService, selectedStylist, selectedDate]);

  // Agrupar por salón para superadmin
  const groupedBySalon = useMemo(() => {
    if (role !== 'superadmin') return null;
    const groups: Record<string, { name: string; appointments: Appointment[] }> = {};
    filtered.forEach(apt => {
      const key = apt.salonId || 'sin-salon';
      if (!groups[key]) {
        groups[key] = { name: apt.salonName || 'Sin salón', appointments: [] };
      }
      groups[key].appointments.push(apt);
    });
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, role]);

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
      {/* Filter Row - Status */}
      <div className={styles.statusFilters}>
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

      {/* Advanced Filter Bar */}
      <div className={styles.advancedFilters}>
        <div className={styles.searchBox}>
          <Input
            placeholder="Buscar cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        
        <div className={styles.selectsGroup}>
          <div className={styles.filterItem}>
            <label>Servicio</label>
            <select 
              className={styles.select}
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="todos">Todos los servicios</option>
              {availableServices.map(s => (
                <option key={s} value={s!}>{s}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>Estilista</label>
            <select 
              className={styles.select}
              value={selectedStylist}
              onChange={(e) => setSelectedStylist(e.target.value)}
            >
              <option value="todos">Todos los estilistas</option>
              {availableStylists.map(s => (
                <option key={s} value={s!}>{s}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>Fecha</label>
            <input 
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {(searchTerm || selectedService !== 'todos' || selectedStylist !== 'todos' || selectedDate) && (
            <button 
              className={styles.resetBtn} 
              onClick={() => {
                setSearchTerm('');
                setSelectedService('todos');
                setSelectedStylist('todos');
                setSelectedDate('');
                setFilterStatus('todas');
              }}
              title="Limpiar filtros"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.resultsCount}>
        Mostrando <strong>{filtered.length}</strong> cita{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Appointments Table */}
      {groupedBySalon ? (
        groupedBySalon.map((group) => (
          <div key={group.name}>
            <h3 className={styles.salonGroupTitle}>{group.name}</h3>
            <Card padding="sm">
              <div className={styles.tableHeader}>
                <span>Servicio</span>
                <span>Fecha</span>
                <span>Estilista</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              <div className={styles.tableBody}>
                {group.appointments.map((apt) => (
                  <AppointmentRow
                    key={apt.id}
                    appointment={apt}
                    showClient
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </Card>
          </div>
        ))
      ) : (
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
        </Card>
      )}
      {filtered.length === 0 && (
        <div className={styles.empty}>
          No hay citas para mostrar
        </div>
      )}
    </div>
  );
}
