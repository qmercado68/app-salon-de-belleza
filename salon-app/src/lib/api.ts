import { supabase, isSupabaseConfigured } from './supabase';
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
  // SERVICES
  async getServices(): Promise<Service[]> {
    if (!isSupabaseConfigured()) return mockServices;
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true);
      
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
    return data as Profile;
  },

  async updateProfile(profile: Partial<Profile>): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Perfil actualizado', profile);
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', profile.id);
      
    if (error) throw error;
  },

  // APPOINTMENTS
  async getAppointments(clientId?: string): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) {
      return clientId 
        ? mockAppointments.filter(a => a.clientId === clientId)
        : mockAppointments;
    }
    
    let query = supabase.from('appointments').select('*, services(name), profiles(full_name)');
    if (clientId) query = query.eq('client_id', clientId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Appointment[];
  },

  async createAppointment(appointment: Partial<Appointment>): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Cita creada', appointment);
      return;
    }
    
    const { error } = await supabase
      .from('appointments')
      .insert(appointment);
      
    if (error) throw error;
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
