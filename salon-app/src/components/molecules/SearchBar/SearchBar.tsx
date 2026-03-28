'use client';

import React from 'react';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBar({
  placeholder = 'Buscar servicios, citas...',
  value = '',
  onChange,
}: SearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <Search size={18} className={styles.icon} />
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <kbd className={styles.shortcut}>⌘K</kbd>
    </div>
  );
}
