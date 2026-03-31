'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Edit2, ShieldAlert, Image as ImageIcon, Power, PowerOff } from 'lucide-react';
import styles from './AdminServicesView.module.css';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Input, { SelectInput, TextArea } from '@/components/atoms/Input/Input';
import { api } from '@/lib/api';
import { Service } from '@/lib/types';

interface AdminServicesViewProps {
  currentViewerRole?: string;
}

export default function AdminServicesView({ currentViewerRole }: AdminServicesViewProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await api.getServices();
      setServices(data);
    } catch (err: any) {
      setError(`Error al cargar catálogo: ${err?.message ?? 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentViewerRole === 'admin') {
      fetchServices();
    }
  }, [currentViewerRole]);

  if (currentViewerRole !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} style={{ margin: '0 auto', color: 'var(--color-warning)' }} />
        <h2>Acceso Restringido</h2>
        <p>Solo los administradores pueden gestionar el catálogo de servicios.</p>
      </div>
    );
  }

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
    } else {
      setEditingService({ 
        name: '', 
        description: '', 
        price: 0, 
        durationMinutes: 30, 
        category: 'Cabello', 
        isActive: true 
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await api.updateService(service.id, { isActive: !service.isActive });
      // Update local state for immediate feedback
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !service.isActive } : s));
    } catch (err: any) {
      alert(`Error al cambiar estado: ${err?.message}`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let imageUrl = editingService.imageUrl;
      
      if (selectedFile) {
        imageUrl = await api.uploadServiceImage(selectedFile);
      }
      
      const payload = { ...editingService, imageUrl };

      if (payload.id) {
        await api.updateService(payload.id, payload);
      } else {
        await api.createService(payload);
      }
      
      await fetchServices();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error al guardar: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  if (loading) return <div>Cargando panel de servicios...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  const categoryOptions = [
    { value: 'Cabello', label: 'Cabello' },
    { value: 'Uñas', label: 'Uñas' },
    { value: 'Facial', label: 'Facial' },
    { value: 'Maquillaje', label: 'Maquillaje' },
    { value: 'Masajes', label: 'Masajes' },
    { value: 'Spa', label: 'Spa General' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={28} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestión de Servicios</h1>
        </div>
        <Button onClick={() => handleOpenModal()} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={18} /> Nuevo Servicio
        </Button>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Servicio</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Categoría</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Precio / Duración</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: s.isActive ? 1 : 0.6 }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {s.imageUrl ? (
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundImage: `url(${s.imageUrl})`, backgroundSize: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-background-soft)', display: 'flex', alignItems:'center', justifyContent:'center' }}>
                          <ImageIcon size={20} color="var(--color-text-light)" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}><Badge variant="info">{s.category}</Badge></td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>${s.price.toFixed(2)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{s.durationMinutes} min</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {s.isActive ? (
                      <Badge variant="confirmada">Activo</Badge>
                    ) : (
                      <Badge variant="cancelada">Inactivo</Badge>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(s)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button size="sm" variant={s.isActive ? 'danger' : 'primary'} onClick={() => handleToggleActive(s)} title={s.isActive ? 'Desactivar' : 'Activar'}>
                        {s.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No hay servicios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL / BOTTOM SHEET SIMPLIFICADO OVERLAY */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ 
            background: 'var(--color-surface)', width: '100%', maxWidth: '500px', 
            borderRadius: '16px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' 
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              {editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    width: '100px', height: '100px', borderRadius: '12px', 
                    background: 'var(--color-background)', border: '2px dashed var(--color-border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative'
                  }}
                >
                  {(selectedFile || editingService.imageUrl) ? (
                    <img 
                      src={selectedFile ? URL.createObjectURL(selectedFile) : editingService.imageUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      alt="Preview"
                    />
                  ) : (
                    <>
                      <ImageIcon size={24} color="var(--color-text-light)" />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--color-text-light)' }}>Foto</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <div style={{ flex: 1 }}>
                  <Input 
                    label="Nombre del Servicio" 
                    value={editingService.name || ''} 
                    onChange={e => setEditingService({...editingService, name: e.target.value})} 
                  />
                </div>
              </div>

              <TextArea 
                label="Descripción"
                value={editingService.description || ''} 
                onChange={e => setEditingService({...editingService, description: e.target.value})} 
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input 
                  label="Precio ($)" 
                  type="number" 
                  value={editingService.price || 0} 
                  onChange={e => setEditingService({...editingService, price: parseFloat(e.target.value)})} 
                />
                <Input 
                  label="Duración (minutos)" 
                  type="number" 
                  value={editingService.durationMinutes || 0} 
                  onChange={e => setEditingService({...editingService, durationMinutes: parseInt(e.target.value, 10)})} 
                />
              </div>

              <SelectInput
                label="Categoría"
                options={categoryOptions}
                value={editingService.category || 'Cabello'}
                onChange={e => setEditingService({...editingService, category: e.target.value})}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Servicio'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
