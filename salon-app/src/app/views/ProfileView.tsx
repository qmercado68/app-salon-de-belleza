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
import { BloodType, Profile, Salon } from '@/lib/types';

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

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setError(null);
      await api.updateProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setUploadingAvatar(true);
      setError(null);
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

  const updateField = (field: string, value: string) => {
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
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
  const displayEmail = userEmail ?? profile.email;

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
                name={profile.fullName}
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
              <h3 className={styles.profileName}>{profile.fullName}</h3>
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
              label="Nombre Completo"
              value={profile.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
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
              label="Rol en el Sistema"
              options={roleOptions}
              value={profile.role || 'client'}
              onChange={(e) => updateField('role', e.target.value)}
              disabled={!isAdmin}
            />
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
                <Input
                  label="Hora de Entrada (HR:MIN)"
                  type="time"
                  value={profile.workStartTime || '09:00'}
                  onChange={(e) => updateField('workStartTime', e.target.value)}
                  disabled={!isAdmin}
                />
                <Input
                  label="Hora de Salida (HR:MIN)"
                  type="time"
                  value={profile.workEndTime || '18:00'}
                  onChange={(e) => updateField('workEndTime', e.target.value)}
                  disabled={!isAdmin}
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
