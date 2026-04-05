'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import styles from './TercerosView.module.css';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { Tercero } from '@/lib/types';

interface TercerosViewProps {
  userId?: string;
}

const EMPTY_FORM = {
  nit: '',
  nombre: '',
  direccion: '',
  telefono: '',
  departamento: '',
  ciudad: '',
};

export default function TercerosView({ userId }: TercerosViewProps) {
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tercero | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadTerceros = async () => {
    try {
      setLoading(true);
      const data = await api.getTerceros();
      setTerceros(data);
    } catch (err) {
      console.error('Error cargando terceros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerceros();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (t: Tercero) => {
    setEditing(t);
    setForm({
      nit: t.nit,
      nombre: t.nombre,
      direccion: t.direccion || '',
      telefono: t.telefono || '',
      departamento: t.departamento || '',
      ciudad: t.ciudad || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nit || !form.nombre) {
      alert('NIT y Nombre son obligatorios.');
      return;
    }

    // Validar duplicado por NIT
    const duplicado = terceros.find(t =>
      t.nit.toLowerCase() === form.nit.toLowerCase() && (!editing || t.id !== editing.id)
    );
    if (duplicado) {
      alert(`Ya existe un tercero con NIT "${form.nit}": ${duplicado.nombre}`);
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        await api.updateTercero(editing.id, form);
      } else {
        await api.createTercero(form);
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditing(null);
      loadTerceros();
    } catch (err: any) {
      if (err?.message?.includes('idx_terceros_nit_salon_unique')) {
        alert(`Ya existe un tercero con NIT "${form.nit}".`);
      } else if (err?.message?.includes('idx_terceros_nit_unique')) {
        alert(`Ya existe un tercero con NIT "${form.nit}".`);
      } else {
        alert('Error al guardar el tercero');
      }
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Tercero) => {
    if (!confirm(`¿Eliminar a "${t.nombre}"?`)) return;
    try {
      await api.deleteTercero(t.id);
      loadTerceros();
    } catch (err) {
      alert('Error al eliminar');
      console.error(err);
    }
  };

  const filtered = terceros.filter(t =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Cargando terceros...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Terceros</h1>
          <p className={styles.subtitle}>Proveedores, clientes y contactos externos</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={openCreate}>
          Nuevo Tercero
        </Button>
      </div>

      <div className={styles.searchBar}>
        <Search size={18} color="var(--neutral-400)" />
        <input
          type="text"
          placeholder="Buscar por NIT, nombre o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} />
          <p>No hay terceros registrados</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NIT / Código</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Departamento</th>
                <th>Ciudad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.nit}</strong></td>
                  <td>{t.nombre}</td>
                  <td>{t.telefono || '—'}</td>
                  <td>{t.direccion || '—'}</td>
                  <td>{t.departamento || '—'}</td>
                  <td>{t.ciudad || '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => openEdit(t)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(t)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editing ? 'Editar Tercero' : 'Nuevo Tercero'}</h3>
            <p>Completa la información del tercero.</p>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>NIT / Código *</label>
                <input
                  type="text"
                  value={form.nit}
                  onChange={(e) => setForm({ ...form, nit: e.target.value })}
                  placeholder="Ej. 900123456-1"
                />
              </div>

              <div className={styles.field}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre o razón social"
                />
              </div>

              <div className={styles.field}>
                <label>Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej. 300-555-1234"
                />
              </div>

              <div className={styles.field}>
                <label>Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>

              <div className={styles.field}>
                <label>Departamento</label>
                <input
                  type="text"
                  value={form.departamento}
                  onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                  placeholder="Ej. Antioquia"
                />
              </div>

              <div className={styles.field}>
                <label>Ciudad</label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  placeholder="Ej. Medellín"
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => { setShowModal(false); setEditing(null); }}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Tercero'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
