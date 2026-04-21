'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Globe, MapPin, Phone, Mail, Palette } from 'lucide-react';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { api } from '@/lib/api';
import { Salon, SalonTaxRegime } from '@/lib/types';

const TAX_REGIME_OPTIONS: Array<{ value: SalonTaxRegime; label: string }> = [
  { value: 'responsable_iva', label: 'Responsable de IVA' },
  { value: 'no_responsable_iva', label: 'No responsable de IVA' },
  { value: 'simple', label: 'Régimen Simple (SIMPLE)' },
];

export default function SalonesView() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: '',
    nit: '',
    slug: '',
    taxRegime: 'no_responsable_iva' as SalonTaxRegime,
    dianResolution: '',
    invoiceRangeFrom: 1,
    invoiceRangeTo: '',
    invoiceValidUntil: '',
    appliesVat: false,
    vatPercentage: 0,
    invoicePrefix: 'FV',
    invoiceNextNumber: 1,
    address: '',
    phone: '',
    email: '',
    themeColor: '#ec4899',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const data = await api.getSalons();
      setSalons(data);
    } catch (err) {
      console.error('Error al cargar salones:', err);
      setError('No se pudieron cargar los salones.');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      name: value,
      slug: editingId ? prev.slug : generateSlug(value),
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.nit || !form.slug) {
      setError('El nombre, NIT y slug son obligatorios.');
      return;
    }
    if (!form.invoicePrefix.trim()) {
      setError('El prefijo de factura es obligatorio.');
      return;
    }
    if (!Number.isInteger(form.invoiceNextNumber) || form.invoiceNextNumber < 1) {
      setError('El consecutivo inicial debe ser un número mayor o igual a 1.');
      return;
    }
    if (!Number.isInteger(form.invoiceRangeFrom) || form.invoiceRangeFrom < 1) {
      setError('El rango desde debe ser un número mayor o igual a 1.');
      return;
    }
    if (form.invoiceRangeTo !== '' && (!Number.isInteger(Number(form.invoiceRangeTo)) || Number(form.invoiceRangeTo) < form.invoiceRangeFrom)) {
      setError('El rango hasta debe ser mayor o igual al rango desde.');
      return;
    }
    if (form.invoiceNextNumber < form.invoiceRangeFrom) {
      setError('El siguiente consecutivo no puede ser menor al rango desde.');
      return;
    }
    if (form.invoiceRangeTo !== '' && form.invoiceNextNumber > Number(form.invoiceRangeTo)) {
      setError('El siguiente consecutivo no puede superar el rango hasta.');
      return;
    }
    if (form.appliesVat && (form.vatPercentage < 0 || form.vatPercentage > 100)) {
      setError('El porcentaje de IVA debe estar entre 0 y 100.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Salon> = {
        ...form,
        invoiceRangeTo: form.invoiceRangeTo === '' ? null : Number(form.invoiceRangeTo),
        invoiceValidUntil: form.invoiceValidUntil || null,
      };
      if (editingId) {
        await api.updateSalon(editingId, payload);
      } else {
        await api.createSalon(payload as Omit<Salon, 'id' | 'createdAt'>);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchSalons();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el salón');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (salon: Salon) => {
    setForm({
      name: salon.name,
      nit: salon.nit,
      slug: salon.slug,
      taxRegime: salon.taxRegime ?? 'no_responsable_iva',
      dianResolution: salon.dianResolution ?? '',
      invoiceRangeFrom: salon.invoiceRangeFrom ?? 1,
      invoiceRangeTo: salon.invoiceRangeTo != null ? String(salon.invoiceRangeTo) : '',
      invoiceValidUntil: salon.invoiceValidUntil ?? '',
      appliesVat: salon.appliesVat ?? false,
      vatPercentage: salon.vatPercentage ?? 0,
      invoicePrefix: salon.invoicePrefix ?? 'FV',
      invoiceNextNumber: salon.invoiceNextNumber ?? 1,
      address: salon.address ?? '',
      phone: salon.phone ?? '',
      email: salon.email ?? '',
      themeColor: salon.themeColor ?? '#ec4899',
    });
    setEditingId(salon.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}><p>Cargando salones...</p></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header con botón */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={20} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{salons.length} salones registrados</span>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
            Nuevo Salón
          </Button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem', background: '#fef2f2', color: '#dc2626',
          borderRadius: 8, fontSize: '0.875rem', border: '1px solid #fecaca',
        }}>
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <Card padding="lg">
          <h3 style={{ margin: '0 0 1rem', fontWeight: 700 }}>
            {editingId ? 'Editar Salón' : 'Nuevo Salón'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Nombre del salón"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Estética Luna"
              icon={<Building2 size={16} />}
            />
            <Input
              label="NIT / RUT (Obligatorio)"
              value={form.nit}
              onChange={(e) => setForm({ ...form, nit: e.target.value })}
              placeholder="Ej: 900.123.456-7"
              icon={<Globe size={16} />}
            />
            <Input
              label="Slug (URL)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="estetica-luna"
              icon={<Globe size={16} />}
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                Régimen Tributario
              </label>
              <select
                value={form.taxRegime}
                onChange={(e) => setForm({ ...form, taxRegime: e.target.value as SalonTaxRegime })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.875rem',
                }}
              >
                {TAX_REGIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Prefijo de factura"
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
              placeholder="FV"
            />
            <Input
              label="Resolución DIAN (opcional)"
              value={form.dianResolution}
              onChange={(e) => setForm({ ...form, dianResolution: e.target.value })}
              placeholder="Ej: 18760000000001"
            />
            <Input
              label="Rango desde"
              type="number"
              min={1}
              value={String(form.invoiceRangeFrom)}
              onChange={(e) => setForm({ ...form, invoiceRangeFrom: Number(e.target.value || 1) })}
              placeholder="1"
            />
            <Input
              label="Rango hasta (opcional)"
              type="number"
              min={1}
              value={String(form.invoiceRangeTo)}
              onChange={(e) => setForm({ ...form, invoiceRangeTo: e.target.value })}
              placeholder="Ej: 500000"
            />
            <Input
              label="Vigencia hasta (opcional)"
              type="date"
              value={form.invoiceValidUntil}
              onChange={(e) => setForm({ ...form, invoiceValidUntil: e.target.value })}
            />
            <Input
              label="Siguiente consecutivo"
              type="number"
              min={1}
              value={String(form.invoiceNextNumber)}
              onChange={(e) => setForm({ ...form, invoiceNextNumber: Number(e.target.value || 1) })}
              placeholder="1"
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                Impuesto IVA
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={form.appliesVat}
                  onChange={(e) => setForm({ ...form, appliesVat: e.target.checked, vatPercentage: e.target.checked ? form.vatPercentage : 0 })}
                />
                Aplicar IVA en facturación
              </label>
              <Input
                label="% IVA"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={String(form.vatPercentage)}
                onChange={(e) => setForm({ ...form, vatPercentage: Number(e.target.value || 0) })}
                placeholder="19"
                disabled={!form.appliesVat}
              />
            </div>
            <Input
              label="Dirección"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Calle 123, Ciudad"
              icon={<MapPin size={16} />}
            />
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="555-1234"
              icon={<Phone size={16} />}
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@salon.com"
              icon={<Mail size={16} />}
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                Color del tema
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                  style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{form.themeColor}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="primary" onClick={handleSave} isLoading={saving}>
              {editingId ? 'Guardar Cambios' : 'Crear Salón'}
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Grid de salones */}
      {salons.length === 0 && !showForm ? (
        <Card padding="lg">
          <Building2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ color: '#9ca3af' }}>No hay salones registrados aún.</p>
          <Button variant="primary" onClick={() => setShowForm(true)} icon={<Plus size={16} />} style={{ marginTop: '1rem' }}>
            Crear el primer salón
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {salons.map((salon) => (
            <Card key={salon.id} padding="sm">
              {/* Color bar */}
              <div style={{ height: 6, background: salon.themeColor ?? '#ec4899' }} />
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{salon.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>NIT: {salon.nit}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/{salon.slug}</span>
                    </div>
                  </div>
                  <Badge variant={salon.isActive ? 'completada' : 'cancelada'}>
                    {salon.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                {salon.address && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {salon.address}
                  </p>
                )}
                {salon.phone && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} /> {salon.phone}
                  </p>
                )}
                {salon.email && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={12} /> {salon.email}
                  </p>
                )}
                {salon.taxRegime && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    Régimen: {TAX_REGIME_OPTIONS.find((o) => o.value === salon.taxRegime)?.label ?? salon.taxRegime}
                  </p>
                )}
                <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                  Facturación: {(salon.invoicePrefix ?? 'FV')}-{String(salon.invoiceNextNumber ?? 1).padStart(6, '0')}
                </p>
                {(salon.invoiceRangeFrom || salon.invoiceRangeTo) && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    Rango DIAN: {String(salon.invoiceRangeFrom ?? 1).padStart(6, '0')} - {salon.invoiceRangeTo ? String(salon.invoiceRangeTo).padStart(6, '0') : 'Abierto'}
                  </p>
                )}
                {salon.invoiceValidUntil && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    Vigencia: {salon.invoiceValidUntil}
                  </p>
                )}
                {salon.dianResolution && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    Resolución DIAN: {salon.dianResolution}
                  </p>
                )}
                <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                  IVA: {salon.appliesVat ? `${salon.vatPercentage ?? 0}%` : 'No aplica'}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(salon)} icon={<Pencil size={14} />}>
                    Editar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
