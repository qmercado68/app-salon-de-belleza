import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Scissors, MapPin, Phone } from 'lucide-react';
import type { Salon } from '@/lib/types';

export const revalidate = 60; // Revalidar cada 60 segundos

async function getSalons(): Promise<Salon[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('salons')
    .select('id, name, slug, address, phone, logo_url, theme_color')
    .eq('is_active', true)
    .order('name');

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    address: d.address,
    phone: d.phone,
    logoUrl: d.logo_url,
    themeColor: d.theme_color,
  }));
}

export default async function SalonesPage() {
  const salons = await getSalons();

  return (
    <div style={{ minHeight: '100vh', background: '#fdf2f8', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #fce7f3',
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Scissors size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>
            GlamSystem
          </h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
            Plataforma de salones de belleza
          </p>
        </div>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '3rem 2rem 2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', margin: '0 0 0.5rem' }}>
          Encuentra tu salón de confianza
        </h2>
        <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
          Selecciona un salón para reservar o acceder a tu cuenta
        </p>
      </section>

      {/* Salon Grid */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '1rem 2rem 4rem' }}>
        {salons.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            color: '#9ca3af', background: '#fff', borderRadius: 16,
            border: '1px dashed #fce7f3',
          }}>
            <Scissors size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>No hay salones disponibles por el momento.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}>
            {salons.map((salon) => (
              <Link
                key={salon.id}
                href={`/salon/${salon.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid #fce7f3',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(236,72,153,0.15)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  {/* Color bar */}
                  <div style={{
                    height: 8,
                    background: salon.themeColor ?? '#ec4899',
                  }} />

                  <div style={{ padding: '1.5rem' }}>
                    {/* Logo / Avatar */}
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: salon.themeColor ?? '#ec4899',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '1rem',
                    }}>
                      {salon.logoUrl ? (
                        <img src={salon.logoUrl} alt={salon.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <Scissors size={24} color="#fff" />
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                      {salon.name}
                    </h3>

                    {salon.address && (
                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {salon.address}
                      </p>
                    )}
                    {salon.phone && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> {salon.phone}
                      </p>
                    )}

                    <div style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: salon.themeColor ?? '#ec4899',
                      borderRadius: 8,
                      textAlign: 'center',
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}>
                      Acceder →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
