'use client';

import React, { useState, useEffect } from 'react';
import styles from './ServicesView.module.css';
import ServiceCard from '@/components/molecules/ServiceCard/ServiceCard';
import { api } from '@/lib/api';
import { Service } from '@/lib/types';

interface ServicesViewProps {
  onBook: () => void;
  userId?: string;
}

export default function ServicesView({ onBook, userId }: ServicesViewProps) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getServices(userId);
        setServices(data);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
        setError('No se pudieron cargar los servicios.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [userId]);

  const categories = ['Todos', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices =
    activeCategory === 'Todos'
      ? services
      : services.filter((s) => s.category === activeCategory);

  if (loading) {
    return <div className={styles.page}><p>Cargando...</p></div>;
  }

  if (error) {
    return <div className={styles.page}><p>{error}</p></div>;
  }

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
