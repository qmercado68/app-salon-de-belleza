'use client';

import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, ArrowUpRight } from 'lucide-react';
import styles from './ReportsView.module.css';
import Card from '@/components/atoms/Card/Card';
import StatCard from '@/components/atoms/StatCard/StatCard';

export default function ReportsView() {
  return (
    <div className={styles.reports}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reportes y Estadísticas</h1>
        <p className={styles.subtitle}>Análisis detallado del rendimiento de tu salón</p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <StatCard 
          icon={<DollarSign size={20} />} 
          label="Ingresos Semanales" 
          value="$12,450" 
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <StatCard 
          icon={<Calendar size={20} />} 
          label="Citas Completadas" 
          value="42" 
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard 
          icon={<TrendingUp size={20} />} 
          label="Ticket Promedio" 
          value="$296" 
          trend={{ value: 3, isPositive: true }}
          color="purple"
        />
        <StatCard 
          icon={<BarChart3 size={20} />} 
          label="Tasa de Retención" 
          value="78%" 
          trend={{ value: 5, isPositive: true }}
          color="orange"
        />
      </div>

      <div className={styles.grid}>
        {/* Revenue Chart Placeholder */}
        <Card>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Ingresos Semanales</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Marzo 20-26</span>
          </div>
          <div className={styles.chartPlaceholder}>
            <div className={styles.barChart}>
              <div className={styles.bar} style={{ height: '40%' }} />
              <div className={styles.bar} style={{ height: '60%' }} />
              <div className={styles.bar} style={{ height: '55%' }} />
              <div className={styles.bar} style={{ height: '80%' }} />
              <div className={styles.bar} style={{ height: '95%' }} />
              <div className={styles.bar} style={{ height: '70%' }} />
              <div className={styles.bar} style={{ height: '45%' }} />
            </div>
            <p style={{ fontSize: '0.875rem' }}>Evolución de ventas diarias</p>
          </div>
        </Card>

        {/* Top Stylists Performance */}
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Rendimiento por Estilista</h3>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Estilista</th>
                <th>Servicios</th>
                <th>Ingresos</th>
                <th>Crecimiento</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Ana Rodríguez</td>
                <td>124</td>
                <td>$18,900</td>
                <td><span className={styles.trendUp}><ArrowUpRight size={14} /> 12%</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Lucía Vega</td>
                <td>98</td>
                <td>$14,250</td>
                <td><span className={styles.trendUp}><ArrowUpRight size={14} /> 8%</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Karla Luna</td>
                <td>86</td>
                <td>$12,650</td>
                <td><span className={styles.trendUp}><ArrowUpRight size={14} /> 15%</span></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
