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
    return (data as any[]).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      durationMinutes: d.duration_minutes,
      price: d.price,
      category: d.category,
      imageUrl: d.image_url,
      isActive: d.is_active,
    })) as Service[];
  },

  async createService(service: Partial<Service>): Promise<Service> {
    if (!isSupabaseConfigured()) throw new Error('Mock no soportado en creación admin.');
    
    const payload = {
      name: service.name,
      description: service.description,
      duration_minutes: service.durationMinutes,
      price: service.price,
      category: service.category,
      image_url: service.imageUrl,
      is_active: service.isActive ?? true,
    };

    const { data, error } = await supabase.from('services').insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      durationMinutes: data.duration_minutes,
      price: data.price,
      category: data.category,
      imageUrl: data.image_url,
      isActive: data.is_active,
    } as Service;
  },

  async updateService(id: string, service: Partial<Service>): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Mock no soportado en edición admin.');
    
    const payload: any = {};
    if (service.name !== undefined) payload.name = service.name;
    if (service.description !== undefined) payload.description = service.description;
    if (service.durationMinutes !== undefined) payload.duration_minutes = service.durationMinutes;
    if (service.price !== undefined) payload.price = service.price;
    if (service.category !== undefined) payload.category = service.category;
    if (service.imageUrl !== undefined) payload.image_url = service.imageUrl;
    if (service.isActive !== undefined) payload.is_active = service.isActive;

    const { error } = await supabase.from('services').update(payload).eq('id', id);
    if (error) throw error;
  },

  // PROFILES
  async getAllProfiles(): Promise<Profile[]> {
    if (!isSupabaseConfigured()) {
      return mockClients;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    
    return (data as any[]).map((d) => ({
      id: d.id,
      fullName: d.full_name ?? '',
      documentId: d.document_id ?? '',
      birthDate: d.birth_date ?? '',
      gender: d.gender ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      address: d.address ?? '',
      bloodType: d.blood_type ?? '',
      medicalConditions: d.medical_conditions ?? '',
      allergies: d.allergies ?? '',
      role: d.role ?? 'client',
      specialty: d.specialty ?? '',
      avatarUrl: d.avatar_url ?? undefined,
      salonId: d.salon_id ?? undefined,
      createdAt: d.created_at ?? '',
    })) as Profile[];
  },

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
      documentId: d.document_id ?? '',
      birthDate: d.birth_date ?? '',
      gender: d.gender ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      address: d.address ?? '',
      bloodType: d.blood_type ?? '',
      medicalConditions: d.medical_conditions ?? '',
      allergies: d.allergies ?? '',
      role: d.role ?? 'client',
      specialty: d.specialty ?? '',
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
    if (profile.documentId !== undefined) payload.document_id = profile.documentId;
    if (profile.birthDate !== undefined) payload.birth_date = profile.birthDate;
    if (profile.gender !== undefined) payload.gender = profile.gender || null;
    if (profile.phone !== undefined) payload.phone = profile.phone;
    if (profile.address !== undefined) payload.address = profile.address;
    if (profile.bloodType !== undefined) payload.blood_type = profile.bloodType || null;
    if (profile.medicalConditions !== undefined) payload.medical_conditions = profile.medicalConditions;
    if (profile.allergies !== undefined) payload.allergies = profile.allergies;
    if (profile.role !== undefined) payload.role = profile.role;
    if (profile.specialty !== undefined) payload.specialty = profile.specialty || null;
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

    let query = supabase.from('appointments').select('*, services(name), profiles!client_id(full_name, allergies)');

    if (userId) {
      const salonId = await api.getSalonId(userId);
      if (salonId) query = query.eq('salon_id', salonId);
    }

    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;
    if (error) throw error;
    return (data as any[]).map((d) => ({
      id: d.id,
      clientId: d.client_id,
      clientName: d.profiles?.full_name ?? '',
      serviceId: d.service_id,
      serviceName: d.services?.name ?? '',
      appointmentDate: d.appointment_date,
      status: d.status,
      paymentMethod: d.payment_method,
      isPaid: d.is_paid ?? false,
      notes: d.notes ?? '',
      salonId: d.salon_id,
      allergies: d.profiles?.allergies ?? '',
    })) as Appointment[];
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

    const filePath = `${userId}/avatar.jpg`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) throw new Error(`Error al subir la foto: ${error.message}`);

    return `${api.getAvatarUrl(userId)}?t=${Date.now()}`;
  },

  getServiceImageUrl(path: string): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${supabaseUrl}/storage/v1/object/public/services_images/${path}`;
  },

  async uploadServiceImage(file: File): Promise<string> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage
      .from('services_images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw new Error(`Error al subir imagen de servicio: ${error.message}`);

    return api.getServiceImageUrl(fileName);
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
