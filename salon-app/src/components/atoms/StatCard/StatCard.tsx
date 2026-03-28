import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: { value: number; isPositive: boolean };
  color?: 'purple' | 'pink' | 'green' | 'orange' | 'blue';
}

export default function StatCard({ icon, value, label, trend, color = 'purple' }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={`${styles.iconWrap} ${styles[color]}`}>
        {icon}
      </div>
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
      {trend && (
        <div className={`${styles.trend} ${trend.isPositive ? styles.positive : styles.negative}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
}
