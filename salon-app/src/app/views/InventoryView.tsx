'use client';

import React from 'react';
import { Package, Plus, Search, AlertCircle, ShoppingBag } from 'lucide-react';
import styles from './InventoryView.module.css';
import Card from '@/components/atoms/Card/Card';
import Button from '@/components/atoms/Button/Button';
import { mockProducts } from '@/lib/mockData';

export default function InventoryView() {
  return (
    <div className={styles.inventory}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventario de Productos</h1>
          <p className={styles.subtitle}>Gestión de catálogo, existencias y precios</p>
        </div>
        <Button icon={<Plus size={18} />}>Nuevo Producto</Button>
      </div>

      <div className={styles.inventoryGrid}>
        {mockProducts.map((product) => (
          <Card key={product.id} className={styles.productCard}>
            <div className={styles.productHeader}>
              <h3 className={styles.productTitle}>{product.name}</h3>
              <span className={styles.productPrice}>${product.price}</span>
            </div>
            <p className={styles.productDesc}>{product.description}</p>
            <div className={styles.productMeta}>
              <div className={`${styles.stockBadge} ${product.stock < 10 ? styles.lowStock : styles.normalStock}`}>
                {product.stock < 10 ? <AlertCircle size={14} /> : <Package size={14} />}
                <span>{product.stock} unidades</span>
              </div>
              <span className={styles.categoryTag}>{product.category}</span>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <Button variant="outline" size="sm" fullWidth>Editar</Button>
              <Button variant="ghost" size="sm" icon={<ShoppingBag size={16} />} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
