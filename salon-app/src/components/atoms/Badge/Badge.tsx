import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'pagada' | 'warning' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantMap: Record<string, string> = {
  pendiente: 'warning',
  confirmada: 'info',
  completada: 'success',
  cancelada: 'danger',
  pagada: 'success',
  warning: 'warningAlt',
  info: 'infoAlt',
};

export default function Badge({ variant = 'info', children, size = 'sm' }: BadgeProps) {
  const mappedClass = variantMap[variant] || 'info';
  return (
    <span className={`${styles.badge} ${styles[mappedClass]} ${styles[size]}`}>
      {children}
    </span>
  );
}
