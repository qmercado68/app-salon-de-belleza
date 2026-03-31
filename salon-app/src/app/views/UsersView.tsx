'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ShieldAlert, Edit2 } from 'lucide-react';
import styles from './UsersView.module.css';
import Card from '@/components/atoms/Card/Card';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Input from '@/components/atoms/Input/Input';
import { api } from '@/lib/api';
import { Profile } from '@/lib/types';
import ProfileView from './ProfileView';

interface UsersViewProps {
  currentViewerRole?: string;
}

export default function UsersView({ currentViewerRole }: UsersViewProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllProfiles();
      setUsers(data);
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

  const filteredUsers = users.filter((u) => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (currentViewerRole !== 'admin') {
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
        <Badge variant="info" size="md">{users.length} Registros</Badge>
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
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Rol</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Avatar name={u.fullName} size="sm" />
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.fullName || 'Sin nombre'}</div>
                          {u.documentId && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>CI: {u.documentId}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem' }}>{u.phone || 'Sin teléfono'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Badge variant={u.role === 'admin' ? 'confirmada' : u.role === 'stylist' ? 'info' : 'pendiente'}>
                        {u.role === 'admin' ? 'Administrador' : u.role === 'stylist' ? 'Estilista' : 'Cliente'}
                      </Badge>
                      {u.specialty && <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>{u.specialty}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Button size="sm" variant="outline" onClick={() => setSelectedProfile(u)}>
                        <Edit2 size={14} style={{ marginRight: '6px' }} /> Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
