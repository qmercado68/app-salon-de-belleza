import React from 'react';
import { Clock, DollarSign, Check } from 'lucide-react';
import styles from './ServiceCard.module.css';
import Button from '@/components/atoms/Button/Button';
import { Service } from '@/lib/types';

interface ServiceCardProps {
  service: Service;
  onBook?: (service: Service) => void;
  isSelected?: boolean;
}

const categoryIcons: Record<string, string> = {
  'Cabello': '💇‍♀️',
  'Uñas': '💅',
  'Facial': '🧖‍♀️',
  'Cuerpo': '✨',
  'Maquillaje': '💄',
};

export default function ServiceCard({ service, onBook, isSelected = false }: ServiceCardProps) {
  return (
    <div className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}>
      <div className={styles.header}>
        <span className={styles.emoji}>{categoryIcons[service.category] || '✂️'}</span>
        <span className={styles.category}>{service.category}</span>
        {isSelected && (
          <span className={styles.selectedBadge}>
            <Check size={12} />
          </span>
        )}
      </div>
      <h3 className={styles.name}>{service.name}</h3>
      <p className={styles.description}>{service.description}</p>
      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <Clock size={14} />
          {service.durationMinutes} min
        </span>
        <span className={styles.price}>
          <DollarSign size={14} />
          ${service.price.toLocaleString()}
        </span>
      </div>
      {onBook && (
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => onBook(service)}
          className={styles.bookBtn}
        >
          Reservar
        </Button>
      )}
    </div>
  );
}
