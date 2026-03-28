'use client';

import React, { useState } from 'react';
import styles from './ServicesView.module.css';
import ServiceCard from '@/components/molecules/ServiceCard/ServiceCard';
import { mockServices } from '@/lib/mockData';

interface ServicesViewProps {
  onBook: () => void;
}

export default function ServicesView({ onBook }: ServicesViewProps) {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = ['Todos', ...Array.from(new Set(mockServices.map((s) => s.category)))];
  const filteredServices =
    activeCategory === 'Todos'
      ? mockServices
      : mockServices.filter((s) => s.category === activeCategory);

  return (
    <div className={styles.page}>
      {/* Category Filters */}
      <div className={styles.filters}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className={styles.grid}>
        {filteredServices.map((service, i) => (
          <div key={service.id} className={styles.cardWrap} style={{ animationDelay: `${i * 0.08}s` }}>
            <ServiceCard service={service} onBook={onBook} />
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className={styles.empty}>
          <p>No hay servicios en esta categoría</p>
        </div>
      )}
    </div>
  );
}
