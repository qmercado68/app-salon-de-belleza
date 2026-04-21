'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Star, CreditCard, Banknote, Download, CheckCircle2, X, UserCheck, Package } from 'lucide-react';
import styles from './ReportsView.module.css';
import Card from '@/components/atoms/Card/Card';
import StatCard from '@/components/atoms/StatCard/StatCard';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { DailyReportSummary, ProductSoldReportDetailRow, ProductSoldReportFilters, StylistServiceReportDetailRow, StylistServiceReportFilters } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportsViewProps {
  userId?: string;
}

export default function ReportsView({ userId }: ReportsViewProps) {
  const today = new Date().toLocaleDateString('sv');
  const startMonth = new Date();
  startMonth.setDate(1);

  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'stylist' | 'products'>('summary');
  const [todayReport, setTodayReport] = useState<DailyReportSummary | null>(null);
  const [weekReports, setWeekReports] = useState<DailyReportSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('sv');
  });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReportData, setCloseReportData] = useState<DailyReportSummary | null>(null);
  const [salesDate, setSalesDate] = useState(today);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [serviceSales, setServiceSales] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [salesDayReport, setSalesDayReport] = useState<DailyReportSummary | null>(null);

  const [stylistFilters, setStylistFilters] = useState<StylistServiceReportFilters>({
    startDate: startMonth.toLocaleDateString('sv'),
    endDate: today,
    status: 'todos',
    includeClients: false,
  });
  const [stylistDetailRows, setStylistDetailRows] = useState<StylistServiceReportDetailRow[]>([]);
  const [stylistLoading, setStylistLoading] = useState(true);
  const [stylistError, setStylistError] = useState<string | null>(null);

  const [productsFilters, setProductsFilters] = useState<ProductSoldReportFilters>({
    startDate: startMonth.toLocaleDateString('sv'),
    endDate: today,
    includeClients: false,
  });
  const [productRows, setProductRows] = useState<ProductSoldReportDetailRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [selectedDate, userId]);

  useEffect(() => {
    loadSales();
  }, [salesDate, userId]);

  useEffect(() => {
    loadStylistReport();
  }, [stylistFilters, userId]);

  useEffect(() => {
    loadProductsReport();
  }, [productsFilters, userId]);

  const loadReports = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);

      // Cargar reporte del día seleccionado
      const dayReport = await api.getDailyReport(selectedDate);
      setTodayReport(dayReport);

      // Cargar últimos 7 días para la gráfica
      const reports: DailyReportSummary[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('sv');
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
      setSummaryError('No se pudieron cargar los reportes de resumen.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      setSalesLoading(true);
      setSalesError(null);
      const [transactions, dayReport] = await Promise.all([
        api.getDailyTransactions(salesDate),
        api.getDailyReport(salesDate),
      ]);
      setServiceSales(transactions.filter((t: any) => t.type === 'Servicio'));
      setProductSales(transactions.filter((t: any) => t.type === 'Producto'));
      setSalesDayReport(dayReport);
    } catch (err) {
      console.error('Error cargando ventas:', err);
      setSalesError('No se pudo cargar el historial de ventas.');
    } finally {
      setSalesLoading(false);
    }
  };

  const loadStylistReport = async () => {
    try {
      setStylistLoading(true);
      setStylistError(null);
      const rows = await api.getStylistServiceReportDetails(stylistFilters, userId);
      setStylistDetailRows(rows);
    } catch (err) {
      console.error('Error cargando reporte por estilista:', err);
      setStylistError('No se pudo cargar el reporte Estilista por Servicio.');
    } finally {
      setStylistLoading(false);
    }
  };

  const loadProductsReport = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const rows = await api.getProductsSoldReportDetails(productsFilters, userId);
      setProductRows(rows);
    } catch (err) {
      console.error('Error cargando reporte de productos vendidos:', err);
      setProductsError('No se pudo cargar el reporte de productos vendidos.');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCloseCash = async () => {
    try {
      setSalesLoading(true);
      const data = await api.getDailyReport(salesDate);
      setCloseReportData(data);
      setShowCloseModal(true);
    } catch (err) {
      console.error('Error generating report:', err);
      setSalesError('No fue posible generar el cierre de caja.');
    } finally {
      setSalesLoading(false);
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

  const allTransactions = [...serviceSales, ...productSales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const totalCount = allTransactions.length;
  const salesAvgTicket = totalCount > 0 && salesDayReport ? salesDayReport.totalSales / totalCount : 0;

  const paymentLabel = (paymentMethod: string) => {
    if (paymentMethod === 'tarjeta') return 'Tarjeta';
    if (paymentMethod === 'transferencia') return 'Transferencia';
    return 'Efectivo';
  };

  const appointmentStatusLabel = (status: string) => {
    if (status === 'confirmada') return 'Confirmada';
    if (status === 'completada') return 'Completada';
    if (status === 'cancelada') return 'Cancelada';
    return 'Pendiente';
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return format(d, 'dd/MM/yyyy HH:mm');
  };

  const handleExportStylistExcel = async () => {
    if (!stylistDetailRows.length) return;
    const XLSX = await import('xlsx');
    const exportRows = stylistDetailRows.map((row) => ({
      Factura: row.invoiceNumber || '',
      Estilista: row.stylistName,
      Servicio: row.serviceName,
      Fecha: format(new Date(`${row.appointmentDate}T12:00:00`), 'dd/MM/yyyy'),
      Hora: row.appointmentTime,
      Estado: appointmentStatusLabel(row.status),
      Pago: row.isPaid ? 'Pagado' : 'No pagado',
      Completada: formatDateTime(row.completedAt),
      Pagada: formatDateTime(row.paidAt),
      'Desc. %': Number(row.discountPercentage || 0),
      Descuento: Number(row.discountAmount || 0),
      Valor: row.amount,
      Cliente: row.clientName || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EstilistaServicio');

    const fileName = `reporte-estilista-servicio-${stylistFilters.startDate}_${stylistFilters.endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const productStatusLabel = (status: string) => {
    if (status === 'cancelled') return 'Cancelada';
    if (status === 'refunded') return 'Reembolsada';
    return 'Completada';
  };

  const handleExportProductsExcel = async () => {
    if (!productRows.length) return;
    const XLSX = await import('xlsx');
    const exportRows = productRows.map((row) => ({
      Factura: row.invoiceNumber || '',
      Producto: row.productName,
      Fecha: format(new Date(`${row.saleDate}T12:00:00`), 'dd/MM/yyyy'),
      Hora: row.saleTime,
      Cantidad: row.quantity,
      'Precio Unitario': row.unitPrice,
      'Desc. %': Number(row.discountPercentage || 0),
      Descuento: Number(row.discountAmount || 0),
      Subtotal: row.subtotal,
      Vendedor: row.sellerName,
      Estado: productStatusLabel(row.status),
      'Método de pago': paymentLabel(row.paymentMethod),
      Cliente: row.clientName || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProductosVendidos');
    const fileName = `reporte-productos-vendidos-${productsFilters.startDate}_${productsFilters.endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className={styles.reports}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reportes y Estadísticas</h1>
          <p className={styles.subtitle}>Resumen, historial de ventas y reporte por estilista</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'summary' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Resumen
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'sales' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Historial de Ventas
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'stylist' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('stylist')}
        >
          Estilista por Servicio
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'products' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Productos Vendidos
        </button>
      </div>

      {activeTab === 'summary' && (
        <>
          <div className={styles.filterRow}>
            <label className={styles.filterLabel} htmlFor="summary-date">Fecha</label>
            <input
              id="summary-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.input}
            />
          </div>

          {summaryError && <p className={styles.errorText}>{summaryError}</p>}

          {summaryLoading ? (
            <p className={styles.loadingText}>Cargando reportes...</p>
          ) : (
            <>
              <div className={styles.statsGrid}>
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
                <Card>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Ventas Últimos 7 Días</h3>
                    <span className={styles.cardCaption}>
                      {weekReports[0]?.date} — {weekReports[weekReports.length - 1]?.date}
                    </span>
                  </div>
                  <div className={styles.chartPlaceholder}>
                    <div className={styles.barChart}>
                      {weekReports.map((r, i) => (
                        <div key={i} className={styles.barCol}>
                          <span className={styles.barValue}>
                            {r.totalSales > 0 ? `$${r.totalSales.toFixed(0)}` : ''}
                          </span>
                          <div
                            className={styles.bar}
                            style={{ height: `${Math.max((r.totalSales / maxDaySales) * 100, 4)}%` }}
                          />
                          <span className={styles.barDay}>{formatDay(r.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className={styles.cardTitle}>
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
                          <td className={styles.strongCell}>Servicios (citas)</td>
                          <td>{todayReport.appointmentsCount}</td>
                          <td>${todayReport.servicesTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className={styles.strongCell}>Productos vendidos</td>
                          <td>{todayReport.productsCount}</td>
                          <td>${todayReport.productsTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className={styles.strongCell}>Efectivo</td>
                          <td>—</td>
                          <td>${todayReport.cashTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className={styles.strongCell}>Tarjeta / Transferencia</td>
                          <td>—</td>
                          <td>${todayReport.cardTotal.toFixed(2)}</td>
                        </tr>
                        <tr className={styles.totalRow}>
                          <td className={styles.totalCell}>Total del Día</td>
                          <td />
                          <td className={styles.totalAmount}>
                            ${todayReport.totalSales.toFixed(2)}
                          </td>
                        </tr>
                        {todayReport.topStylist && (
                          <tr>
                            <td className={styles.strongCell}>
                              <Star size={14} className={styles.starIcon} />
                              Top Estilista
                            </td>
                            <td>{todayReport.topStylist.name}</td>
                            <td>${todayReport.topStylist.amount.toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p className={styles.emptyText}>No hay datos para esta fecha.</p>
                  )}
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'sales' && (
        <>
          <div className={styles.salesActions}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="sales-date">Fecha</label>
              <input
                id="sales-date"
                type="date"
                value={salesDate}
                onChange={(e) => setSalesDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <Button
              variant="primary"
              icon={<CheckCircle2 size={18} />}
              onClick={handleCloseCash}
              disabled={salesLoading}
            >
              {salesLoading ? 'Generando...' : 'Cerrar Caja del Día'}
            </Button>
          </div>

          {salesError && <p className={styles.errorText}>{salesError}</p>}

          <div className={styles.statsGrid}>
            <StatCard
              icon={<Banknote size={20} />}
              label="Ventas del Día"
              value={`$${salesDayReport?.totalSales.toFixed(2) ?? '0.00'}`}
              color="green"
            />
            <StatCard
              icon={<CreditCard size={20} />}
              label="Transacciones"
              value={String(totalCount)}
              color="purple"
            />
            <StatCard
              icon={<Download size={20} />}
              label="Ticket Promedio"
              value={`$${salesAvgTicket.toFixed(2)}`}
              color="blue"
            />
          </div>

          <Card>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Transacciones del Día</h3>
            </div>

            {salesLoading ? (
              <p className={styles.loadingText}>Cargando transacciones...</p>
            ) : allTransactions.length === 0 ? (
              <p className={styles.emptyText}>No hay transacciones registradas para esta fecha.</p>
            ) : (
              <table className={styles.transactionsTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Factura</th>
                    <th>Tipo</th>
                    <th>Cliente</th>
                    <th>Concepto</th>
                    <th>Fecha</th>
                    <th>Método</th>
                    <th>Desc. %</th>
                    <th>Descuento</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((sale) => (
                    <tr key={`${sale.id}-${sale.concept}-${sale.date}`}>
                      <td className={styles.idCell}>{sale.id.substring(0, 8)}...</td>
                      <td>{sale.invoiceNumber || '—'}</td>
                      <td>
                        <span className={`${styles.typeBadge} ${sale.type === 'Servicio' ? styles.typeService : styles.typeProduct}`}>
                          {sale.type}
                        </span>
                      </td>
                      <td className={styles.strongCell}>{sale.clientName}</td>
                      <td>{sale.concept}</td>
                      <td>{format(new Date(sale.date), 'dd MMM yyyy HH:mm', { locale: es })}</td>
                      <td>
                        <div className={styles.paymentMethod}>
                          {sale.paymentMethod === 'efectivo' ? <Banknote size={14} /> : <CreditCard size={14} />}
                          {paymentLabel(sale.paymentMethod)}
                        </div>
                      </td>
                      <td>{Number(sale.discountPercentage || 0).toFixed(2)}%</td>
                      <td>${Number(sale.discountAmount || 0).toLocaleString()}</td>
                      <td className={styles.amount}>${sale.amount.toLocaleString()}</td>
                      <td><span className={styles.statusPaid}>{sale.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {activeTab === 'stylist' && (
        <>
          <div className={styles.stylistFilters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="stylist-start">Fecha inicial</label>
              <input
                id="stylist-start"
                type="date"
                value={stylistFilters.startDate}
                onChange={(e) => setStylistFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className={styles.input}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="stylist-end">Fecha final</label>
              <input
                id="stylist-end"
                type="date"
                value={stylistFilters.endDate}
                onChange={(e) => setStylistFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className={styles.input}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="stylist-status">Estado</label>
              <select
                id="stylist-status"
                value={stylistFilters.status}
                onChange={(e) => setStylistFilters((prev) => ({ ...prev, status: e.target.value as StylistServiceReportFilters['status'] }))}
                className={styles.select}
              >
                <option value="pagados">Pagados</option>
                <option value="pendientes_facturar">Pendientes por facturar</option>
                <option value="cancelados">Cancelados</option>
                <option value="todos">Todos</option>
              </select>
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={Boolean(stylistFilters.includeClients)}
                onChange={(e) => setStylistFilters((prev) => ({ ...prev, includeClients: e.target.checked }))}
              />
              Incluir nombre del cliente
            </label>
          </div>

          {stylistError && <p className={styles.errorText}>{stylistError}</p>}

          <Card>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Reporte Estilista por Servicio</h3>
              <Button
                variant="outline"
                icon={<Download size={16} />}
                onClick={handleExportStylistExcel}
                disabled={stylistLoading || stylistDetailRows.length === 0}
              >
                Exportar Excel
              </Button>
            </div>

            {stylistLoading ? (
              <p className={styles.loadingText}>Cargando reporte...</p>
            ) : stylistDetailRows.length === 0 ? (
              <p className={styles.emptyText}>No hay servicios para el filtro seleccionado.</p>
            ) : (
              <table className={styles.transactionsTable}>
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Estilista</th>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Completada</th>
                    <th>Pagada</th>
                    <th>Desc. %</th>
                    <th>Descuento</th>
                    <th>Valor</th>
                    {stylistFilters.includeClients && <th>Cliente</th>}
                  </tr>
                </thead>
                <tbody>
                  {stylistDetailRows.map((row) => (
                    <tr key={row.appointmentId}>
                      <td>{row.invoiceNumber || '—'}</td>
                      <td className={styles.strongCell}>{row.stylistName}</td>
                      <td>{row.serviceName}</td>
                      <td>{format(new Date(`${row.appointmentDate}T12:00:00`), 'dd/MM/yyyy')}</td>
                      <td>{row.appointmentTime}</td>
                      <td>{appointmentStatusLabel(row.status)}</td>
                      <td>{row.isPaid ? 'Pagado' : 'No pagado'}</td>
                      <td>{formatDateTime(row.completedAt)}</td>
                      <td>{formatDateTime(row.paidAt)}</td>
                      <td>{Number(row.discountPercentage || 0).toFixed(2)}%</td>
                      <td>${Number(row.discountAmount || 0).toLocaleString()}</td>
                      <td className={styles.amount}>${row.amount.toLocaleString()}</td>
                      {stylistFilters.includeClients && (
                        <td>{row.clientName || '—'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {activeTab === 'products' && (
        <>
          <div className={styles.stylistFilters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="products-start">Fecha inicial</label>
              <input
                id="products-start"
                type="date"
                value={productsFilters.startDate}
                onChange={(e) => setProductsFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className={styles.input}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="products-end">Fecha final</label>
              <input
                id="products-end"
                type="date"
                value={productsFilters.endDate}
                onChange={(e) => setProductsFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className={styles.input}
              />
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={Boolean(productsFilters.includeClients)}
                onChange={(e) => setProductsFilters((prev) => ({ ...prev, includeClients: e.target.checked }))}
              />
              Incluir cliente
            </label>
          </div>

          {productsError && <p className={styles.errorText}>{productsError}</p>}

          <Card>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Reporte Productos Vendidos</h3>
              <Button
                variant="outline"
                icon={<Download size={16} />}
                onClick={handleExportProductsExcel}
                disabled={productsLoading || productRows.length === 0}
              >
                Exportar Excel
              </Button>
            </div>

            {productsLoading ? (
              <p className={styles.loadingText}>Cargando reporte...</p>
            ) : productRows.length === 0 ? (
              <p className={styles.emptyText}>No hay productos vendidos para el filtro seleccionado.</p>
            ) : (
              <table className={styles.transactionsTable}>
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Producto</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Desc. %</th>
                    <th>Descuento</th>
                    <th>Subtotal</th>
                    <th>Vendedor</th>
                    <th>Estado</th>
                    <th>Método</th>
                    {productsFilters.includeClients && <th>Cliente</th>}
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, index) => (
                    <tr key={`${row.saleId}-${row.productId || row.productName}-${index}`}>
                      <td>{row.invoiceNumber || '—'}</td>
                      <td className={styles.strongCell}>{row.productName}</td>
                      <td>{format(new Date(`${row.saleDate}T12:00:00`), 'dd/MM/yyyy')}</td>
                      <td>{row.saleTime}</td>
                      <td>{row.quantity}</td>
                      <td>${row.unitPrice.toLocaleString()}</td>
                      <td>{Number(row.discountPercentage || 0).toFixed(2)}%</td>
                      <td>${Number(row.discountAmount || 0).toLocaleString()}</td>
                      <td className={styles.amount}>${row.subtotal.toLocaleString()}</td>
                      <td>{row.sellerName}</td>
                      <td>{productStatusLabel(row.status)}</td>
                      <td>{paymentLabel(row.paymentMethod)}</td>
                      {productsFilters.includeClients && <td>{row.clientName || '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {showCloseModal && closeReportData && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <div className={styles.modalHeader}>
              <h2>Cierre de Caja</h2>
              <button className={styles.closeBtn} onClick={() => setShowCloseModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.reportDate}>
              <Calendar size={16} />
              <span>{format(new Date(closeReportData.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
            </div>

            <div className={styles.mainTotalSection}>
              <div className={styles.mainTotalLabel}>Total General en Caja</div>
              <div className={styles.mainTotalValue}>${closeReportData.totalSales.toLocaleString()}</div>
            </div>

            <div className={styles.reportGrid}>
              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                  <Banknote size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Efectivo Cobrado</span>
                  <span className={styles.reportCardValue}>${closeReportData.cashTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--purple-50)', color: 'var(--purple-600)' }}>
                  <CreditCard size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Tarjeta / Transferencia</span>
                  <span className={styles.reportCardValue}>${closeReportData.cardTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
                  <UserCheck size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Ventas de Servicios ({closeReportData.appointmentsCount})</span>
                  <span className={styles.reportCardValue}>${closeReportData.servicesTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.reportCard}>
                <div className={styles.reportCardIcon} style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
                  <Package size={20} />
                </div>
                <div className={styles.reportCardInfo}>
                  <span className={styles.reportCardLabel}>Ventas de Bodega ({closeReportData.productsCount})</span>
                  <span className={styles.reportCardValue}>${closeReportData.productsTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {closeReportData.topStylist && (
              <div className={styles.topStylistCard}>
                <TrendingUp size={20} className={styles.topIcon} />
                <div className={styles.topStylistInfo}>
                  <span className={styles.topLabel}>Colaborador(a) con más ventas</span>
                  <span className={styles.topValue}>{closeReportData.topStylist.name}</span>
                </div>
                <div className={styles.topAmount}>${closeReportData.topStylist.amount.toLocaleString()}</div>
              </div>
            )}

            <div className={styles.modalFooter}>
              <Button variant="outline" icon={<Download size={18} />} fullWidth>Descargar Reporte PDF</Button>
              <Button variant="primary" onClick={() => setShowCloseModal(false)} fullWidth>Confirmar y Finalizar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
