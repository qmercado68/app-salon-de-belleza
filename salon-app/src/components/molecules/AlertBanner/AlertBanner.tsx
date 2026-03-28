import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  type?: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  onDismiss?: () => void;
}

export default function AlertBanner({ type = 'warning', title, message, onDismiss }: AlertBannerProps) {
  return (
    <div className={`${styles.banner} ${styles[type]}`}>
      <AlertTriangle size={20} className={styles.icon} />
      <div className={styles.content}>
        <strong className={styles.title}>{title}</strong>
        <span className={styles.message}>{message}</span>
      </div>
      {onDismiss && (
        <button className={styles.dismiss} onClick={onDismiss}>×</button>
      )}
    </div>
  );
}
