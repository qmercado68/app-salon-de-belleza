'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Settings, Plus, Edit2, ShieldAlert, Image as ImageIcon, 
  Power, PowerOff, Search, Trash2, X, Filter, 
  ChevronRight, AlertCircle, CheckCircle2 
} from 'lucide-react';
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
  
  // States for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Modal and Editing states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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

  // Filtering logic
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

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
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !service.isActive } : s));
    } catch (err: any) {
      alert(`Error al cambiar estado: ${err?.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      setDeletingId(null);
    } catch (err: any) {
      alert(`Error al eliminar: ${err?.message}`);
    }
  };

  const handleSave = async () => {
    if (!editingService.name || !editingService.price) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

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

  if (currentViewerRole !== 'admin') {
    return (
      <div className={styles.restricted}>
        <ShieldAlert size={64} className={styles.restrictedIcon} />
        <h2>Acceso Restringido</h2>
        <p>Solo los administradores pueden gestionar el catálogo de servicios.</p>
        <Button variant="primary" onClick={() => window.location.href = '/'}>Volver al Inicio</Button>
      </div>
    );
  }

  if (loading && services.length === 0) return (
    <div className={styles.loadingState}>
      <div className={styles.spinner}></div>
      <p>Cargando catálogo de servicios...</p>
    </div>
  );

  const categories = ['Todas', 'Cabello', 'Uñas', 'Facial', 'Maquillaje', 'Masajes', 'Spa'];
  const categoryOptions = categories.filter(c => c !== 'Todas').map(c => ({ value: c, label: c }));

  return (
    <div className={styles.view}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleIcon}>
            <Settings size={28} />
          </div>
          <div>
            <h1 className={styles.title}>Gestión de Servicios</h1>
            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>
              Administra el catálogo de belleza y bienestar del salón
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary" className={styles.addBtn}>
          <Plus size={20} /> Nuevo Servicio
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Input 
            icon={<Search size={18} />}
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterWrapper}>
          <SelectInput 
            label="Categoría"
            options={categories.map(c => ({ value: c, label: c }))}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />
        </div>
        <div className={styles.countBadge}>
          <span style={{ fontWeight: 600 }}>{filteredServices.length}</span> servicios
        </div>
      </div>

      {/* Main Table Container */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Categoría</th>
                <th>Precio / Duración</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((s) => (
                <tr key={s.id} style={{ opacity: s.isActive ? 1 : 0.6 }}>
                  <td>
                    <div className={styles.serviceInfo}>
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.name} className={styles.image} />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <ImageIcon size={24} />
                        </div>
                      )}
                      <div className={styles.nameGroup}>
                        <span className={styles.name}>{s.name}</span>
                        <span className={styles.description}>{s.description}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={
                      s.category === 'Cabello' ? 'info' : 
                      s.category === 'Uñas' ? 'info' : 
                      s.category === 'Facial' ? 'confirmada' : 'pendiente'
                    }>
                      {s.category}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.priceWrapper}>
                      <span className={styles.price}>${s.price.toFixed(2)}</span>
                      <span className={styles.duration}>{s.durationMinutes} min</span>
                    </div>
                  </td>
                  <td>
                    {s.isActive ? (
                      <Badge variant="confirmada">Activo</Badge>
                    ) : (
                      <Badge variant="cancelada">Inactivo</Badge>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.editBtn}`} 
                        onClick={() => handleOpenModal(s)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.statusBtn}`} 
                        onClick={() => handleToggleActive(s)}
                        title={s.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {s.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      
                      {deletingId === s.id ? (
                        <div className={styles.confirmPopover}>
                          <button onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger-600)', padding: '4px' }}>OK</button>
                          <button onClick={() => setDeletingId(null)} style={{ padding: '4px' }}>X</button>
                        </div>
                      ) : (
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                          onClick={() => setDeletingId(s.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--neutral-400)' }}>
                      <Search size={48} />
                      <p>No se encontraron servicios con los filtros actuales.</p>
                      <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('Todas'); }}>
                        Limpiar filtros
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / BOTTOM SHEET */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.imageUploadZone}>
                <div 
                  className={styles.previewBox}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {(selectedFile || editingService.imageUrl) ? (
                    <img 
                      src={selectedFile ? URL.createObjectURL(selectedFile) : editingService.imageUrl} 
                      className={styles.previewImg} 
                      alt="Preview"
                    />
                  ) : (
                    <>
                      <ImageIcon size={32} />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Subir Foto</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <div style={{ flex: 1 }}>
                  <Input 
                    label="Nombre del Servicio" 
                    placeholder="Ej. Corte de Cabello Dama"
                    value={editingService.name || ''} 
                    onChange={e => setEditingService({...editingService, name: e.target.value})} 
                  />
                </div>
              </div>

              <TextArea 
                label="Descripción Detallada"
                placeholder="Describe el servicio, qué incluye, etc."
                value={editingService.description || ''} 
                onChange={e => setEditingService({...editingService, description: e.target.value})} 
              />
              
              <div className={styles.formGrid}>
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
                label="Categoría del Servicio"
                options={categoryOptions}
                value={editingService.category || 'Cabello'}
                onChange={e => setEditingService({...editingService, category: e.target.value})}
              />
            </div>

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Servicio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
