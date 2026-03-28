import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  const colors = [
    '#6c63ff', '#e84d75', '#10b981', '#f59e0b',
    '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export default function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${styles.avatar} ${styles[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${styles.avatar} ${styles.initials} ${styles[size]} ${className}`}
      style={{ backgroundColor: getColor(name) }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
