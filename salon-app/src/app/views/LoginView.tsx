'use client';

import React, { useState } from 'react';
import { Scissors, Mail, ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import styles from './LoginView.module.css';
import { CONFIG } from '@/lib/config';
import { signInWithMagicLink } from '@/app/auth/actions';

interface LoginViewProps {
  onLogin?: () => void;
  salonId?: string;
  salonName?: string;
}

export default function LoginView({ onLogin, salonId, salonName }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('email', email);
        if (salonId) {
          formData.append('salon_id', salonId);
        }
        await signInWithMagicLink(formData);
        setSent(true);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al enviar el enlace');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.branding}>
          <div className={styles.logoIcon}>
            <Scissors size={32} />
          </div>
          <h1 className={styles.brandName}>{CONFIG.APP_NAME}</h1>
          <p className={styles.brandTagline}>
            {CONFIG.BRAND.TAGLINE}
          </p>
        </div>
        <div className={styles.features}>
          <div className={styles.feature}>
            <Sparkles size={20} />
            <span>Reserva citas en segundos</span>
          </div>
          <div className={styles.feature}>
            <Sparkles size={20} />
            <span>Perfil de seguridad médica</span>
          </div>
          <div className={styles.feature}>
            <Sparkles size={20} />
            <span>Historial completo de servicios</span>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {salonName ? `Bienvenida a ${salonName}` : 'Bienvenida'}
            </h2>
            <p className={styles.formSubtitle}>
              Ingresa tu email para acceder con Magic Link
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={18} />}
              />
              {error && <p className={styles.errorMessage}>{error}</p>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                icon={<ArrowRight size={18} />}
              >
                {loading ? 'Enviando...' : 'Enviar Magic Link'}
              </Button>
              <p className={styles.note}>
                No necesitas contraseña. Te enviaremos un enlace seguro a tu email.
              </p>
            </form>
          ) : (
            <div className={styles.sentMessage}>
              <div className={styles.sentIcon}>✉️</div>
              <h3>¡Enlace enviado!</h3>
              <p>Revisa tu bandeja de entrada en <strong>{email}</strong></p>
              <p className={styles.redirecting}>Redirigiendo al dashboard...</p>
            </div>
          )}

          {onLogin && (
            <div className={styles.demo}>
              <button className={styles.demoBtn} onClick={onLogin}>
                Acceder con datos demo →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
