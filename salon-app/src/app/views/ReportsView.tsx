'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Users, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from './ReportsView.module.css';
import Card from '@/components/atoms/Card/Card';
import StatCard from '@/components/atoms/StatCard/StatCard';
import { api } from '@/lib/api';
import { DailyReportSummary } from '@/lib/types';

interface ReportsViewProps {
  userId?: string;
}

export default function ReportsView({ userId }: ReportsViewProps) {
  const [todayReport, setTodayReport] = useState<DailyReportSummary | null>(null);
  const [weekReports, setWeekReports] = useState<DailyReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    loadReports();
  }, [selectedDate]);

  const loadReports = async () => {
    try {
      setLoading(true);

      // Cargar reporte del día seleccionado
      const dayReport = await api.getDailyReport(selectedDate);
      setTodayReport(dayReport);

      // Cargar últimos 7 días para la gráfica
      const reports: DailyReportSummary[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        try {
          const r = await api.getDailyReport(dateStr);
          reports.push(r);
        } catch {
          reports.push({
            date: dateStr,
            totalSales: 0, cashTotal: 0, cardTotal: 0,
            servicesTotal: 0, productsTotal: 0,
            appointmentsCount: 0, productsCount: 0,
          });
        }
      }
      setWeekReports(reports);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  const weekTotal = weekReports.reduce((sum, r) => sum + r.totalSales, 0);
  const weekAppointments = weekReports.reduce((sum, r) => sum + r.appointmentsCount, 0);
  const weekProducts = weekReports.reduce((sum, r) => sum + r.productsCount, 0);
  const avgTicket = weekAppointments + weekProducts > 0
    ? weekTotal / (weekAppointments + weekProducts)
    : 0;

  // Max para escalar las barras
  const maxDaySales = Math.max(...weekReports.map(r => r.totalSales), 1);

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es', { weekday: 'short' });
  };

  if (loading) {
    return (
      <div className={styles.reports}>
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className={styles.reports}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reportes y Estadísticas</h1>
          <p className={styles.subtitle}>Datos reales de tu salón</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '0.5rem 1rem', borderRadius: 8,
            border: '1px solid var(--neutral-200)', fontSize: '0.875rem',
          }}
        />
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          icon={<DollarSign size={20} />}
          label="Ingresos Semana"
          value={`$${weekTotal.toFixed(2)}`}
          color="green"
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Citas Semana"
          value={String(weekAppointments)}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Ticket Promedio"
          value={`$${avgTicket.toFixed(2)}`}
          color="purple"
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Productos Vendidos"
          value={String(weekProducts)}
          color="orange"
        />
      </div>

      <div className={styles.grid}>
        {/* Gráfica de barras - últimos 7 días */}
        <Card>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Ventas Últimos 7 Días</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
              {weekReports[0]?.date} — {weekReports[weekReports.length - 1]?.date}
            </span>
          </div>
          <div className={styles.chartPlaceholder}>
            <div className={styles.barChart}>
              {weekReports.map((r, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--neutral-500)' }}>
                    {r.totalSales > 0 ? `$${r.totalSales.toFixed(0)}` : ''}
                  </span>
                  <div
                    className={styles.bar}
                    style={{ height: `${Math.max((r.totalSales / maxDaySales) * 100, 4)}%` }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--neutral-400)' }}>
                    {formatDay(r.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Detalle del día seleccionado */}
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
            Detalle del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          {todayReport ? (
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Cantidad</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Servicios (citas)</td>
                  <td>{todayReport.appointmentsCount}</td>
                  <td>${todayReport.servicesTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Productos vendidos</td>
                  <td>{todayReport.productsCount}</td>
                  <td>${todayReport.productsTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Efectivo</td>
                  <td>—</td>
                  <td>${todayReport.cashTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Tarjeta / Transferencia</td>
                  <td>—</td>
                  <td>${todayReport.cardTotal.toFixed(2)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--neutral-200)' }}>
                  <td style={{ fontWeight: 800, fontSize: '1rem' }}>Total del Día</td>
                  <td></td>
                  <td style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--success-600)' }}>
                    ${todayReport.totalSales.toFixed(2)}
                  </td>
                </tr>
                {todayReport.topStylist && (
                  <tr>
                    <td style={{ fontWeight: 600 }}>
                      <Star size={14} style={{ marginRight: 4, verticalAlign: 'middle', color: '#f59e0b' }} />
                      Top Estilista
                    </td>
                    <td>{todayReport.topStylist.name}</td>
                    <td>${todayReport.topStylist.amount.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--neutral-400)', textAlign: 'center', padding: '2rem' }}>
              No hay datos para esta fecha.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
