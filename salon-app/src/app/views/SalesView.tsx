'use client';

import React from 'react';
import { CreditCard, Banknote, Search, Filter, Download } from 'lucide-react';
import styles from './SalesView.module.css';
import Card from '@/components/atoms/Card/Card';
import StatCard from '@/components/atoms/StatCard/StatCard';
import Button from '@/components/atoms/Button/Button';
import { mockAppointments, mockProductSales } from '@/lib/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesView() {
  const serviceSales = mockAppointments.filter(a => a.status === 'completada' || a.isPaid);
  const productSales = mockProductSales;
  
  return (
    <div className={styles.sales}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ventas y Facturación</h1>
        <p className={styles.subtitle}>Registro histórico de transacciones y pagos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        <StatCard 
          icon={<Banknote size={20} />} 
          label="Ventas del Día" 
          value="$3,850" 
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
        <StatCard 
          icon={<CreditCard size={20} />} 
          label="Ventas este Mes" 
          value="$45,800" 
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
        <StatCard 
          icon={<Download size={20} />} 
          label="Ticket Promedio" 
          value="$320" 
          color="blue"
        />
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700 }}>Transacciones Recientes</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="ghost" size="sm" icon={<Filter size={16} />}>Filtros</Button>
            <Button variant="outline" size="sm" icon={<Download size={16} />}>Exportar</Button>
          </div>
        </div>

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
            {/* Service Sales */}
            {serviceSales.map(sale => (
              <tr key={sale.id}>
                <td style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{sale.id}</td>
                <td>
                  <span className={`${styles.typeBadge} ${styles.typeService}`}>Servicio</span>
                </td>
                <td style={{ fontWeight: 600 }}>{sale.clientName}</td>
                <td>{sale.serviceName}</td>
                <td>{format(new Date(sale.appointmentDate), 'dd MMM yyyy', { locale: es })}</td>
                <td>
                  <div className={styles.paymentMethod}>
                    {sale.paymentMethod === 'tarjeta' ? <CreditCard size={14} /> : <Banknote size={14} />}
                    {sale.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                  </div>
                </td>
                <td className={styles.amount}>$350</td>
                <td>
                  <span className={sale.isPaid ? styles.statusPaid : styles.statusPending}>
                    {sale.isPaid ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
              </tr>
            ))}
            
            {/* Product Sales */}
            {productSales.map(sale => (
              <tr key={sale.id}>
                <td style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>{sale.id}</td>
                <td>
                  <span className={`${styles.typeBadge} ${styles.typeProduct}`}>Producto</span>
                </td>
                <td style={{ fontWeight: 600 }}>Venta Directa</td>
                <td>{sale.productName} (x{sale.quantity})</td>
                <td>{format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: es })}</td>
                <td>
                  <div className={styles.paymentMethod}>
                    {sale.paymentMethod === 'tarjeta' ? <CreditCard size={14} /> : <Banknote size={14} />}
                    {sale.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                  </div>
                </td>
                <td className={styles.amount}>${sale.totalPrice}</td>
                <td>
                  <span className={styles.statusPaid}>Pagado</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
