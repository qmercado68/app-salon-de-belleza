'use client';

import React, { useState } from 'react';
import { Save, Heart, Shield } from 'lucide-react';
import styles from './ProfileView.module.css';
import Card from '@/components/atoms/Card/Card';
import Input from '@/components/atoms/Input/Input';
import { SelectInput, TextArea } from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import AlertBanner from '@/components/molecules/AlertBanner/AlertBanner';
import { mockCurrentUser } from '@/lib/mockData';
import { BloodType } from '@/lib/types';

const bloodTypeOptions = [
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
];

export default function ProfileView() {
  const [profile, setProfile] = useState(mockCurrentUser);
  const [saved, setSaved] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
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

      <div className={styles.grid}>
        {/* Personal Info */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={20} className={styles.cardIcon} />
            <h2 className={styles.cardTitle}>Información Personal</h2>
          </div>

          <div className={styles.avatarSection}>
            <Avatar name={profile.fullName} size="lg" />
            <div>
              <h3 className={styles.profileName}>{profile.fullName}</h3>
              <p className={styles.profileEmail}>{profile.email}</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Nombre Completo"
              value={profile.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
            />
            <Input
              label="Teléfono"
              value={profile.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            <Input
              label="Dirección"
              value={profile.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
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
          disabled={!privacyAccepted}
        >
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
