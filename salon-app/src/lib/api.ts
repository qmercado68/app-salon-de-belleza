import { supabase, isSupabaseConfigured } from './supabase';
import { createClient } from '@/utils/supabase/client';
import {
  mockServices,
  mockAppointments,
  mockCurrentUser,
  mockClients
} from './mockData';
import { Service, Appointment, Profile } from './types';

// ==========================================
// Generic API Wrapper with Mock Fallback
// ==========================================

export const api = {
  // SALON ID HELPER
  async getSalonId(userId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return (data as any)?.salon_id ?? null;
  },

  // SERVICES
  async getServices(userId?: string): Promise<Service[]> {
    if (!isSupabaseConfigured()) return mockServices;

    let query = supabase
      .from('services')
      .select('*');

    if (userId) {
      const salonId = await api.getSalonId(userId);
      if (salonId) query = query.eq('salon_id', salonId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Service[];
  },

  // PROFILES
  async getProfile(userId: string): Promise<Profile> {
    if (!isSupabaseConfigured()) return mockCurrentUser;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    const d = data as any;
    return {
      id: d.id,
      fullName: d.full_name ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      address: d.address ?? '',
      bloodType: d.blood_type ?? '',
      medicalConditions: d.medical_conditions ?? '',
      allergies: d.allergies ?? '',
      role: d.role ?? 'client',
      avatarUrl: d.avatar_url ?? undefined,
      salonId: d.salon_id ?? undefined,
      createdAt: d.created_at ?? '',
    } as Profile;
  },

  async updateProfile(profile: Partial<Profile>): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Perfil actualizado', profile);
      return;
    }

    const payload: any = {};
    if (profile.fullName !== undefined) payload.full_name = profile.fullName;
    if (profile.phone !== undefined) payload.phone = profile.phone;
    if (profile.address !== undefined) payload.address = profile.address;
    if (profile.bloodType !== undefined) payload.blood_type = profile.bloodType;
    if (profile.medicalConditions !== undefined) payload.medical_conditions = profile.medicalConditions;
    if (profile.allergies !== undefined) payload.allergies = profile.allergies;
    if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl;
    if (profile.salonId !== undefined) payload.salon_id = profile.salonId;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profile.id);

    if (error) throw error;
  },

  // APPOINTMENTS
  async getAppointments(clientId?: string, userId?: string): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) {
      return clientId
        ? mockAppointments.filter(a => a.clientId === clientId)
        : mockAppointments;
    }

    let query = supabase.from('appointments').select('*, services(name), profiles(full_name)');

    if (userId) {
      const salonId = await api.getSalonId(userId);
      if (salonId) query = query.eq('salon_id', salonId);
    }

    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Appointment[];
  },

  async createAppointment(appointment: Partial<Appointment>, userId?: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Cita creada', appointment);
      return;
    }

    let payload: any = { ...appointment };

    if (userId && !payload.salon_id) {
      const salonId = await api.getSalonId(userId);
      if (salonId) payload.salon_id = salonId;
    }

    const { error } = await supabase
      .from('appointments')
      .insert(payload);

    if (error) throw error;
  },

  // AVATAR / STORAGE
  getAvatarUrl(userId: string): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${supabaseUrl}/storage/v1/object/public/avatars/${userId}/avatar.jpg`;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const browserClient = createClient();
    const filePath = `${userId}/avatar.jpg`;

    const { error } = await browserClient.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) throw new Error(`Error al subir la foto: ${error.message}`);

    return api.getAvatarUrl(userId);
  },

  async updateAppointmentStatus(id: string, status: string, isPaid?: boolean): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log(`Mock: Cita ${id} actualizada a ${status}, pagada: ${isPaid}`);
      return;
    }

    const update: any = { status };
    if (isPaid !== undefined) update.is_paid = isPaid;

    const { error } = await supabase
      .from('appointments')
      .update(update)
      .eq('id', id);

    if (error) throw error;
  }
};
