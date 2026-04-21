'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ShieldAlert, Edit2, Plus } from 'lucide-react';
import styles from './UsersView.module.css';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Input, { SelectInput } from '@/components/atoms/Input/Input';
import { api } from '@/lib/api';
import { Profile, Salon, UserRole } from '@/lib/types';
import { formatFullName } from '@/lib/name';
import ProfileView from './ProfileView';

interface UsersViewProps {
  currentViewerRole?: string;
}

export default function UsersView({ currentViewerRole }: UsersViewProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonsMap, setSalonsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState<{
    email: string;
    firstName: string;
    secondName: string;
    lastName: string;
    secondLastName: string;
    phone: string;
    role: UserRole;
    salonId: string;
  }>({
    email: '',
    firstName: '',
    secondName: '',
    lastName: '',
    secondLastName: '',
    phone: '',
    role: 'client',
    salonId: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, salons] = await Promise.all([
        api.getAllProfiles(),
        api.getSalons(),
      ]);
      setUsers(data);
      setSalons(salons);
      const map: Record<string, string> = {};
      salons.forEach(s => { map[s.id] = s.name; });
      setSalonsMap(map);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError(`Error al obtener directorio: ${err?.message ?? 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo cargamos los perfiles si no hay nadie seleccionado
    if (!selectedProfile) {
      fetchUsers();
    }
  }, [selectedProfile]);

  const filteredUsers = users
    .filter((u) => 
      (formatFullName({
        firstName: u.firstName,
        secondName: u.secondName,
        lastName: u.lastName,
        secondLastName: u.secondLastName,
      }) || u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const roleOptions = [
    { value: 'client', label: 'Cliente' },
    { value: 'stylist', label: 'Estilista' },
    { value: 'admin', label: 'Administrador' },
    { value: 'superadmin', label: 'Super Admin' },
  ].filter((opt) => currentViewerRole === 'superadmin' || opt.value !== 'superadmin');

  const handleCreateUser = async () => {
    if (!newUser.email.trim()) {
      setCreateError('El correo es obligatorio.');
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      await api.inviteUser({
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        secondName: newUser.secondName,
        lastName: newUser.lastName,
        secondLastName: newUser.secondLastName,
        salonId: newUser.salonId || undefined,
        phone: newUser.phone || undefined,
      });
      setShowCreateModal(false);
      setNewUser({
        email: '',
        firstName: '',
        secondName: '',
        lastName: '',
        secondLastName: '',
        phone: '',
        role: 'client',
        salonId: '',
      });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err?.message ?? 'No se pudo crear el usuario.');
    } finally {
      setCreating(false);
    }
  };

  // Si hemos seleccionado a un usuario para editar, renderizamos ProfileView
  if (selectedProfile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <div>
          <Button 
            variant="secondary" 
            onClick={() => setSelectedProfile(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ChevronLeft size={16} />
            Volver al Directorio
          </Button>
        </div>
        <ProfileView 
          userId={selectedProfile.id} 
          userEmail={selectedProfile.email}
          initialProfile={selectedProfile}
          currentViewerRole={currentViewerRole}
        />
      </div>
    );
  }

  if (loading) {
    return <div className={styles.page || ''}><p>Cargando directorio de usuarios...</p></div>;
  }

  if (error) {
    return <div className={styles.page || ''}><p style={{ color: 'var(--color-danger)' }}>{error}</p></div>;
  }

  if (currentViewerRole !== 'admin' && currentViewerRole !== 'superadmin') {
    return (
      <div className={styles.page || ''} style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={48} style={{ margin: '0 auto', color: 'var(--color-warning)' }} />
        <h2>Acceso Restringido</h2>
        <p>Solo los administradores pueden ver el directorio de usuarios.</p>
      </div>
    );
  }

  return (
    <div className={styles.page || ''} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Directorio de Usuarios</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge variant="info" size="md">{users.length} Registros</Badge>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => { setShowCreateModal(true); setCreateError(null); }}>
            Crear usuario
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-background)',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Usuario</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Contacto</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Salón</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Rol</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const displayName = formatFullName({
                    firstName: u.firstName,
                    secondName: u.secondName,
                    lastName: u.lastName,
                    secondLastName: u.secondLastName,
                  }) || u.fullName || 'Sin nombre';

                  return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Avatar name={displayName} size="sm" />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontWeight: 500 }}>{displayName}</div>
                            {u.createdAt && new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                              <Badge variant="info">NUEVO</Badge>
                            )}
                          </div>
                          {u.documentId && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>CI: {u.documentId}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem' }}>{u.phone || 'Sin teléfono'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', color: u.salonId ? 'var(--color-text)' : 'var(--color-text-light)' }}>
                        {u.salonId ? (salonsMap[u.salonId] || 'Desconocido') : u.role === 'superadmin' ? 'Global' : 'Sin asignar'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Badge variant={u.role === 'superadmin' ? 'completada' : u.role === 'admin' ? 'confirmada' : u.role === 'stylist' ? 'info' : 'pendiente'}>
                        {u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Administrador' : u.role === 'stylist' ? 'Estilista' : 'Cliente'}
                      </Badge>
                      {u.specialty && <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>{u.specialty}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Button size="sm" variant="outline" onClick={() => setSelectedProfile(u)}>
                        <Edit2 size={14} style={{ marginRight: '6px' }} /> Editar
                      </Button>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Nuevo usuario</h2>
              <p>Se enviará un correo de invitación para que el usuario ingrese.</p>
            </div>
            <div className={styles.formGrid}>
              <Input
                label="Correo *"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                label="Teléfono"
                value={newUser.phone}
                onChange={(e) => setNewUser((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                label="Primer Nombre"
                value={newUser.firstName}
                onChange={(e) => setNewUser((prev) => ({ ...prev, firstName: e.target.value }))}
              />
              <Input
                label="Segundo Nombre"
                value={newUser.secondName}
                onChange={(e) => setNewUser((prev) => ({ ...prev, secondName: e.target.value }))}
              />
              <Input
                label="Primer Apellido"
                value={newUser.lastName}
                onChange={(e) => setNewUser((prev) => ({ ...prev, lastName: e.target.value }))}
              />
              <Input
                label="Segundo Apellido"
                value={newUser.secondLastName}
                onChange={(e) => setNewUser((prev) => ({ ...prev, secondLastName: e.target.value }))}
              />
              <SelectInput
                label="Rol"
                options={roleOptions}
                value={newUser.role}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as UserRole }))}
              />
              <SelectInput
                label="Salón"
                options={[
                  { value: '', label: 'Sin asignar' },
                  ...salons.map((s) => ({ value: s.id, label: s.name })),
                ]}
                value={newUser.salonId}
                onChange={(e) => setNewUser((prev) => ({ ...prev, salonId: e.target.value }))}
              />
            </div>
            {createError && <div className={styles.errorText}>{createError}</div>}
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating ? 'Creando...' : 'Enviar invitación'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
