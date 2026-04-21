'use client';

import React from 'react';
import { CreditCard, Banknote, Filter, Download, CheckCircle2, X, TrendingUp, UserCheck, Package, Calendar } from 'lucide-react';
import styles from './SalesView.module.css';
import Card from '@/components/atoms/Card/Card';
import StatCard from '@/components/atoms/StatCard/StatCard';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { DailyReportSummary } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesViewProps {
  userId?: string;
}

export default function SalesView({ userId }: SalesViewProps) {
  const [showReport, setShowReport] = React.useState(false);
  const [reportData, setReportData] = React.useState<DailyReportSummary | null>(null);
  const [todayReport, setTodayReport] = React.useState<DailyReportSummary | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [serviceSales, setServiceSales] = React.useState<any[]>([]);
  const [productSales, setProductSales] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const today = new Date().toLocaleDateString('sv');
        const [transactions, dayReport] = await Promise.all([
          api.getDailyTransactions(today),
          api.getDailyReport(today),
        ]);
        setServiceSales(transactions.filter((t: any) => t.type === 'Servicio'));
        setProductSales(transactions.filter((t: any) => t.type === 'Producto'));
        setTodayReport(dayReport);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [showReport]);

  const handleCloseCash = async () => {
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('sv');
      const data = await api.getDailyReport(today);
      setReportData(data);
      setShowReport(true);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error al generar el reporte de cierre.');
    } finally {
      setLoading(false);
    }
  };

  const allTransactions = [...serviceSales, ...productSales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const totalCount = allTransactions.length;
  const avgTicket = totalCount > 0 && todayReport ? todayReport.totalSales / totalCount : 0;

  return (
    <div className={styles.sales}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ventas y Facturación</h1>
          <p className={styles.subtitle}>Registro histórico de transacciones y pagos</p>
        </div>
        <Button
          variant="primary"
          icon={<CheckCircle2 size={18} />}
          onClick={handleCloseCash}
          disabled={loading}
        >
          {loading ? 'Generando...' : 'Cerrar Caja del Día'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        <StatCard
          icon={<Banknote size={20} />}
          label="Ventas del Día"
          value={`$${todayReport?.totalSales.toFixed(2) ?? '0.00'}`}
          color="green"
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Transacciones Hoy"
          value={String(totalCount)}
          color="purple"
        />
        <StatCard
          icon={<Download size={20} />}
          label="Ticket Promedio"
          value={`$${avgTicket.toFixed(2)}`}
          color="blue"
        />
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700 }}>Transacciones de Hoy</h3>
        </div>

        {allTransactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--neutral-400)', padding: '2rem' }}>
            No hay transacciones registradas hoy.
          </p>
        ) : (
          <table className={styles.transactionsTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Concepto</th>
                <th>Fecha</th>
                <th>Método</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {allTransactions.map(sale => (
                <tr key={sale.id + sale.concept}>
                  <td style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{sale.id.substring(0, 8)}...</td>
                  <td>
                    <span className={`${styles.typeBadge} ${sale.type === 'Servicio' ? styles.typeService : styles.typeProduct}`}>
                      {sale.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{sale.clientName}</td>
                  <td>{sale.concept}</td>
                  <td>{format(new Date(sale.date), 'dd MMM yyyy HH:mm', { locale: es })}</td>
                  <td>
                    <div className={styles.paymentMethod}>
                      {sale.paymentMethod === 'tarjeta' ? <CreditCard size={14} /> : <Banknote size={14} />}
                      {sale.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                    </div>
                  </td>
                  <td className={styles.amount}>${sale.amount.toLocaleString()}</td>
                  <td>
                    <span className={styles.statusPaid}>{sale.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* REPORT MODAL */}
      {showReport && reportData && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <div className={styles.modalHeader}>
              <h2>Cierre de Caja</h2>
              <button className={styles.closeBtn} onClick={() => setShowReport(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.reportDate}>
              <Calendar size={16} />
              <span>{format(new Date(reportData.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
            </div>

            <div className={styles.mainTotalSection}>
              <div className={styles.mainTotalLabel}>Total General en Caja</div>
              <div className={styles.mainTotalValue}>${reportData.totalSales.toLocaleString()}</div>
            </div>

            <div className={styles.reportGrid}>
              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                  <Banknote size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Efectivo Cobrado</span>
                  <span className={styles.reportCardValue}>${reportData.cashTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--purple-50)', color: 'var(--purple-600)' }}>
                  <CreditCard size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Tarjeta / Transferencia</span>
                  <span className={styles.reportCardValue}>${reportData.cardTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
                  <UserCheck size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Ventas de Servicios ({reportData.appointmentsCount})</span>
                  <span className={styles.reportCardValue}>${reportData.servicesTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
                  <Package size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Ventas de Bodega ({reportData.productsCount})</span>
                  <span className={styles.reportCardValue}>${reportData.productsTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {reportData.topStylist && (
              <div className={styles.topStylistCard}>
                <TrendingUp size={20} className={styles.topIcon} />
                <div className={styles.topStylistInfo}>
                  <span className={styles.topLabel}>Colaborador(a) con más ventas</span>
                  <span className={styles.topValue}>{reportData.topStylist.name}</span>
                </div>
                <div className={styles.topAmount}>${reportData.topStylist.amount.toLocaleString()}</div>
              </div>
            )}

            <div className={styles.modalFooter}>
              <Button variant="outline" icon={<Download size={18} />} fullWidth>Descargar Reporte PDF</Button>
              <Button variant="primary" onClick={() => setShowReport(false)} fullWidth>Confirmar y Finalizar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
