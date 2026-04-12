'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import styles from './TercerosView.module.css';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { Tercero } from '@/lib/types';
import { formatFullName, parseFullName } from '@/lib/name';
import { CAPITAL_BY_DEPARTMENT, DEPARTMENT_OPTIONS, getCityOptionsForDepartment } from '@/lib/colombia';

interface TercerosViewProps {
  userId?: string;
}

const EMPTY_FORM = {
  nit: '',
  firstName: '',
  secondName: '',
  lastName: '',
  secondLastName: '',
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
  const cityOptions = getCityOptionsForDepartment(form.departamento, form.ciudad);

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
    const parsed = parseFullName(t.nombre);
    setEditing(t);
    setForm({
      nit: t.nit,
      firstName: t.firstName || parsed.firstName || '',
      secondName: t.secondName || parsed.secondName || '',
      lastName: t.lastName || parsed.lastName || '',
      secondLastName: t.secondLastName || parsed.secondLastName || '',
      direccion: t.direccion || '',
      telefono: t.telefono || '',
      departamento: t.departamento || '',
      ciudad: t.ciudad || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nit || !form.firstName || !form.lastName) {
      alert('NIT, Primer Nombre y Primer Apellido son obligatorios.');
      return;
    }
    const displayName = formatFullName({
      firstName: form.firstName,
      secondName: form.secondName,
      lastName: form.lastName,
      secondLastName: form.secondLastName,
    });

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
        await api.updateTercero(editing.id, {
          ...form,
          nombre: displayName,
        });
      } else {
        await api.createTercero({
          ...form,
          nombre: displayName,
        });
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
    const displayName = formatFullName({
      firstName: t.firstName,
      secondName: t.secondName,
      lastName: t.lastName,
      secondLastName: t.secondLastName,
    }) || t.nombre;
    if (!confirm(`¿Eliminar a "${displayName}"?`)) return;
    try {
      await api.deleteTercero(t.id);
      loadTerceros();
    } catch (err) {
      alert('Error al eliminar');
      console.error(err);
    }
  };

  const filtered = terceros.filter(t => {
    const displayName = formatFullName({
      firstName: t.firstName,
      secondName: t.secondName,
      lastName: t.lastName,
      secondLastName: t.secondLastName,
    }) || t.nombre;
    return (
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
              {filtered.map((t) => {
                const displayName = formatFullName({
                  firstName: t.firstName,
                  secondName: t.secondName,
                  lastName: t.lastName,
                  secondLastName: t.secondLastName,
                }) || t.nombre;

                return (
                  <tr key={t.id}>
                    <td><strong>{t.nit}</strong></td>
                    <td>{displayName}</td>
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
                );
              })}
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
                <label>Primer Nombre *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Ej. Juan"
                />
              </div>

              <div className={styles.field}>
                <label>Segundo Nombre</label>
                <input
                  type="text"
                  value={form.secondName}
                  onChange={(e) => setForm({ ...form, secondName: e.target.value })}
                  placeholder="Ej. Carlos"
                />
              </div>

              <div className={styles.field}>
                <label>Primer Apellido *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Ej. Pérez"
                />
              </div>

              <div className={styles.field}>
                <label>Segundo Apellido</label>
                <input
                  type="text"
                  value={form.secondLastName}
                  onChange={(e) => setForm({ ...form, secondLastName: e.target.value })}
                  placeholder="Ej. Gómez"
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
                <select
                  value={form.departamento}
                  onChange={(e) => {
                    const departamento = e.target.value;
                    const ciudad = CAPITAL_BY_DEPARTMENT[departamento] || '';
                    setForm({ ...form, departamento, ciudad });
                  }}
                >
                  <option value="">Selecciona departamento</option>
                  {DEPARTMENT_OPTIONS.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Ciudad (capital)</label>
                <select
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  disabled={!form.departamento}
                >
                  <option value="">
                    {form.departamento ? 'Selecciona ciudad' : 'Selecciona departamento primero'}
                  </option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
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
