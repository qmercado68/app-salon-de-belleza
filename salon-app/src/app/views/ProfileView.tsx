'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Save, Heart, Shield, Camera } from 'lucide-react';
import styles from './ProfileView.module.css';
import Card from '@/components/atoms/Card/Card';
import Input from '@/components/atoms/Input/Input';
import { SelectInput, TextArea } from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import AlertBanner from '@/components/molecules/AlertBanner/AlertBanner';
import { api } from '@/lib/api';
import { BloodType, Profile, Salon, StylistUnavailability } from '@/lib/types';
import { formatFullName } from '@/lib/name';
import { CAPITAL_BY_DEPARTMENT, DEPARTMENT_OPTIONS, getCityOptionsForDepartment } from '@/lib/colombia';
import { AVATAR_IMAGE_LIMITS, validateImageFile } from '@/lib/imageValidation';

const bloodTypeOptions = [
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
];

const genderOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

const roleOptions = [
  { value: 'client', label: 'Cliente' },
  { value: 'admin', label: 'Administrador' },
  { value: 'stylist', label: 'Estilista' },
  { value: 'superadmin', label: 'Super Admin' },
];

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'terminated', label: 'Retirado' },
];

interface ProfileViewProps {
  userId: string;
  userEmail?: string;
  initialProfile?: Profile;
  currentViewerRole?: string;
}

export default function ProfileView({ userId, userEmail, initialProfile, currentViewerRole }: ProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [unavailability, setUnavailability] = useState<StylistUnavailability[]>([]);
  const [unavailabilityDate, setUnavailabilityDate] = useState(() => new Date().toLocaleDateString('sv'));
  const [unavailabilityAllDay, setUnavailabilityAllDay] = useState(true);
  const [unavailabilityStart, setUnavailabilityStart] = useState('09:00');
  const [unavailabilityEnd, setUnavailabilityEnd] = useState('18:00');
  const [unavailabilityReason, setUnavailabilityReason] = useState('');
  const [savingUnavailability, setSavingUnavailability] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const [data, salonsList] = await Promise.all([
          api.getProfile(userId),
          api.getSalons(),
        ]);
        setProfile(data);
        setSalons(salonsList);
      } catch (err: any) {
        setError(`Error al cargar: ${err?.message ?? JSON.stringify(err)}`);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (!profile || profile.role !== 'stylist') {
      setUnavailability([]);
      return;
    }

    const loadUnavailability = async () => {
      try {
        const data = await api.getStylistUnavailability(profile.id);
        setUnavailability(data);
      } catch (err: any) {
        setError(`Error al cargar disponibilidad: ${err?.message ?? JSON.stringify(err)}`);
      }
    };

    loadUnavailability();
  }, [profile?.id, profile?.role]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setError(null);
      const fullName = formatFullName({
        firstName: profile.firstName,
        secondName: profile.secondName,
        lastName: profile.lastName,
        secondLastName: profile.secondLastName,
      });
      const payload = { ...profile, fullName: fullName || profile.fullName };
      setProfile(payload);
      await api.updateProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setError(null);

    const validationError = await validateImageFile(file, AVATAR_IMAGE_LIMITS);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadingAvatar(true);
      const avatarUrl = await api.uploadAvatar(userId, file);
      const updatedProfile = { ...profile, avatarUrl };
      setProfile(updatedProfile);
      await api.updateProfile({ id: userId, avatarUrl });
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setUploadingAvatar(false);
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUnavailability = async () => {
    if (!profile) return;
    if (!unavailabilityDate) {
      setError('Selecciona una fecha para la no disponibilidad.');
      return;
    }
    if (!unavailabilityAllDay && (!unavailabilityStart || !unavailabilityEnd)) {
      setError('Selecciona un rango horario válido.');
      return;
    }

    try {
      setSavingUnavailability(true);
      setError(null);
      const created = await api.createStylistUnavailability({
        stylistId: profile.id,
        date: unavailabilityDate,
        isAllDay: unavailabilityAllDay,
        startTime: unavailabilityAllDay ? null : unavailabilityStart,
        endTime: unavailabilityAllDay ? null : unavailabilityEnd,
        reason: unavailabilityReason || null,
      });
      setUnavailability((prev) => [created, ...prev]);
      setUnavailabilityReason('');
      setUnavailabilityAllDay(true);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo registrar la no disponibilidad.');
    } finally {
      setSavingUnavailability(false);
    }
  };

  const handleDeleteUnavailability = async (id: string) => {
    try {
      await api.deleteStylistUnavailability(id);
      setUnavailability((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo eliminar el registro.');
    }
  };

  const updateField = (field: string, value: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (['firstName', 'secondName', 'lastName', 'secondLastName'].includes(field)) {
        return {
          ...next,
          fullName: formatFullName({
            firstName: next.firstName,
            secondName: next.secondName,
            lastName: next.lastName,
            secondLastName: next.secondLastName,
          }),
        };
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <AlertBanner
          type="danger"
          title="Error al cargar perfil"
          message={error ?? 'No se pudo cargar el perfil.'}
        />
      </div>
    );
  }

  const isAdmin = currentViewerRole === 'admin' || currentViewerRole === 'superadmin' || profile?.role === 'admin' || profile?.role === 'superadmin';
  const canManageStatus = isAdmin;
  const displayEmail = userEmail ?? profile.email;
  const displayName = formatFullName({
    firstName: profile.firstName,
    secondName: profile.secondName,
    lastName: profile.lastName,
    secondLastName: profile.secondLastName,
  }) || profile.fullName || 'Usuario';
  const departmentOptions = DEPARTMENT_OPTIONS.map((dep) => ({ value: dep, label: dep }));
  const cityOptions = getCityOptionsForDepartment(profile.department || '', profile.city || '')
    .map((city) => ({ value: city, label: city }));
  const isActiveStatus = (profile.status ?? 'active') === 'active';
  const canManageAvailability = (currentViewerRole === 'admin'
    || currentViewerRole === 'superadmin'
    || profile.id === userId) && isActiveStatus;
  const sortedUnavailability = [...unavailability].sort((a, b) => {
    if (a.date === b.date) return (b.startTime || '').localeCompare(a.startTime || '');
    return b.date.localeCompare(a.date);
  });

  const handleDepartmentChange = (value: string) => {
    const city = CAPITAL_BY_DEPARTMENT[value] || '';
    setProfile((prev) => prev ? { ...prev, department: value, city } : prev);
  };

  const handleStatusChange = (value: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const isActive = value === 'active';
      return {
        ...prev,
        status: value as Profile['status'],
        isAvailable: isActive ? (prev.isAvailable ?? true) : false,
        salonId: value === 'terminated' ? '' : prev.salonId,
        terminatedAt: isActive ? null : prev.terminatedAt,
      };
    });
  };

  return (
    <div className={styles.page}>
      {saved && (
        <AlertBanner
          type="info"
          title="Perfil actualizado"
          message="Tus datos han sido guardados correctamente"
          onDismiss={() => setSaved(false)}
        />
      )}
      {error && (
        <AlertBanner
          type="danger"
          title="Error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className={styles.grid}>
        {/* Personal Info */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={20} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Información Personal</h2>
          </div>

          <div className={styles.avatarSection}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                name={displayName}
                imageUrl={profile.avatarUrl}
                size="lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Cambiar foto de perfil"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--color-primary, #6c63ff)',
                  border: '2px solid white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  opacity: uploadingAvatar ? 0.6 : 1,
                }}
              >
                <Camera size={14} color="white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <h3 className={styles.profileName}>{displayName}</h3>
              <p className={styles.profileEmail}>{displayEmail}</p>
              {uploadingAvatar && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-primary, #6c63ff)', marginTop: '4px' }}>
                  Subiendo foto...
                </p>
              )}
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Primer Nombre"
              value={profile.firstName || ''}
              onChange={(e) => updateField('firstName', e.target.value)}
            />
            <Input
              label="Segundo Nombre"
              value={profile.secondName || ''}
              onChange={(e) => updateField('secondName', e.target.value)}
            />
            <Input
              label="Primer Apellido"
              value={profile.lastName || ''}
              onChange={(e) => updateField('lastName', e.target.value)}
            />
            <Input
              label="Segundo Apellido"
              value={profile.secondLastName || ''}
              onChange={(e) => updateField('secondLastName', e.target.value)}
            />
            <Input
              label="Cédula"
              value={profile.documentId || ''}
              onChange={(e) => updateField('documentId', e.target.value)}
            />
            <Input
              label="Fecha de Nacimiento"
              type="date"
              value={profile.birthDate || ''}
              onChange={(e) => updateField('birthDate', e.target.value)}
            />
            <SelectInput
              label="Sexo"
              options={genderOptions}
              value={profile.gender || ''}
              onChange={(e) => updateField('gender', e.target.value)}
            />
            <Input
              label="Teléfono"
              value={profile.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={displayEmail}
              disabled
              onChange={() => {}}
            />
            <Input
              label="Dirección"
              value={profile.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
            <SelectInput
              label="Departamento"
              options={departmentOptions}
              value={profile.department || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
            />
            <SelectInput
              label="Ciudad (capital)"
              options={cityOptions}
              value={profile.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              disabled={!profile.department}
            />
            <SelectInput
              label="Rol en el Sistema"
              options={roleOptions}
              value={profile.role || 'client'}
              onChange={(e) => updateField('role', e.target.value)}
              disabled={!isAdmin}
            />
            <SelectInput
              label="Estado"
              options={statusOptions}
              value={profile.status || 'active'}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={!canManageStatus}
            />
            {!isActiveStatus && (
              <div className={styles.fullSpan} style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                Este usuario no estará disponible para asignación de citas mientras esté inactivo o retirado.
              </div>
            )}
            <SelectInput
              label="Salón Asignado"
              options={[
                { value: '', label: 'Sin salón (global)' },
                ...salons.map(s => ({ value: s.id, label: s.name })),
              ]}
              value={profile.salonId || ''}
              onChange={(e) => updateField('salonId', e.target.value)}
              disabled={!isAdmin}
            />
            {profile.role === 'stylist' && (
              <>
                <Input
                  label="Especialidad"
                  value={profile.specialty || ''}
                  placeholder="Ej. Colorista, Manicurista..."
                  onChange={(e) => updateField('specialty', e.target.value)}
                />
                <div className={styles.fullSpan} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={profile.isAvailable ?? true}
                    onChange={(e) => setProfile((prev) => prev ? { ...prev, isAvailable: e.target.checked } : prev)}
                    disabled={!canManageAvailability}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                    Disponible para atender citas
                  </span>
                </div>
                <Input
                  label="Hora de Entrada (HR:MIN)"
                  type="time"
                  value={profile.workStartTime || '09:00'}
                  onChange={(e) => updateField('workStartTime', e.target.value)}
                  disabled={!canManageAvailability}
                />
                <Input
                  label="Hora de Salida (HR:MIN)"
                  type="time"
                  value={profile.workEndTime || '18:00'}
                  onChange={(e) => updateField('workEndTime', e.target.value)}
                  disabled={!canManageAvailability}
                />
                <Input
                  label="Inicio Descanso (HR:MIN)"
                  type="time"
                  value={profile.breakStartTime || ''}
                  onChange={(e) => updateField('breakStartTime', e.target.value)}
                  disabled={!canManageAvailability}
                />
                <Input
                  label="Fin Descanso (HR:MIN)"
                  type="time"
                  value={profile.breakEndTime || ''}
                  onChange={(e) => updateField('breakEndTime', e.target.value)}
                  disabled={!canManageAvailability}
                />
              </>
            )}
          </div>
        </Card>

        {/* Medical Info */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <Heart size={20} className={styles.medicalIcon} />
            <div>
              <h2 className={styles.cardTitle}>Ficha Médica</h2>
              <p className={styles.cardSubtitle}>
                Información crítica para tu seguridad durante los tratamientos
              </p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <SelectInput
              label="Tipo de Sangre"
              options={bloodTypeOptions}
              value={profile.bloodType}
              onChange={(e) => updateField('bloodType', e.target.value)}
            />
            <div className={styles.fullSpan}>
              <TextArea
                label="Enfermedades Preexistentes"
                placeholder="Ej: Diabetes tipo 2, hipertensión, etc."
                value={profile.medicalConditions}
                onChange={(e) => updateField('medicalConditions', e.target.value)}
              />
            </div>
            <div className={styles.fullSpan}>
              <div className={styles.allergyField}>
                <TextArea
                  label="⚠️ Alergias (CRÍTICO para tratamientos químicos)"
                  placeholder="Ej: Alergia al PPD, látex, formaldehído, amoníaco, parabenos..."
                  value={profile.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                />
                {profile.allergies && (
                  <div className={styles.allergyPreview}>
                    <AlertBanner
                      type="danger"
                      title="Alergias registradas"
                      message={profile.allergies}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.fullSpan}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={profile.medicalFormRequested ?? false}
                  onChange={(e) => setProfile((prev) => prev ? { ...prev, medicalFormRequested: e.target.checked } : prev)}
                />
                Avisar al estilista sobre mi ficha médica (alergias/condiciones).
              </label>
              <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                Si activas esta opción, el estilista verá tus alergias y condiciones en las citas pendientes.
              </p>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className={styles.privacy}>
            <label className={styles.privacyLabel}>
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className={styles.checkbox}
              />
              <span>
                Acepto el <strong>aviso de privacidad</strong> para el manejo de mis datos de salud.
                Esta información solo será visible para mi perfil y el estilista asignado.
              </span>
            </label>
          </div>
        </Card>

        {profile.role === 'stylist' && (
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <Shield size={20} className={styles.cardIcon} />
              <div>
                <h2 className={styles.cardTitle}>Disponibilidad</h2>
                <p className={styles.cardSubtitle}>
                  Configura descansos y registra fechas no disponibles
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <Input
                label="Fecha"
                type="date"
                value={unavailabilityDate}
                onChange={(e) => setUnavailabilityDate(e.target.value)}
                disabled={!canManageAvailability}
              />
              <div className={styles.fullSpan} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={unavailabilityAllDay}
                  onChange={(e) => setUnavailabilityAllDay(e.target.checked)}
                  disabled={!canManageAvailability}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                  No disponible todo el día
                </span>
              </div>
              {!unavailabilityAllDay && (
                <>
                  <Input
                    label="Hora inicio"
                    type="time"
                    value={unavailabilityStart}
                    onChange={(e) => setUnavailabilityStart(e.target.value)}
                    disabled={!canManageAvailability}
                  />
                  <Input
                    label="Hora fin"
                    type="time"
                    value={unavailabilityEnd}
                    onChange={(e) => setUnavailabilityEnd(e.target.value)}
                    disabled={!canManageAvailability}
                  />
                </>
              )}
              <div className={styles.fullSpan}>
                <Input
                  label="Motivo (opcional)"
                  value={unavailabilityReason}
                  onChange={(e) => setUnavailabilityReason(e.target.value)}
                  disabled={!canManageAvailability}
                />
              </div>
            </div>

            <div className={styles.actions} style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                onClick={handleAddUnavailability}
                disabled={!canManageAvailability || savingUnavailability}
              >
                {savingUnavailability ? 'Guardando...' : 'Registrar No Disponibilidad'}
              </Button>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--neutral-700)' }}>Historial</h4>
              {sortedUnavailability.length === 0 ? (
                <p style={{ marginTop: '0.5rem', color: 'var(--neutral-500)' }}>
                  No hay registros de no disponibilidad.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {sortedUnavailability.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        border: '1px solid var(--neutral-100)',
                        borderRadius: '8px',
                      }}
                    >
                      <div>
                        <strong>{item.date}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                          {item.isAllDay ? 'No disponible todo el día' : `${item.startTime} - ${item.endTime}`}
                        </div>
                        {item.reason && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                            {item.reason}
                          </div>
                        )}
                      </div>
                      {canManageAvailability && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUnavailability(item.id)}>
                          Eliminar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Save Button */}
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          icon={<Save size={18} />}
          disabled={!privacyAccepted || saving}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
