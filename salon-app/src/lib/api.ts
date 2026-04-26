import { supabase, isSupabaseConfigured } from './supabase';
import { createClient } from '@/utils/supabase/client';
import {
  mockServices,
  mockAppointments,
  mockCurrentUser,
  mockClients
} from './mockData';
import { Service, Appointment, Profile, Product, ProductSale, SaleItem, DailyReportSummary, Stylist, TimeSlot, Salon, Tercero, StylistUnavailability, UserRole, StylistServiceReportFilters, StylistServiceReportRow, StylistServiceReportDetailRow, ProductSoldReportDetailRow, ProductSoldReportFilters } from './types';
import { formatFullName, resolveNameParts } from './name';
import { mockProducts, mockProductSales } from './mockData';

const hasFullProfileColumns = (row: any): boolean => {
  if (!row || typeof row !== 'object') return false;
  return ['document_id', 'birth_date', 'department', 'city']
    .every((key) => Object.prototype.hasOwnProperty.call(row, key));
};

// ==========================================
// Generic API Wrapper with Mock Fallback
// ==========================================

export const api = {
  // ==========================================
  // SALONS
  // ==========================================
  async getSalons(): Promise<Salon[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data as any[]).map(d => ({
      id: d.id,
      name: d.name,
      nit: d.nit,
      slug: d.slug,
      taxRegime: d.regimen_tributario,
      dianResolution: d.dian_resolution,
      invoiceRangeFrom: d.invoice_range_from,
      invoiceRangeTo: d.invoice_range_to,
      invoiceValidUntil: d.invoice_valid_until,
      appliesVat: d.applies_vat,
      vatPercentage: d.vat_percentage,
      invoicePrefix: d.invoice_prefix,
      invoiceNextNumber: d.invoice_next_number,
      address: d.address,
      phone: d.phone,
      email: d.email,
      logoUrl: d.logo_url,
      themeColor: d.theme_color,
      isActive: d.is_active,
      ownerId: d.owner_id,
      createdAt: d.created_at,
    })) as Salon[];
  },

  async getSalonById(id: string): Promise<Salon | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return {
      id: data.id,
      name: data.name,
      nit: data.nit,
      slug: data.slug,
      taxRegime: data.regimen_tributario,
      dianResolution: data.dian_resolution,
      invoiceRangeFrom: data.invoice_range_from,
      invoiceRangeTo: data.invoice_range_to,
      invoiceValidUntil: data.invoice_valid_until,
      appliesVat: data.applies_vat,
      vatPercentage: data.vat_percentage,
      invoicePrefix: data.invoice_prefix,
      invoiceNextNumber: data.invoice_next_number,
      address: data.address,
      phone: data.phone,
      email: data.email,
      logoUrl: data.logo_url,
      themeColor: data.theme_color,
      isActive: data.is_active,
      ownerId: data.owner_id,
      createdAt: data.created_at,
    } as Salon;
  },

  async createSalon(salon: Omit<Salon, 'id' | 'createdAt'>): Promise<Salon> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');

    const payload = {
      name: salon.name,
      nit: salon.nit,
      slug: salon.slug,
      regimen_tributario: salon.taxRegime ?? 'no_responsable_iva',
      dian_resolution: salon.dianResolution ?? null,
      invoice_range_from: salon.invoiceRangeFrom ?? 1,
      invoice_range_to: salon.invoiceRangeTo ?? null,
      invoice_valid_until: salon.invoiceValidUntil ?? null,
      applies_vat: salon.appliesVat ?? false,
      vat_percentage: salon.vatPercentage ?? 0,
      invoice_prefix: salon.invoicePrefix ?? 'FV',
      invoice_next_number: salon.invoiceNextNumber ?? 1,
      address: salon.address,
      phone: salon.phone,
      email: salon.email,
      logo_url: salon.logoUrl,
      theme_color: salon.themeColor ?? '#ec4899',
      is_active: salon.isActive ?? true,
      owner_id: salon.ownerId,
    };

    const { data, error } = await supabase.from('salons').insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      nit: data.nit,
      slug: data.slug,
      taxRegime: data.regimen_tributario,
      dianResolution: data.dian_resolution,
      invoiceRangeFrom: data.invoice_range_from,
      invoiceRangeTo: data.invoice_range_to,
      invoiceValidUntil: data.invoice_valid_until,
      appliesVat: data.applies_vat,
      vatPercentage: data.vat_percentage,
      invoicePrefix: data.invoice_prefix,
      invoiceNextNumber: data.invoice_next_number,
      address: data.address,
      phone: data.phone,
      email: data.email,
      logoUrl: data.logo_url,
      themeColor: data.theme_color,
      isActive: data.is_active,
      ownerId: data.owner_id,
      createdAt: data.created_at,
    } as Salon;
  },

  async updateSalon(id: string, salon: Partial<Salon>): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');

    const payload: any = {};
    if (salon.name !== undefined) payload.name = salon.name;
    if (salon.nit !== undefined) payload.nit = salon.nit;
    if (salon.slug !== undefined) payload.slug = salon.slug;
    if (salon.taxRegime !== undefined) payload.regimen_tributario = salon.taxRegime;
    if (salon.dianResolution !== undefined) payload.dian_resolution = salon.dianResolution || null;
    if (salon.invoiceRangeFrom !== undefined) payload.invoice_range_from = salon.invoiceRangeFrom;
    if (salon.invoiceRangeTo !== undefined) payload.invoice_range_to = salon.invoiceRangeTo;
    if (salon.invoiceValidUntil !== undefined) payload.invoice_valid_until = salon.invoiceValidUntil;
    if (salon.appliesVat !== undefined) payload.applies_vat = salon.appliesVat;
    if (salon.vatPercentage !== undefined) payload.vat_percentage = salon.vatPercentage;
    if (salon.invoicePrefix !== undefined) payload.invoice_prefix = salon.invoicePrefix;
    if (salon.invoiceNextNumber !== undefined) payload.invoice_next_number = salon.invoiceNextNumber;
    if (salon.address !== undefined) payload.address = salon.address;
    if (salon.phone !== undefined) payload.phone = salon.phone;
    if (salon.email !== undefined) payload.email = salon.email;
    if (salon.logoUrl !== undefined) payload.logo_url = salon.logoUrl;
    if (salon.themeColor !== undefined) payload.theme_color = salon.themeColor;
    if (salon.isActive !== undefined) payload.is_active = salon.isActive;

    const { error } = await supabase.from('salons').update(payload).eq('id', id);
    if (error) throw error;
  },

  // SALON ID HELPER
  async getSalonId(userId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;

    // Si es demo-user o no es un UUID válido, no intentar consultar Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return null;

    // Preferir RPC segura para evitar recursión RLS en profiles
    const { data: rpcSalonId, error: rpcError } = await supabase.rpc('get_my_salon_id');
    if (!rpcError && rpcSalonId) return rpcSalonId as string;

    // Fallback a metadata de sesión
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;
    if (currentUser?.id === userId) {
      const metaSalonId = (currentUser.app_metadata as any)?.salon_id
        ?? (currentUser.user_metadata as any)?.salon_id
        ?? null;
      if (metaSalonId) return metaSalonId as string;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', userId)
      .single();

    if (error) return null; // No lanzar error en caso de que no exista el registro
    return (data as any)?.salon_id ?? null;
  },

  // SERVICES
  async getServices(userId?: string, salonId?: string): Promise<Service[]> {
    if (!isSupabaseConfigured()) return mockServices;

    let query = supabase
      .from('services')
      .select('*');

    if (salonId) {
      query = query.or(`salon_id.eq.${salonId},salon_id.is.null`);
    } else if (userId) {
      const resolved = await api.getSalonId(userId);
      if (resolved) {
        query = query.or(`salon_id.eq.${resolved},salon_id.is.null`);
      }
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
      taxTreatment: d.tax_treatment ?? 'gravado',
      imageUrl: d.image_url,
      isActive: d.is_active,
      salonId: d.salon_id,
    })) as Service[];
  },

  async getManageableServices(userId?: string, salonId?: string): Promise<Service[]> {
    if (!isSupabaseConfigured()) return mockServices;

    const { data, error } = await supabase.rpc('get_manageable_services', {
      p_salon_id: salonId ?? null,
    });

    if (error) {
      return api.getServices(userId, salonId);
    }

    return (data as any[]).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      durationMinutes: d.duration_minutes,
      price: d.price,
      category: d.category,
      taxTreatment: d.tax_treatment ?? 'gravado',
      imageUrl: d.image_url,
      isActive: d.is_active,
      salonId: d.salon_id,
    })) as Service[];
  },

  async getBookableServices(userId?: string, salonId?: string): Promise<Service[]> {
    if (!isSupabaseConfigured()) return mockServices.filter((s) => s.isActive !== false);

    const { data, error } = await supabase.rpc('get_bookable_services', {
      p_salon_id: salonId ?? null,
    });
    if (error) throw error;

    const mapped = (data as any[]).map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      durationMinutes: d.duration_minutes,
      price: d.price,
      category: d.category,
      taxTreatment: d.tax_treatment ?? 'gravado',
      imageUrl: d.image_url,
      isActive: d.is_active,
      salonId: d.salon_id,
    })) as Service[];

    if (mapped.length > 0) return mapped;
    return api.getServices(userId, salonId);
  },

  async createService(service: Partial<Service>, userId?: string): Promise<Service> {
    if (!isSupabaseConfigured()) throw new Error('Mock no soportado en creación admin.');

    let salonId = service.salonId;
    if (!salonId && userId) {
      salonId = (await api.getSalonId(userId)) ?? undefined;
    }

    const { data: savedId, error: saveError } = await supabase.rpc('save_manageable_service', {
      p_id: null,
      p_name: service.name ?? null,
      p_description: service.description ?? null,
      p_duration_minutes: service.durationMinutes ?? null,
      p_price: service.price ?? null,
      p_category: service.category ?? null,
      p_tax_treatment: service.taxTreatment ?? 'gravado',
      p_image_url: service.imageUrl ?? null,
      p_is_active: service.isActive ?? true,
      p_salon_id: salonId ?? null,
    });
    if (saveError) throw saveError;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', savedId as string)
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      durationMinutes: data.duration_minutes,
      price: data.price,
      category: data.category,
      taxTreatment: data.tax_treatment ?? 'gravado',
      imageUrl: data.image_url,
      isActive: data.is_active,
    } as Service;
  },

  async updateService(id: string, service: Partial<Service>): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Mock no soportado en edición admin.');
    
    const { error } = await supabase.rpc('save_manageable_service', {
      p_id: id,
      p_name: service.name ?? null,
      p_description: service.description ?? null,
      p_duration_minutes: service.durationMinutes ?? null,
      p_price: service.price ?? null,
      p_category: service.category ?? null,
      p_tax_treatment: service.taxTreatment ?? null,
      p_image_url: service.imageUrl ?? null,
      p_is_active: service.isActive ?? null,
      p_salon_id: service.salonId ?? null,
    });
    if (error) throw error;
  },

  async deleteService(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Servicio eliminado', id);
      return;
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // PROFILES
  async getAllProfiles(): Promise<Profile[]> {
    if (!isSupabaseConfigured()) {
      return mockClients.map((client) => {
        const nameParts = resolveNameParts({
          firstName: client.firstName,
          secondName: client.secondName,
          lastName: client.lastName,
          secondLastName: client.secondLastName,
        }, client.fullName);
        return {
          ...client,
          fullName: formatFullName(nameParts) || client.fullName,
          firstName: nameParts.firstName || '',
          secondName: nameParts.secondName || '',
          lastName: nameParts.lastName || '',
          secondLastName: nameParts.secondLastName || '',
          department: client.department || '',
          city: client.city || '',
          isAvailable: client.isAvailable ?? true,
          breakStartTime: client.breakStartTime,
          breakEndTime: client.breakEndTime,
          status: client.status || 'active',
          terminatedAt: client.terminatedAt ?? null,
          medicalFormRequested: client.medicalFormRequested ?? false,
        } as Profile;
      });
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_directory');
    if (!rpcError && Array.isArray(rpcData)) {
      return (rpcData as any[]).map((d) => {
        const nameParts = resolveNameParts({
          firstName: d.first_name,
          secondName: d.second_name,
          lastName: d.last_name,
          secondLastName: d.second_last_name,
        }, d.full_name);
        const fullName = formatFullName(nameParts) || d.full_name || '';

        return {
          id: d.id,
          fullName,
          firstName: nameParts.firstName || '',
          secondName: nameParts.secondName || '',
          lastName: nameParts.lastName || '',
          secondLastName: nameParts.secondLastName || '',
          documentId: '',
          birthDate: '',
          gender: '',
          email: d.email ?? '',
          phone: d.phone ?? '',
          address: '',
          department: '',
          city: '',
          status: d.status ?? 'active',
          terminatedAt: null,
          isAvailable: (d.status ?? 'active') === 'active',
          breakStartTime: undefined,
          breakEndTime: undefined,
          bloodType: '',
          medicalConditions: '',
          allergies: '',
          medicalFormRequested: false,
          role: d.role ?? 'client',
          specialty: '',
          avatarUrl: undefined,
          salonId: d.salon_id ?? undefined,
          createdAt: d.created_at ?? '',
          workStartTime: undefined,
          workEndTime: undefined,
        } as Profile;
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    
    return (data as any[]).map((d) => {
      const nameParts = resolveNameParts({
        firstName: d.first_name,
        secondName: d.second_name,
        lastName: d.last_name,
        secondLastName: d.second_last_name,
      }, d.full_name);
      const fullName = formatFullName(nameParts) || d.full_name || '';

      return {
        id: d.id,
        fullName,
        firstName: nameParts.firstName || '',
        secondName: nameParts.secondName || '',
        lastName: nameParts.lastName || '',
        secondLastName: nameParts.secondLastName || '',
        documentId: d.document_id ?? '',
        birthDate: d.birth_date ?? '',
        gender: d.gender ?? '',
        email: d.email ?? '',
        phone: d.phone ?? '',
        address: d.address ?? '',
        department: d.department ?? '',
        city: d.city ?? '',
        status: d.status ?? 'active',
        terminatedAt: d.terminated_at ?? null,
        isAvailable: (d.status ?? 'active') === 'active' ? (d.is_available ?? true) : false,
        breakStartTime: d.break_start_time ? d.break_start_time.substring(0, 5) : undefined,
        breakEndTime: d.break_end_time ? d.break_end_time.substring(0, 5) : undefined,
        bloodType: d.blood_type ?? '',
        medicalConditions: d.medical_conditions ?? '',
        allergies: d.allergies ?? '',
        medicalFormRequested: d.medical_form_requested ?? false,
        role: d.role ?? 'client',
        specialty: d.specialty ?? '',
        avatarUrl: d.avatar_url ?? undefined,
        salonId: d.salon_id ?? undefined,
        createdAt: d.created_at ?? '',
        workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : undefined,
        workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : undefined,
      } as Profile;
    });
  },

  async getBookableClients(userId?: string, salonId?: string): Promise<Profile[]> {
    if (!isSupabaseConfigured()) {
      return mockClients.filter((c) => c.role === 'client') as Profile[];
    }

    const { data: currentRole } = await supabase.rpc('get_my_role');
    if (currentRole === 'superadmin') {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_superadmin_bookable_clients', {
        p_salon_id: salonId ?? null,
      });
      if (rpcError) throw rpcError;
      return (rpcData as any[]).map((d) => ({
        id: d.id,
        fullName: d.full_name ?? '',
        email: d.email ?? '',
        phone: d.phone ?? '',
        role: d.role ?? 'client',
        avatarUrl: d.avatar_url ?? undefined,
        salonId: d.salon_id ?? undefined,
        status: d.status ?? 'active',
        createdAt: d.created_at ?? '',
      })) as Profile[];
    }

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name', { ascending: true });

    if (salonId) {
      query = query.eq('salon_id', salonId);
    } else if (userId) {
      const resolved = await api.getSalonId(userId);
      if (resolved) query = query.eq('salon_id', resolved);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data as any[]).map((d) => ({
      id: d.id,
      fullName: d.full_name ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      role: d.role ?? 'client',
      avatarUrl: d.avatar_url ?? undefined,
      salonId: d.salon_id ?? undefined,
      status: d.status ?? 'active',
      createdAt: d.created_at ?? '',
    })) as Profile[];
  },

  async inviteUser(payload: {
    email: string;
    role: UserRole;
    firstName?: string;
    secondName?: string;
    lastName?: string;
    secondLastName?: string;
    salonId?: string;
    phone?: string;
  }): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Usuario invitado', payload);
      return;
    }

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: payload,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }
  },

  async getStylists(userId?: string, salonId?: string): Promise<Stylist[]> {
    if (!isSupabaseConfigured()) {
      return [
        { id: 'sty-1', name: 'Ana Rodríguez', specialty: 'Colorista Senior', description: 'Experta en balayage.', workStartTime: '09:00', workEndTime: '15:00', breakStartTime: '12:00', breakEndTime: '13:00', isAvailable: true },
        { id: 'sty-2', name: 'Carlos López', specialty: 'Estilista', description: 'Cortes modernos.', workStartTime: '12:00', workEndTime: '19:00', breakStartTime: '15:00', breakEndTime: '16:00', isAvailable: true },
      ];
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_bookable_stylists', {
      p_salon_id: salonId ?? null,
    });
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return (rpcData as any[]).map((d) => ({
        id: d.id,
        name: d.full_name ?? '',
        specialty: d.specialty ?? 'Estilista',
        avatarUrl: d.avatar_url ?? undefined,
        description: d.medical_conditions ?? '',
        workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : '09:00',
        workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : '18:00',
        breakStartTime: d.break_start_time ? d.break_start_time.substring(0, 5) : undefined,
        breakEndTime: d.break_end_time ? d.break_end_time.substring(0, 5) : undefined,
        isAvailable: d.status === 'inactive' ? false : (d.is_available ?? true),
      })) as Stylist[];
    }

    let query = supabase
      .from('profiles')
      .select('id, full_name, specialty, avatar_url, medical_conditions, work_start_time, work_end_time, break_start_time, break_end_time, is_available, salon_id, status')
      .eq('role', 'stylist')
      .order('full_name', { ascending: true });

    if (salonId) {
      query = query.or(`salon_id.eq.${salonId},salon_id.is.null`);
    } else if (userId) {
      const resolved = await api.getSalonId(userId);
      if (resolved) {
        query = query.or(`salon_id.eq.${resolved},salon_id.is.null`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data as any[])
      .filter((d) => d.status !== 'terminated')
      .map((d) => ({
      id: d.id,
      name: d.full_name ?? '',
      specialty: d.specialty ?? 'Estilista',
      avatarUrl: d.avatar_url ?? undefined,
      description: d.medical_conditions ?? '',
      workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : '09:00', // Time comes as HH:mm:ss, convert to HH:mm
      workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : '18:00',
      breakStartTime: d.break_start_time ? d.break_start_time.substring(0, 5) : undefined,
      breakEndTime: d.break_end_time ? d.break_end_time.substring(0, 5) : undefined,
      isAvailable: d.status === 'inactive' ? false : (d.is_available ?? true),
    })) as Stylist[];
  },

  async getProfile(userId: string): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      const nameParts = resolveNameParts({
        firstName: mockCurrentUser.firstName,
        secondName: mockCurrentUser.secondName,
        lastName: mockCurrentUser.lastName,
        secondLastName: mockCurrentUser.secondLastName,
      }, mockCurrentUser.fullName);
      return {
        ...mockCurrentUser,
        fullName: formatFullName(nameParts) || mockCurrentUser.fullName,
        firstName: nameParts.firstName || '',
        secondName: nameParts.secondName || '',
        lastName: nameParts.lastName || '',
        secondLastName: nameParts.secondLastName || '',
        isAvailable: mockCurrentUser.isAvailable ?? true,
        breakStartTime: mockCurrentUser.breakStartTime,
        breakEndTime: mockCurrentUser.breakEndTime,
        medicalFormRequested: mockCurrentUser.medicalFormRequested ?? false,
      } as Profile;
    }

    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (authUser?.id === userId) {
      const { data: myRpcData, error: myRpcError } = await supabase.rpc('get_my_profile_safe');
      const myRpcRow = Array.isArray(myRpcData) ? myRpcData[0] : null;
      if (!myRpcError && myRpcRow) {
        const d = myRpcRow as any;
        if (!hasFullProfileColumns(d)) {
          // Algunos entornos tienen una versión antigua del RPC con menos columnas.
          // Continuamos con los siguientes fallbacks para recuperar el perfil completo.
        } else {
        const nameParts = resolveNameParts({
          firstName: d.first_name,
          secondName: d.second_name,
          lastName: d.last_name,
          secondLastName: d.second_last_name,
        }, d.full_name);
        const fullName = formatFullName(nameParts) || d.full_name || '';
        return {
          id: d.id,
          fullName,
          firstName: nameParts.firstName || '',
          secondName: nameParts.secondName || '',
          lastName: nameParts.lastName || '',
          secondLastName: nameParts.secondLastName || '',
          documentId: d.document_id ?? '',
          birthDate: d.birth_date ?? '',
          gender: d.gender ?? '',
          email: d.email ?? '',
          phone: d.phone ?? '',
          address: d.address ?? '',
          department: d.department ?? '',
          city: d.city ?? '',
          status: d.status ?? 'active',
          terminatedAt: d.terminated_at ?? null,
          isAvailable: (d.status ?? 'active') === 'active' ? (d.is_available ?? true) : false,
          breakStartTime: d.break_start_time ? d.break_start_time.substring(0, 5) : undefined,
          breakEndTime: d.break_end_time ? d.break_end_time.substring(0, 5) : undefined,
          bloodType: d.blood_type ?? '',
          medicalConditions: d.medical_conditions ?? '',
          allergies: d.allergies ?? '',
          medicalFormRequested: d.medical_form_requested ?? false,
          role: d.role ?? 'client',
          specialty: d.specialty ?? '',
          avatarUrl: d.avatar_url ?? undefined,
          salonId: d.salon_id ?? undefined,
          createdAt: d.created_at ?? '',
          workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : undefined,
          workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : undefined,
        } as Profile;
        }
      }
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_profile_safe', {
      p_user_id: userId,
    });

    const rpcRow = Array.isArray(rpcData) ? rpcData[0] : null;
    if (!rpcError && rpcRow) {
      const d = rpcRow as any;
      if (!hasFullProfileColumns(d)) {
        // Si el RPC retorna una firma recortada, evitamos devolver datos parciales.
      } else {
      const nameParts = resolveNameParts({
        firstName: d.first_name,
        secondName: d.second_name,
        lastName: d.last_name,
        secondLastName: d.second_last_name,
      }, d.full_name);
      const fullName = formatFullName(nameParts) || d.full_name || '';
      return {
        id: d.id,
        fullName,
        firstName: nameParts.firstName || '',
        secondName: nameParts.secondName || '',
        lastName: nameParts.lastName || '',
        secondLastName: nameParts.secondLastName || '',
        documentId: d.document_id ?? '',
        birthDate: d.birth_date ?? '',
        gender: d.gender ?? '',
        email: d.email ?? '',
        phone: d.phone ?? '',
        address: d.address ?? '',
        department: d.department ?? '',
        city: d.city ?? '',
        status: d.status ?? 'active',
        terminatedAt: d.terminated_at ?? null,
        isAvailable: (d.status ?? 'active') === 'active' ? (d.is_available ?? true) : false,
        breakStartTime: d.break_start_time ? d.break_start_time.substring(0, 5) : undefined,
        breakEndTime: d.break_end_time ? d.break_end_time.substring(0, 5) : undefined,
        bloodType: d.blood_type ?? '',
        medicalConditions: d.medical_conditions ?? '',
        allergies: d.allergies ?? '',
        medicalFormRequested: d.medical_form_requested ?? false,
        role: d.role ?? 'client',
        specialty: d.specialty ?? '',
        avatarUrl: d.avatar_url ?? undefined,
        salonId: d.salon_id ?? undefined,
        createdAt: d.created_at ?? '',
        workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : undefined,
        workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : undefined,
      } as Profile;
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      const errorMessage = String((error as any)?.message || '');
      const isSafeFallbackCase =
        (error as any)?.code === 'PGRST116' ||
        errorMessage.toLowerCase().includes('infinite recursion detected');

      if (!isSafeFallbackCase) throw error;

      // Fallback robusto: no depende de SELECT directo sobre profiles
      const user = authUser;
      const { data: roleData } = await supabase.rpc('get_my_role');
      const { data: salonData } = await supabase.rpc('get_my_salon_id');
      const { data: dirData, error: dirError } = await supabase.rpc('get_user_directory');

      if (!dirError && Array.isArray(dirData)) {
        const dirRow = (dirData as any[]).find((row) => row.id === userId);
        if (dirRow) {
          const nameParts = resolveNameParts({
            firstName: dirRow.first_name,
            secondName: dirRow.second_name,
            lastName: dirRow.last_name,
            secondLastName: dirRow.second_last_name,
          }, dirRow.full_name);
          const fullName = formatFullName(nameParts) || dirRow.full_name || user?.email?.split('@')[0] || 'Usuario';

          return {
            id: dirRow.id,
            fullName,
            firstName: nameParts.firstName || '',
            secondName: nameParts.secondName || '',
            lastName: nameParts.lastName || '',
            secondLastName: nameParts.secondLastName || '',
            email: dirRow.email || user?.email || '',
            phone: dirRow.phone || '',
            role: dirRow.role || (roleData as any) || 'client',
            status: dirRow.status || 'active',
            salonId: dirRow.salon_id ?? (salonData as any) ?? undefined,
            isAvailable: (dirRow.status ?? 'active') === 'active',
            medicalFormRequested: false,
            createdAt: dirRow.created_at || new Date().toISOString(),
            department: '',
            city: '',
            breakStartTime: undefined,
            breakEndTime: undefined,
            terminatedAt: null,
          } as Profile;
        }
      }

      const derivedFullName =
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'Usuario';
      const nameParts = resolveNameParts({}, derivedFullName);

      return {
        id: userId,
        fullName: formatFullName(nameParts) || derivedFullName,
        firstName: nameParts.firstName || '',
        secondName: nameParts.secondName || '',
        lastName: nameParts.lastName || '',
        secondLastName: nameParts.secondLastName || '',
        email: user?.email || '',
        department: '',
        city: '',
        isAvailable: true,
        breakStartTime: undefined,
        breakEndTime: undefined,
        role: (roleData as any) || 'client',
        status: 'active',
        terminatedAt: null,
        medicalFormRequested: false,
        salonId: (salonData as any) ?? undefined,
        createdAt: new Date().toISOString(),
      } as Profile;
    }
    const d = data as any;
    const nameParts = resolveNameParts({
      firstName: d.first_name,
      secondName: d.second_name,
      lastName: d.last_name,
      secondLastName: d.second_last_name,
    }, d.full_name);
    const fullName = formatFullName(nameParts) || d.full_name || '';
    return {
      id: d.id,
      fullName,
      firstName: nameParts.firstName || '',
      secondName: nameParts.secondName || '',
      lastName: nameParts.lastName || '',
      secondLastName: nameParts.secondLastName || '',
      documentId: d.document_id ?? '',
      birthDate: d.birth_date ?? '',
      gender: d.gender ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      address: d.address ?? '',
      department: d.department ?? '',
      city: d.city ?? '',
      status: d.status ?? 'active',
      terminatedAt: d.terminated_at ?? null,
      isAvailable: (d.status ?? 'active') === 'active' ? (d.is_available ?? true) : false,
      breakStartTime: d.break_start_time ? d.break_start_time.substring(0, 5) : undefined,
      breakEndTime: d.break_end_time ? d.break_end_time.substring(0, 5) : undefined,
      bloodType: d.blood_type ?? '',
      medicalConditions: d.medical_conditions ?? '',
      allergies: d.allergies ?? '',
      medicalFormRequested: d.medical_form_requested ?? false,
      role: d.role ?? 'client',
      specialty: d.specialty ?? '',
      avatarUrl: d.avatar_url ?? undefined,
      salonId: d.salon_id ?? undefined,
      createdAt: d.created_at ?? '',
      workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : undefined,
      workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : undefined,
    } as Profile;
  },

  async updateProfile(profile: Partial<Profile>): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Perfil actualizado', profile);
      return;
    }

    if (!profile.id) {
      throw new Error('Perfil sin id');
    }

    const payload: any = {};
    const hasNameParts = [
      profile.firstName,
      profile.secondName,
      profile.lastName,
      profile.secondLastName,
    ].some((value) => value !== undefined);

    if (profile.fullName !== undefined) {
      const trimmed = profile.fullName.trim();
      if (trimmed) payload.full_name = trimmed;
    }
    if (profile.firstName !== undefined) payload.first_name = profile.firstName?.trim() || null;
    if (profile.secondName !== undefined) payload.second_name = profile.secondName?.trim() || null;
    if (profile.lastName !== undefined) payload.last_name = profile.lastName?.trim() || null;
    if (profile.secondLastName !== undefined) payload.second_last_name = profile.secondLastName?.trim() || null;
    if (profile.documentId !== undefined) payload.document_id = profile.documentId;
    if (profile.birthDate !== undefined) payload.birth_date = profile.birthDate || null;
    if (profile.gender !== undefined) payload.gender = profile.gender || null;
    if (profile.phone !== undefined) payload.phone = profile.phone;
    if (profile.address !== undefined) payload.address = profile.address;
    if (profile.department !== undefined) payload.department = profile.department || null;
    if (profile.city !== undefined) payload.city = profile.city || null;
    if (profile.isAvailable !== undefined) payload.is_available = profile.isAvailable;
    if (profile.breakStartTime !== undefined) payload.break_start_time = profile.breakStartTime ? `${profile.breakStartTime}:00` : null;
    if (profile.breakEndTime !== undefined) payload.break_end_time = profile.breakEndTime ? `${profile.breakEndTime}:00` : null;
    if (profile.status !== undefined) payload.status = profile.status;
    if (profile.status === 'active') {
      payload.terminated_at = null;
    }
    if (profile.status === 'terminated' && profile.terminatedAt == null) {
      payload.terminated_at = new Date().toISOString();
    }
    if (profile.status && profile.status !== 'active') {
      payload.is_available = false;
    }
    if (profile.bloodType !== undefined) payload.blood_type = profile.bloodType || null;
    if (profile.medicalConditions !== undefined) payload.medical_conditions = profile.medicalConditions;
    if (profile.allergies !== undefined) payload.allergies = profile.allergies;
    if (profile.medicalFormRequested !== undefined) payload.medical_form_requested = profile.medicalFormRequested;
    if (profile.role !== undefined) payload.role = profile.role;
    if (profile.specialty !== undefined) payload.specialty = profile.specialty || null;
    if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl;
    if (profile.salonId !== undefined) payload.salon_id = profile.salonId || null;
    if (profile.status === 'terminated') payload.salon_id = null;
    if (profile.workStartTime !== undefined) payload.work_start_time = profile.workStartTime ? `${profile.workStartTime}:00` : null;
    if (profile.workEndTime !== undefined) payload.work_end_time = profile.workEndTime ? `${profile.workEndTime}:00` : null;

    if (hasNameParts && payload.full_name === undefined) {
      const computed = formatFullName({
        firstName: profile.firstName,
        secondName: profile.secondName,
        lastName: profile.lastName,
        secondLastName: profile.secondLastName,
      });
      if (computed) payload.full_name = computed;
    }

    if (Object.keys(payload).length === 0) return;

    const { error: rpcSaveError } = await supabase.rpc('save_profile_safe', {
      p_profile_id: profile.id,
      p_payload: payload,
    });

    if (!rpcSaveError) return;
    if ((rpcSaveError as any)?.code !== 'PGRST202') {
      throw rpcSaveError;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profile.id)
      .select('id');

    if (updateError) throw updateError;
    if (updatedRows && updatedRows.length > 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profile.id) {
      throw new Error('No se encontró el perfil para actualizar.');
    }

    const fullName = payload.full_name
      || profile.fullName
      || user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || 'Usuario';
    const email = profile.email || user.email || '';
    const role = profile.role || 'client';

    const insertPayload = {
      id: profile.id,
      ...payload,
      full_name: fullName,
      email,
      role,
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(insertPayload);

    if (insertError) throw insertError;
  },

  // APPOINTMENTS
  async getDashboardAppointments(): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) return mockAppointments;

    const { data, error } = await supabase.rpc('get_dashboard_appointments_safe');
    if (error) throw error;

    return ((data as any[]) || []).map((d) => ({
      id: d.id,
      clientId: d.client_id,
      clientName: d.client_name ?? '',
      serviceId: d.service_id,
      serviceName: d.service_name ?? '',
      servicePrice: Number(d.service_price ?? 0),
      stylistId: d.stylist_id ?? undefined,
      stylistName: d.stylist_name ?? 'Sin asignar',
      appointmentDate: d.appointment_date,
      status: d.status,
      paymentMethod: d.payment_method ?? 'efectivo',
      isPaid: d.is_paid ?? false,
      salonId: d.salon_id ?? undefined,
    })) as Appointment[];
  },

  async getAppointments(
    clientId?: string,
    userId?: string,
    options?: { skipSalonFilter?: boolean }
  ): Promise<Appointment[]> {
    // Si los IDs no son UUIDs válidos, retornar mock en lugar de fallar (modo demo)
    const isValidClientId = !clientId || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId);
    const isValidUserId = !userId || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);

    if (!isSupabaseConfigured() || !isValidClientId || !isValidUserId) {
      return clientId && clientId === 'demo-user'
        ? mockAppointments.filter(a => a.clientId === 'demo-user')
        : mockAppointments;
    }

    if (options?.skipSalonFilter) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_superadmin_calendar_appointments');
      if (!rpcError && Array.isArray(rpcData)) {
        return (rpcData as any[]).map((d) => ({
          id: d.id,
          clientId: d.client_id,
          clientName: d.client_name ?? '',
          clientPhone: d.client_phone ?? '',
          serviceId: d.service_id,
          serviceName: d.service_name ?? '',
          servicePrice: d.service_price ?? 0,
          stylistId: d.stylist_id,
          stylistName: d.stylist_name ?? 'Sin asignar',
          appointmentDate: d.appointment_date,
          status: d.status,
          paymentMethod: d.payment_method,
          isPaid: d.is_paid ?? false,
          readyForBilling: d.ready_for_billing ?? false,
          readyForBillingAt: d.ready_for_billing_at ?? null,
          readyForBillingBy: d.ready_for_billing_by ?? null,
          canceledAt: d.canceled_at ?? null,
          canceledBy: d.canceled_by ?? null,
          notes: d.notes ?? '',
          salonId: d.salon_id,
          salonName: d.salon_name ?? '',
          allergies: d.allergies ?? '',
          medicalConditions: d.medical_conditions ?? '',
          medicalFormRequested: d.medical_form_requested ?? false,
        })) as Appointment[];
      }
    }

    // Ruta segura por RPC para evitar depender de SELECT directo sobre profiles
    const { data: safeData, error: safeError } = await supabase.rpc('get_dashboard_appointments_safe');
    if (!safeError && Array.isArray(safeData)) {
      const filtered = clientId
        ? (safeData as any[]).filter((d) => d.client_id === clientId)
        : (safeData as any[]);

      return filtered.map((d) => ({
        id: d.id,
        clientId: d.client_id,
        clientName: d.client_name ?? '',
        clientPhone: d.client_phone ?? '',
        serviceId: d.service_id,
        serviceName: d.service_name ?? '',
        servicePrice: Number(d.service_price ?? 0),
        stylistId: d.stylist_id,
        stylistName: d.stylist_name ?? 'Sin asignar',
        appointmentDate: d.appointment_date,
        status: d.status,
        paymentMethod: d.payment_method ?? 'efectivo',
        isPaid: d.is_paid ?? false,
        readyForBilling: d.ready_for_billing ?? false,
        readyForBillingAt: d.ready_for_billing_at ?? null,
        readyForBillingBy: d.ready_for_billing_by ?? null,
        canceledAt: d.canceled_at ?? null,
        canceledBy: d.canceled_by ?? null,
        notes: d.notes ?? '',
        salonId: d.salon_id,
        salonName: d.salon_name ?? '',
        allergies: d.allergies ?? '',
        medicalConditions: d.medical_conditions ?? '',
        medicalFormRequested: d.medical_form_requested ?? false,
      })) as Appointment[];
    }

    let query = supabase
      .from('appointments')
      .select('*, services(name, price), profiles!client_id(full_name, allergies, medical_conditions, medical_form_requested, phone), stylist:profiles!stylist_id(full_name), salons(name)');

    if (userId && !options?.skipSalonFilter) {
      const salonId = await api.getSalonId(userId);
      if (salonId) query = query.eq('salon_id', salonId);
    }

    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;
    if (error) {
      const errorMessage = String((error as any)?.message || '').toLowerCase();
      if (errorMessage.includes('infinite recursion detected')) {
        throw new Error('Error de políticas RLS en perfiles. Ejecuta el esquema SQL más reciente de Supabase para corregir la recursión.');
      }
      throw error;
    }
    return (data as any[]).map((d) => ({
      id: d.id,
      clientId: d.client_id,
      clientName: d.profiles?.full_name ?? '',
      clientPhone: d.profiles?.phone ?? '',
      serviceId: d.service_id,
      serviceName: d.services?.name ?? '',
      servicePrice: d.services?.price ?? 0,
      stylistId: d.stylist_id,
      stylistName: d.stylist?.full_name ?? 'Sin asignar',
      appointmentDate: d.appointment_date,
      status: d.status,
      paymentMethod: d.payment_method,
      isPaid: d.is_paid ?? false,
      readyForBilling: d.ready_for_billing ?? false,
      readyForBillingAt: d.ready_for_billing_at ?? null,
      readyForBillingBy: d.ready_for_billing_by ?? null,
      canceledAt: d.canceled_at ?? null,
      canceledBy: d.canceled_by ?? null,
      notes: d.notes ?? '',
      salonId: d.salon_id,
      salonName: d.salons?.name ?? '',
      allergies: d.profiles?.allergies ?? '',
      medicalConditions: d.profiles?.medical_conditions ?? '',
      medicalFormRequested: d.profiles?.medical_form_requested ?? false,
    })) as Appointment[];
  },

  async createAppointment(appointment: Partial<Appointment>, userId?: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Cita creada', appointment);
      return;
    }

    let salonId = appointment.salonId || null;
    if (!salonId && userId) {
      salonId = await api.getSalonId(userId);
    }

    if (!salonId) {
      const { data: currentRole } = await supabase.rpc('get_my_role');
      if (currentRole === 'superadmin') {
        throw new Error('Selecciona un salón antes de reservar la cita.');
      }
      throw new Error('Tu usuario no tiene salón asignado. Actualiza tu perfil para reservar citas.');
    }

    // Resolve primary service id (first of array, or singular fallback)
    const primaryServiceId =
      appointment.serviceIds && appointment.serviceIds.length > 0
        ? appointment.serviceIds[0]
        : appointment.serviceId;

    const { error, data: rpcData } = await supabase.rpc('create_bookable_appointment', {
      p_client_id: appointment.clientId,
      p_service_id: primaryServiceId,
      p_stylist_id: appointment.stylistId || null,
      p_appointment_date: appointment.appointmentDate,
      p_status: appointment.status || 'pendiente',
      p_payment_method: appointment.paymentMethod || 'efectivo',
      p_notes: appointment.notes || null,
      p_salon_id: salonId,
    });

    if (error) throw error;

    // Insert additional services into appointment_services junction table
    const extraServiceIds = (appointment.serviceIds ?? []).slice(1);
    if (extraServiceIds.length > 0 && rpcData) {
      // rpcData may be the new appointment id (uuid) returned by the RPC
      const appointmentId = typeof rpcData === 'string' ? rpcData : (rpcData as any)?.[0]?.id ?? null;
      if (appointmentId) {
        const rows = extraServiceIds.map((sid) => ({
          appointment_id: appointmentId,
          service_id: sid,
        }));
        const { error: junctionError } = await supabase
          .from('appointment_services')
          .insert(rows);
        if (junctionError) {
          console.error('Error al insertar servicios adicionales:', junctionError);
          // Non-blocking: the main appointment was already created
        }
      }
    }
  },

  async getAvailableTimeSlots(
    date: string,
    stylistId: string,
    durationMinutes: number,
    workStartTimeStr: string = '09:00',
    workEndTimeStr: string = '18:00',
    breakStartTimeStr?: string,
    breakEndTimeStr?: string,
    isAvailable: boolean = true
  ): Promise<TimeSlot[]> {
    if (!isAvailable) return [];

    const parseTimeToMinutes = (value?: string | null) => {
      if (!value) return null;
      const [h, m] = value.split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };

    const baseSlots: string[] = [];
    
    // Parse work bounds
    const startTotalMins = parseTimeToMinutes(workStartTimeStr) ?? (9 * 60);
    const endTotalMins = parseTimeToMinutes(workEndTimeStr) ?? (18 * 60);
    if (endTotalMins <= startTotalMins) return [];

    // Context for "Today" and current time
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv'); // 'YYYY-MM-DD'
    const isToday = date === todayStr;
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();
    const gracePeriod = 30; // 30 minutes grace period for same-day bookings

    for (let currentMins = startTotalMins; currentMins < endTotalMins; currentMins += 30) {
      // 1. Duración básica: ¿Cabe el servicio antes del cierre?
      if (currentMins + durationMinutes > endTotalMins) {
        continue;
      }

      // 2. Validación de Tiempo Real: Si es hoy, ¿estamos en el pasado o muy cerca?
      if (isToday && currentMins < (currentTotalMins + gracePeriod)) {
        continue;
      }

      const h = Math.floor(currentMins / 60).toString().padStart(2, '0');
      const m = (currentMins % 60).toString().padStart(2, '0');
      baseSlots.push(`${h}:${m}`);
    }

    const occupiedRanges: { start: number; end: number }[] = [];

    const breakStart = parseTimeToMinutes(breakStartTimeStr);
    const breakEnd = parseTimeToMinutes(breakEndTimeStr);
    if (breakStart !== null && breakEnd !== null && breakEnd > breakStart) {
      occupiedRanges.push({ start: breakStart, end: breakEnd });
    }

    if (!isSupabaseConfigured() || !stylistId) {
      return baseSlots.map(time => {
        const [h, m] = time.split(':').map(Number);
        const slotStart = h * 60 + m;
        const slotEnd = slotStart + durationMinutes;
        const isOccupied = occupiedRanges.some(
          (range) => slotStart < range.end && slotEnd > range.start
        );
        return { time, available: !isOccupied };
      });
    }

    // Cargar citas ocupadas usando el RPC seguro que ignora RLS
    const { data: appointments, error } = await supabase.rpc('get_busy_slots', {
      p_stylist_id: stylistId,
      p_date: date
    });

    if (error) {
      console.error('Error fetching appointments for slots:', error);
      return baseSlots.map(time => ({ time, available: true })); // fallback
    }

    // Parse each appointment into a start and end time (in minutes from midnight)
    (appointments || []).forEach((appt: any) => {
      const d = new Date(appt.appointment_date);
      const startMins = d.getHours() * 60 + d.getMinutes();
      const dur = appt.duration_minutes || 30; // El RPC ya nos da la duración
      occupiedRanges.push({ start: startMins, end: startMins + dur });
    });

    const { data: unavailability, error: unavailabilityError } = await supabase
      .from('stylist_unavailability')
      .select('id, date, start_time, end_time, is_all_day')
      .eq('stylist_id', stylistId)
      .eq('date', date);

    if (unavailabilityError) {
      console.error('Error fetching unavailability:', unavailabilityError);
    } else if (unavailability?.some((u: any) => u.is_all_day)) {
      return [];
    } else {
      (unavailability || []).forEach((u: any) => {
        if (!u.start_time || !u.end_time) return;
        const startMins = parseTimeToMinutes(u.start_time);
        const endMins = parseTimeToMinutes(u.end_time);
        if (startMins !== null && endMins !== null && endMins > startMins) {
          occupiedRanges.push({ start: startMins, end: endMins });
        }
      });
    }

    return baseSlots.map(time => {
      const [h, m] = time.split(':').map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + durationMinutes;

      // Check if [slotStart, slotEnd) overlaps with any [occupied.start, occupied.end)
      const isOccupied = occupiedRanges.some(
        (range: {start: number; end: number}) => slotStart < range.end && slotEnd > range.start
      );

      return {
        time,
        available: !isOccupied
      };
    });
  },

  // STYLIST UNAVAILABILITY
  async getStylistUnavailability(stylistId: string, date?: string): Promise<StylistUnavailability[]> {
    if (!isSupabaseConfigured() || !stylistId) return [];

    let query = supabase
      .from('stylist_unavailability')
      .select('*')
      .eq('stylist_id', stylistId)
      .order('date', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data as any[]).map((d) => ({
      id: d.id,
      stylistId: d.stylist_id,
      salonId: d.salon_id,
      date: d.date,
      startTime: d.start_time ? d.start_time.substring(0, 5) : null,
      endTime: d.end_time ? d.end_time.substring(0, 5) : null,
      isAllDay: d.is_all_day ?? true,
      reason: d.reason ?? null,
      createdAt: d.created_at,
      createdBy: d.created_by,
    })) as StylistUnavailability[];
  },

  async createStylistUnavailability(entry: {
    stylistId: string;
    date: string;
    isAllDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
    reason?: string | null;
  }): Promise<StylistUnavailability> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const salonId = await api.getSalonId(entry.stylistId);
    const { data: { user } } = await supabase.auth.getUser();

    const payload: any = {
      stylist_id: entry.stylistId,
      salon_id: salonId,
      date: entry.date,
      is_all_day: entry.isAllDay,
      start_time: entry.isAllDay ? null : (entry.startTime ? `${entry.startTime}:00` : null),
      end_time: entry.isAllDay ? null : (entry.endTime ? `${entry.endTime}:00` : null),
      reason: entry.reason || null,
      created_by: user?.id || null,
    };

    const { data, error } = await supabase
      .from('stylist_unavailability')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      stylistId: data.stylist_id,
      salonId: data.salon_id,
      date: data.date,
      startTime: data.start_time ? data.start_time.substring(0, 5) : null,
      endTime: data.end_time ? data.end_time.substring(0, 5) : null,
      isAllDay: data.is_all_day ?? true,
      reason: data.reason ?? null,
      createdAt: data.created_at,
      createdBy: data.created_by,
    } as StylistUnavailability;
  },

  async deleteStylistUnavailability(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('stylist_unavailability')
      .delete()
      .eq('id', id);

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

  getProductImageUrl(path: string): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${supabaseUrl}/storage/v1/object/public/products_images/${path}`;
  },

  async uploadProductImage(file: File): Promise<string> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage
      .from('products_images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw new Error(`Error al subir imagen de producto: ${error.message}`);

    return api.getProductImageUrl(fileName);
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
  },

  async markAppointmentReadyForBilling(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log(`Mock: Cita ${id} marcada lista para facturar`);
      return;
    }

    const { error } = await supabase.rpc('mark_appointment_ready_for_billing', {
      p_appointment_id: id,
    });

    if (error) throw error;
  },

  async cancelAppointment(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log(`Mock: Cita ${id} cancelada`);
      return;
    }

    const { error } = await supabase.rpc('mark_appointment_cancelled', {
      p_appointment_id: id,
    });

    if (error) throw error;
  },

  async deleteAppointment(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log(`Mock: Cita ${id} eliminada`);
      return;
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('is_paid', false);

    if (error) throw error;
  },

  async getUnpaidAppointments(date: string, userId?: string): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) {
      return mockAppointments.filter(a => 
        a.appointmentDate.startsWith(date)
        && !a.isPaid
        && a.status !== 'cancelada'
        && (a.readyForBilling ?? a.status === 'completada')
      );
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_ready_for_billing_appointments', {
      p_date: date,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      return (rpcData as any[]).map((d) => ({
        id: d.id,
        clientId: d.client_id,
        clientName: d.client_name ?? '',
        serviceId: d.service_id,
        serviceName: d.service_name ?? '',
        servicePrice: d.service_price ?? 0,
        serviceTaxTreatment: d.service_tax_treatment ?? 'gravado',
        stylistId: d.stylist_id,
        stylistName: d.stylist_name ?? 'Sin asignar',
        appointmentDate: d.appointment_date,
        status: d.status,
        paymentMethod: d.payment_method,
        isPaid: d.is_paid ?? false,
        readyForBilling: d.ready_for_billing ?? false,
        readyForBillingAt: d.ready_for_billing_at ?? null,
        readyForBillingBy: d.ready_for_billing_by ?? null,
        canceledAt: d.canceled_at ?? null,
        canceledBy: d.canceled_by ?? null,
        notes: d.notes ?? '',
        salonId: d.salon_id,
        salonName: d.salon_name ?? '',
      })) as Appointment[];
    }

    const startOfDay = new Date(`${date}T00:00:00`).toISOString();
    const endOfDay = new Date(`${date}T23:59:59.999`).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(name, price, tax_treatment), profiles!client_id(full_name), stylist:profiles!stylist_id(full_name)')
      .eq('is_paid', false)
      .eq('ready_for_billing', true)
      .neq('status', 'cancelada')
      .gte('appointment_date', startOfDay)
      .lte('appointment_date', endOfDay);

    if (!error && userId) {
      const salonId = await api.getSalonId(userId);
      if (salonId) {
        const { data: scopedData, error: scopedError } = await supabase
          .from('appointments')
          .select('*, services(name, price, tax_treatment), profiles!client_id(full_name), stylist:profiles!stylist_id(full_name)')
          .eq('is_paid', false)
          .eq('ready_for_billing', true)
          .neq('status', 'cancelada')
          .eq('salon_id', salonId)
          .gte('appointment_date', startOfDay)
          .lte('appointment_date', endOfDay);
        if (!scopedError) {
          return (scopedData as any[]).map((d) => ({
            id: d.id,
            clientId: d.client_id,
            clientName: d.profiles?.full_name ?? '',
            serviceId: d.service_id,
            serviceName: d.services?.name ?? '',
            servicePrice: d.services?.price ?? 0,
            serviceTaxTreatment: d.services?.tax_treatment ?? 'gravado',
            stylistId: d.stylist_id,
            stylistName: d.stylist?.full_name ?? 'Sin asignar',
            appointmentDate: d.appointment_date,
            status: d.status,
            paymentMethod: d.payment_method,
            isPaid: d.is_paid ?? false,
            readyForBilling: d.ready_for_billing ?? false,
            readyForBillingAt: d.ready_for_billing_at ?? null,
            readyForBillingBy: d.ready_for_billing_by ?? null,
            canceledAt: d.canceled_at ?? null,
            canceledBy: d.canceled_by ?? null,
            notes: d.notes ?? '',
            salonId: d.salon_id,
          })) as Appointment[];
        }
      }
    }

    if (error) throw error;
    return (data as any[]).map((d) => ({
      id: d.id,
      clientId: d.client_id,
      clientName: d.profiles?.full_name ?? '',
      serviceId: d.service_id,
      serviceName: d.services?.name ?? '',
      servicePrice: d.services?.price ?? 0,
      serviceTaxTreatment: d.services?.tax_treatment ?? 'gravado',
      stylistId: d.stylist_id,
      stylistName: d.stylist?.full_name ?? 'Sin asignar', // Corrected join name
      appointmentDate: d.appointment_date,
      status: d.status,
      paymentMethod: d.payment_method,
      isPaid: d.is_paid ?? false,
      readyForBilling: d.ready_for_billing ?? false,
      readyForBillingAt: d.ready_for_billing_at ?? null,
      readyForBillingBy: d.ready_for_billing_by ?? null,
      canceledAt: d.canceled_at ?? null,
      canceledBy: d.canceled_by ?? null,
      notes: d.notes ?? '',
      salonId: d.salon_id,
    })) as Appointment[];
  },

  // PRODUCTS & INVENTORY
  async getProducts(userId?: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) return mockProducts;

    let query = supabase
      .from('products')
      .select('*, terceros(id, nit, nombre, first_name, second_name, last_name, second_last_name)')
      .order('name');

    if (userId) {
      const salonId = await api.getSalonId(userId);
      if (salonId) query = query.eq('salon_id', salonId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data as any[]).map(d => {
      const terceroParts = resolveNameParts({
        firstName: d.terceros?.first_name,
        secondName: d.terceros?.second_name,
        lastName: d.terceros?.last_name,
        secondLastName: d.terceros?.second_last_name,
      }, d.terceros?.nombre);
      const terceroNombre = formatFullName(terceroParts) || d.terceros?.nombre;

      return {
      id: d.id,
      name: d.name,
      description: d.description,
      price: d.price,
      stock: d.stock,
      category: d.category,
      taxTreatment: d.tax_treatment ?? 'gravado',
      imageUrl: d.image_url,
      isActive: d.is_active,
      brand: d.brand,
      unit: d.unit,
      minStock: d.min_stock,
      maxStock: d.max_stock,
      supplierName: d.supplier_name,
      supplierPhone: d.supplier_phone,
      lastArrival: d.last_arrival,
      costPrice: d.cost_price,
      purchaseDate: d.purchase_date,
      salonId: d.salon_id,
      terceroId: d.tercero_id,
      terceroNombre,
      terceroNit: d.terceros?.nit,
      } as Product;
    });
  },

  async updateProductStock(
    id: string,
    newStock: number,
    options?: { price?: number; costPrice?: number; lastArrival?: string }
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log(`Mock: Stock de producto ${id} actualizado a ${newStock}`);
      return;
    }

    const update: any = { stock: newStock, updated_at: new Date().toISOString() };
    if (options?.price !== undefined) update.price = options.price;
    if (options?.costPrice !== undefined) update.cost_price = options.costPrice;
    if (options?.lastArrival) update.last_arrival = options.lastArrival;

    const { error } = await supabase
      .from('products')
      .update(update)
      .eq('id', id);

    if (error) throw error;
  },

  async createProduct(product: Partial<Product>, userId?: string): Promise<Product> {
    if (!isSupabaseConfigured()) {
      const newProd = {
        ...product,
        id: 'prod-' + Date.now(),
        stock: product.stock ?? 0,
      } as Product;
      mockProducts.push(newProd);
      return newProd;
    }

    let salonId: string | null = null;
    if (userId) {
      salonId = await api.getSalonId(userId);
    }

    const payload = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock ?? 0,
      category: product.category,
      tax_treatment: product.taxTreatment ?? 'gravado',
      image_url: product.imageUrl,
      is_active: product.isActive ?? true,
      brand: product.brand,
      unit: product.unit,
      min_stock: product.minStock,
      max_stock: product.maxStock,
      supplier_name: product.supplierName,
      supplier_phone: product.supplierPhone,
      last_arrival: product.lastArrival,
      cost_price: product.costPrice,
      purchase_date: product.purchaseDate,
      tercero_id: product.terceroId || null,
      salon_id: salonId,
    };

    const { data, error } = await supabase.from('products').insert(payload).select().single();
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      category: data.category,
      taxTreatment: data.tax_treatment ?? 'gravado',
      imageUrl: data.image_url,
      isActive: data.is_active,
    } as Product;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Producto actualizado', id, product);
      return;
    }

    const payload: any = {};
    if (product.name !== undefined) payload.name = product.name;
    if (product.description !== undefined) payload.description = product.description;
    if (product.price !== undefined) payload.price = product.price;
    if (product.stock !== undefined) payload.stock = product.stock;
    if (product.category !== undefined) payload.category = product.category;
    if (product.taxTreatment !== undefined) payload.tax_treatment = product.taxTreatment;
    if (product.imageUrl !== undefined) payload.image_url = product.imageUrl;
    if (product.isActive !== undefined) payload.is_active = product.isActive;
    if (product.brand !== undefined) payload.brand = product.brand;
    if (product.unit !== undefined) payload.unit = product.unit;
    if (product.minStock !== undefined) payload.min_stock = product.minStock;
    if (product.maxStock !== undefined) payload.max_stock = product.maxStock;
    if (product.supplierName !== undefined) payload.supplier_name = product.supplierName;
    if (product.supplierPhone !== undefined) payload.supplier_phone = product.supplierPhone;
    if (product.lastArrival !== undefined) payload.last_arrival = product.lastArrival;
    if (product.costPrice !== undefined) payload.cost_price = product.costPrice;
    if (product.purchaseDate !== undefined) payload.purchase_date = product.purchaseDate || null;
    if (product.salonId !== undefined) payload.salon_id = product.salonId || null;
    if (product.terceroId !== undefined) payload.tercero_id = product.terceroId || null;

    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) throw error;
  },

  // POS / SALES
  async processSale(sale: Omit<ProductSale, 'id' | 'saleDate'>, userId?: string): Promise<{ saleId: string; invoiceNumber?: string }> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Venta procesada', sale);
      return {
        saleId: 'mock-sale-' + Date.now(),
        invoiceNumber: `FV-${Date.now().toString().slice(-6)}`,
      };
    }

    let salonId: string | null = null;
    if (userId) {
      salonId = await api.getSalonId(userId);
    }

    if (!salonId) {
      salonId =
        sale.items
          .map((item) => item.salonId)
          .find((id): id is string => Boolean(id)) ?? null;
    }

    if (!salonId) {
      const appointmentIds = sale.items
        .map((item) => item.appointmentId)
        .filter((id): id is string => Boolean(id));
      const productIds = sale.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id));
      const serviceIds = sale.items
        .map((item) => item.serviceId)
        .filter((id): id is string => Boolean(id));

      if (appointmentIds.length > 0) {
        const { data: apptRows } = await supabase
          .from('appointments')
          .select('salon_id')
          .in('id', appointmentIds)
          .not('salon_id', 'is', null)
          .limit(1);
        salonId = (apptRows?.[0] as any)?.salon_id ?? null;
      }

      if (!salonId && productIds.length > 0) {
        const { data: productRows } = await supabase
          .from('products')
          .select('salon_id')
          .in('id', productIds)
          .not('salon_id', 'is', null)
          .limit(1);
        salonId = (productRows?.[0] as any)?.salon_id ?? null;
      }

      if (!salonId && serviceIds.length > 0) {
        const { data: serviceRows } = await supabase
          .from('services')
          .select('salon_id')
          .in('id', serviceIds)
          .not('salon_id', 'is', null)
          .limit(1);
        salonId = (serviceRows?.[0] as any)?.salon_id ?? null;
      }
    }

    // Usar la función RPC 'process_sale' definida en el esquema SQL
    const { data, error } = await supabase.rpc('process_sale', {
      p_client_id: sale.clientId ?? null,
      p_seller_id: sale.sellerId,
      p_payment_method: sale.paymentMethod,
      p_salon_id: salonId,
      p_items: sale.items.map(item => ({
        product_id: item.productId || null,
        service_id: item.serviceId || null,
        appointment_id: item.appointmentId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percentage: item.discountPercentage ?? 0,
        tax_treatment: item.taxTreatment || 'gravado',
        name: item.productName || 'Servicio'
      }))
    });

    if (error) throw error;
    const saleId = data as string;

    const { data: saleData, error: saleReadError } = await supabase
      .from('product_sales')
      .select('invoice_number')
      .eq('id', saleId)
      .single();

    if (saleReadError) throw saleReadError;

    return {
      saleId,
      invoiceNumber: saleData?.invoice_number ?? undefined,
    };
  },

  async getDailyReport(date: string): Promise<DailyReportSummary> {
    if (!isSupabaseConfigured()) {
      // Mock daily report based on mock data
      const sales = mockProductSales.filter(s => s.saleDate.startsWith(date));
      const appts = mockAppointments.filter(a => a.appointmentDate.startsWith(date) && a.isPaid);
      
      const productsTotal = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const servicesTotal = appts.reduce((sum, a) => sum + (mockServices.find(s => s.id === a.serviceId)?.price || 0), 0);
      const cashTotal = [...sales, ...appts].filter(x => x.paymentMethod === 'efectivo')
        .reduce((sum, x) => sum + ( (x as any).totalAmount || (mockServices.find(s => s.id === (x as any).serviceId)?.price || 0) ), 0);

      return {
        date,
        totalSales: productsTotal + servicesTotal,
        cashTotal,
        cardTotal: (productsTotal + servicesTotal) - cashTotal,
        servicesTotal,
        productsTotal,
        appointmentsCount: appts.length,
        productsCount: sales.length,
        topStylist: { name: 'Ana Rodríguez', amount: servicesTotal }
      };
    }

    const startOfDay = new Date(`${date}T00:00:00`).toISOString();
    const endOfDay = new Date(`${date}T23:59:59.999`).toISOString();

    // 1. Fetch ALL transactions of the day...
    const { data: sales, error: salesError } = await supabase
      .from('product_sales')
      .select('*, profiles!seller_id(full_name), sale_items(*, services(name, price), appointments(profiles!stylist_id(full_name)))') 
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (salesError) throw salesError;

    // Aggregate from sales items for better precision
    let cashTotal = 0;
    let cardTotal = 0;
    let servicesTotal = 0;
    let productsTotal = 0;
    let appointmentsCount = 0;
    let productsCount = 0;
    const stylistSales: Record<string, { name: string; amount: number }> = {};

    sales.forEach((s: any) => {
      if (s.payment_method === 'efectivo') cashTotal += s.total_amount;
      else cardTotal += s.total_amount;

      s.sale_items.forEach((si: any) => {
        if (si.appointment_id) {
          servicesTotal += (si.line_total ?? (si.unit_price * si.quantity));
          appointmentsCount++;
          
          const name = si.appointments?.profiles?.full_name || 'Sin asignar';
          if (!stylistSales[name]) stylistSales[name] = { name, amount: 0 };
          stylistSales[name].amount += (si.line_total ?? (si.unit_price * si.quantity));
        } else {
          productsTotal += (si.line_total ?? (si.unit_price * si.quantity));
          productsCount++;
        }
      });
    });

    const topStylist = Object.values(stylistSales).sort((a, b) => b.amount - a.amount)[0];

    return {
      date,
      totalSales: cashTotal + cardTotal,
      cashTotal,
      cardTotal,
      servicesTotal,
      productsTotal,
      appointmentsCount,
      productsCount,
      topStylist
    };
  },

  async getDailyTransactions(date: string): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      return [...mockProductSales.map((s: ProductSale) => ({
        id: s.id,
        type: 'Producto',
        clientName: 'Venta Directa',
        concept: s.items[0]?.productName || 'Venta',
        date: s.saleDate,
        paymentMethod: s.paymentMethod,
        amount: s.totalAmount,
        status: 'Pagado'
      })), ...mockAppointments.filter(a => a.isPaid).map((a: Appointment) => ({
        id: a.id,
        type: 'Servicio',
        clientName: a.clientName,
        concept: a.serviceName,
        date: a.appointmentDate,
        paymentMethod: a.paymentMethod,
        amount: 350, // Mock price
        status: 'Pagado'
      }))];
    }

    const startOfDay = new Date(`${date}T00:00:00`).toISOString();
    const endOfDay = new Date(`${date}T23:59:59.999`).toISOString();

    // Fetch transactions from the sales table (centralized truth)
    const { data: sales, error } = await supabase
      .from('product_sales')
      .select('*, profiles!client_id(full_name), sale_items(*, services(name), appointments(profiles!stylist_id(full_name))))')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (error) throw error;

    const transactions: any[] = [];
    
    sales?.forEach((s: any) => {
      s.sale_items.forEach((si: any) => {
        const type = si.appointment_id ? 'Servicio' : 'Producto';
        transactions.push({
          id: s.id,
          invoiceNumber: s.invoice_number ?? undefined,
          type,
          clientName: s.profiles?.full_name || 'Venta Directa',
          concept: si.appointment_id ? si.services?.name : (si.product_id ? 'Producto' : 'Venta'),
          date: s.created_at,
          paymentMethod: s.payment_method,
          amount: si.line_total ?? (si.unit_price * si.quantity),
          discountAmount: Number(si.discount_amount || 0),
          discountPercentage: Number(si.discount_percentage || 0),
          taxTreatment: si.tax_treatment ?? 'gravado',
          status: 'Pagado'
        });
      });
    });

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getStylistServiceReport(filters: StylistServiceReportFilters, userId?: string): Promise<StylistServiceReportRow[]> {
    const { startDate, endDate, status, includeClients = false } = filters;

    const inRange = (dateTime: string) => {
      const dateOnly = dateTime.slice(0, 10);
      return dateOnly >= startDate && dateOnly <= endDate;
    };

    const matchesStatus = (a: Appointment) => {
      if (status === 'pagados') return a.isPaid === true && a.status !== 'cancelada';
      if (status === 'pendientes_facturar') return a.isPaid !== true && a.status !== 'cancelada' && a.readyForBilling === true;
      if (status === 'cancelados') return a.status === 'cancelada';
      return true;
    };

    const buildSummary = (appointments: Appointment[]) => {
      const reportMap = new Map<string, StylistServiceReportRow>();
      appointments.forEach((a) => {
        const stylistName = a.stylistName || 'Sin asignar';
        const serviceName = a.serviceName || 'Servicio';
        const serviceId = a.serviceId || 'sin-servicio';
        const amount = Number(a.servicePrice || 0);
        const key = `${a.stylistId || stylistName}__${serviceId}`;
        const current: StylistServiceReportRow = reportMap.get(key) || {
          stylistId: a.stylistId,
          stylistName,
          serviceId,
          serviceName,
          appointmentsCount: 0,
          totalAmount: 0,
          clients: [] as string[],
        };

        current.appointmentsCount += 1;
        current.totalAmount += amount;
        if (includeClients && a.clientName && !current.clients?.includes(a.clientName)) {
          current.clients?.push(a.clientName);
        }
        reportMap.set(key, current);
      });
      return Array.from(reportMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    };

    if (!isSupabaseConfigured()) {
      const filtered = mockAppointments.filter((a) => {
        if (!inRange(a.appointmentDate)) return false;
        return matchesStatus(a);
      });

      return buildSummary(filtered);
    }

    const details = await api.getStylistServiceReportDetails(filters, userId);
    const asAppointments = details.map((row) => ({
      id: row.appointmentId,
      stylistId: row.stylistId,
      stylistName: row.stylistName,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      clientName: row.clientName || '',
      servicePrice: row.amount + Number(row.discountAmount || 0),
      appointmentDate: `${row.appointmentDate}T${row.appointmentTime}:00`,
      status: row.status,
      isPaid: row.isPaid,
      readyForBilling: false,
    })) as Appointment[];

    return buildSummary(asAppointments);
  },

  async getStylistServiceReportDetails(filters: StylistServiceReportFilters, userId?: string): Promise<StylistServiceReportDetailRow[]> {
    const { startDate, endDate, status } = filters;

    const toTime = (value: string) => {
      const d = new Date(value);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const inRange = (dateTime: string) => {
      const dateOnly = dateTime.slice(0, 10);
      return dateOnly >= startDate && dateOnly <= endDate;
    };

    const matchesStatus = (a: Appointment) => {
      if (status === 'pagados') return a.isPaid === true && a.status !== 'cancelada';
      if (status === 'pendientes_facturar') return a.isPaid !== true && a.status !== 'cancelada' && a.readyForBilling === true;
      if (status === 'cancelados') return a.status === 'cancelada';
      return true;
    };

    const buildFromAppointments = async () => {
      let appointments: Appointment[] = [];
      try {
        appointments = await api.getAppointments(userId);
      } catch {
        let salonId: string | null = null;
        if (userId) salonId = await api.getSalonId(userId);

        let query = supabase
          .from('appointments')
          .select('id, client_id, service_id, stylist_id, appointment_date, status, is_paid, ready_for_billing, ready_for_billing_at, salon_id')
          .gte('appointment_date', `${startDate}T00:00:00`)
          .lte('appointment_date', `${endDate}T23:59:59.999`)
          .order('appointment_date', { ascending: false });

        if (salonId) query = query.eq('salon_id', salonId);

        const { data: minimalData, error: minimalError } = await query;
        if (minimalError) {
          const { data: superData, error: superError } = await supabase.rpc('get_superadmin_calendar_appointments');
          if (!superError) {
            appointments = ((superData as any[]) || []).map((row) => ({
              id: row.id,
              clientId: row.client_id,
              clientName: row.client_name || '',
              serviceId: row.service_id,
              serviceName: row.service_name || 'Servicio',
              servicePrice: Number(row.service_price || 0),
              stylistId: row.stylist_id || undefined,
              stylistName: row.stylist_name || 'Sin asignar',
              appointmentDate: row.appointment_date,
              status: row.status,
              paymentMethod: row.payment_method || 'efectivo',
              isPaid: Boolean(row.is_paid),
              readyForBilling: Boolean(row.ready_for_billing),
              readyForBillingAt: row.ready_for_billing_at ?? null,
              salonId: row.salon_id,
            } as Appointment));
          } else {
            return [] as StylistServiceReportDetailRow[];
          }
        } else {
          const [services, stylists] = await Promise.all([
            api.getBookableServices(userId, salonId ?? undefined).catch(() => [] as Service[]),
            api.getStylists(userId, salonId ?? undefined).catch(() => [] as Stylist[]),
          ]);
          const serviceById = new Map(services.map((s) => [s.id, s]));
          const stylistById = new Map(stylists.map((s) => [s.id, s]));

          appointments = ((minimalData as any[]) || []).map((row) => {
            const service = serviceById.get(row.service_id);
            const stylist = row.stylist_id ? stylistById.get(row.stylist_id) : undefined;
            return {
              id: row.id,
              clientId: row.client_id,
              clientName: '',
              serviceId: row.service_id,
              serviceName: service?.name || 'Servicio',
              servicePrice: Number(service?.price || 0),
              stylistId: row.stylist_id || undefined,
              stylistName: stylist?.name || 'Sin asignar',
              appointmentDate: row.appointment_date,
              status: row.status,
              paymentMethod: 'efectivo',
              isPaid: Boolean(row.is_paid),
              readyForBilling: Boolean(row.ready_for_billing),
              readyForBillingAt: row.ready_for_billing_at ?? null,
              salonId: row.salon_id,
            } as Appointment;
          });
        }
      }

      const filteredAppointments = appointments
        .filter((a) => inRange(a.appointmentDate) && matchesStatus(a))
        .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

      const appointmentIds = filteredAppointments.map((a) => a.id).filter(Boolean);
      const appointmentMetaById = new Map<string, { invoiceNumber?: string; discountPercentage: number; discountAmount: number; paidAt?: string | null }>();
      if (appointmentIds.length > 0) {
        const { data: saleItemsData, error: saleItemsError } = await supabase
          .from('sale_items')
          .select('appointment_id, discount_percentage, discount_amount, sale:product_sales!sale_id(invoice_number, created_at)')
          .in('appointment_id', appointmentIds);

        if (!saleItemsError) {
          (saleItemsData as any[]).forEach((item) => {
            const appointmentId = item.appointment_id as string | undefined;
            const invoiceNumber = item.sale?.invoice_number as string | undefined;
            const paidAt = item.sale?.created_at as string | undefined;
            if (appointmentId && !appointmentMetaById.has(appointmentId)) {
              appointmentMetaById.set(appointmentId, {
                invoiceNumber,
                discountPercentage: Number(item.discount_percentage || 0),
                discountAmount: Number(item.discount_amount || 0),
                paidAt: paidAt ?? null,
              });
            }
          });
        }
      }

      return filteredAppointments.map((a) => {
        const dateObj = new Date(a.appointmentDate);
        const appointmentMeta = appointmentMetaById.get(a.id);
        const discountPercentage = Number(appointmentMeta?.discountPercentage || 0);
        const discountAmount = Number(appointmentMeta?.discountAmount || 0);
        const grossAmount = Number(a.servicePrice || 0);
        return {
          appointmentId: a.id,
          invoiceNumber: appointmentMeta?.invoiceNumber,
          discountPercentage,
          discountAmount,
          stylistId: a.stylistId,
          stylistName: a.stylistName || 'Sin asignar',
          serviceId: a.serviceId || 'sin-servicio',
          serviceName: a.serviceName || 'Servicio',
          clientName: a.clientName || '',
          appointmentDate: dateObj.toLocaleDateString('sv'),
          appointmentTime: toTime(a.appointmentDate),
          completedAt: a.readyForBillingAt ?? null,
          paidAt: appointmentMeta?.paidAt ?? null,
          status: a.status,
          isPaid: Boolean(a.isPaid),
          amount: grossAmount - discountAmount,
        } as StylistServiceReportDetailRow;
      });
    };

    if (!isSupabaseConfigured()) {
      const filtered = mockAppointments.filter((a) => {
        if (!inRange(a.appointmentDate)) return false;
        return matchesStatus(a);
      });

      return filtered
        .map((a) => {
          const saleWithInvoice = mockProductSales.find((sale) =>
            sale.items.some((item) => item.appointmentId === a.id)
          );
          const service = mockServices.find((s) => s.id === a.serviceId);
          const saleItem = saleWithInvoice?.items.find((item) => item.appointmentId === a.id);
          const mockDiscountPercentage = Number(saleItem?.discountPercentage || 0);
          const baseAmount = service?.price || a.servicePrice || 0;
          const mockDiscountAmount = Number((((baseAmount * mockDiscountPercentage) / 100).toFixed(2)));
          const fullDate = new Date(a.appointmentDate);
          return {
            appointmentId: a.id,
            invoiceNumber: saleWithInvoice?.invoiceNumber,
            discountPercentage: mockDiscountPercentage,
            discountAmount: mockDiscountAmount,
            stylistId: a.stylistId,
            stylistName: a.stylistName || 'Sin asignar',
            serviceId: a.serviceId || 'sin-servicio',
            serviceName: a.serviceName || service?.name || 'Servicio',
            clientName: a.clientName || '',
            appointmentDate: fullDate.toLocaleDateString('sv'),
            appointmentTime: toTime(a.appointmentDate),
            completedAt: a.readyForBillingAt ?? (a.status === 'completada' ? a.appointmentDate : null),
            paidAt: a.isPaid ? a.appointmentDate : null,
            status: a.status,
            isPaid: Boolean(a.isPaid),
            amount: baseAmount - mockDiscountAmount,
          } as StylistServiceReportDetailRow;
        })
        .sort((a, b) => `${b.appointmentDate} ${b.appointmentTime}`.localeCompare(`${a.appointmentDate} ${a.appointmentTime}`));
    }

    try {
      const { data, error } = await supabase.rpc('get_stylist_service_report_appointments', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_status: status,
      });

      if (!error) {
        return ((data as any[]) || []).map((row) => {
          const dateObj = new Date(row.appointment_date as string);
          const discountPercentage = Number(row.discount_percentage || 0);
          const discountAmount = Number(row.discount_amount || 0);
          const grossAmount = Number(row.service_price || 0);
          return {
            appointmentId: row.appointment_id,
            invoiceNumber: row.invoice_number || undefined,
            discountPercentage,
            discountAmount,
            stylistId: row.stylist_id || undefined,
            stylistName: row.stylist_name || 'Sin asignar',
            serviceId: row.service_id || 'sin-servicio',
            serviceName: row.service_name || 'Servicio',
            clientName: row.client_name || '',
            appointmentDate: dateObj.toLocaleDateString('sv'),
            appointmentTime: toTime(row.appointment_date as string),
            completedAt: row.completed_at ?? null,
            paidAt: row.paid_at ?? null,
            status: row.appointment_status,
            isPaid: Boolean(row.is_paid),
            amount: grossAmount - discountAmount,
          } as StylistServiceReportDetailRow;
        });
      }
    } catch {
      // fallback below
    }

    try {
      return await buildFromAppointments();
    } catch {
      return [];
    }
  },

  async getProductsSoldReportDetails(filters: ProductSoldReportFilters, userId?: string): Promise<ProductSoldReportDetailRow[]> {
    const { startDate, endDate } = filters;
    const toTime = (value: string) => {
      const d = new Date(value);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    if (!isSupabaseConfigured()) {
      const inRange = (dateTime: string) => {
        const dateOnly = dateTime.slice(0, 10);
        return dateOnly >= startDate && dateOnly <= endDate;
      };

      return mockProductSales
        .filter((sale) => inRange(sale.saleDate))
        .flatMap((sale) => {
          const saleDate = new Date(sale.saleDate);
          return sale.items
            .filter((item) => Boolean(item.productId))
            .map((item) => ({
              saleId: sale.id,
              invoiceNumber: sale.invoiceNumber,
              discountPercentage: Number(item.discountPercentage || 0),
              discountAmount: Number(item.discountAmount || 0),
              productId: item.productId,
              productName: item.productName || 'Producto',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              saleDate: saleDate.toLocaleDateString('sv'),
              saleTime: toTime(sale.saleDate),
              paymentMethod: sale.paymentMethod,
              status: 'completed',
              sellerName: 'Administrador',
              clientName: 'Venta Directa',
            } as ProductSoldReportDetailRow));
        })
        .sort((a, b) => `${b.saleDate} ${b.saleTime}`.localeCompare(`${a.saleDate} ${a.saleTime}`));
    }

    const startIso = new Date(`${startDate}T00:00:00`).toISOString();
    const endIso = new Date(`${endDate}T23:59:59.999`).toISOString();

    let query = supabase
      .from('product_sales')
      .select('id, invoice_number, payment_method, status, created_at, salon_id, client:profiles!client_id(full_name), seller:profiles!seller_id(full_name), sale_items(quantity, unit_price, subtotal, discount_percentage, discount_amount, line_total, tax_treatment, product_id, products(name))')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: false });

    if (userId) {
      const salonId = await api.getSalonId(userId);
      if (salonId) query = query.eq('salon_id', salonId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows: ProductSoldReportDetailRow[] = [];
    (data as any[]).forEach((sale) => {
      const saleDateRaw = sale.created_at as string;
      const saleDateObj = new Date(saleDateRaw);
      (sale.sale_items || []).forEach((item: any) => {
        if (!item.product_id) return;
        rows.push({
          saleId: sale.id,
          invoiceNumber: sale.invoice_number,
          discountPercentage: Number(item.discount_percentage || 0),
          discountAmount: Number(item.discount_amount || 0),
          productId: item.product_id,
          productName: item.products?.name || 'Producto',
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unit_price || 0),
          subtotal: Number(item.line_total || item.subtotal || (item.quantity || 0) * (item.unit_price || 0)),
          taxTreatment: item.tax_treatment ?? 'gravado',
          saleDate: saleDateObj.toLocaleDateString('sv'),
          saleTime: toTime(saleDateRaw),
          paymentMethod: sale.payment_method,
          status: sale.status || 'completed',
          sellerName: sale.seller?.full_name || 'Sin asignar',
          clientName: sale.client?.full_name || 'Venta Directa',
        });
      });
    });

    return rows;
  },

  // ==========================================
  // TERCEROS
  // ==========================================
  async getTerceros(): Promise<Tercero[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('terceros')
      .select('*')
      .eq('is_active', true)
      .order('nombre');

    if (error) throw error;
    return (data as any[]).map(d => {
      const nameParts = resolveNameParts({
        firstName: d.first_name,
        secondName: d.second_name,
        lastName: d.last_name,
        secondLastName: d.second_last_name,
      }, d.nombre);
      const nombre = formatFullName(nameParts) || d.nombre || '';

      return {
        id: d.id,
        nit: d.nit,
        nombre,
        firstName: nameParts.firstName || '',
        secondName: nameParts.secondName || '',
        lastName: nameParts.lastName || '',
        secondLastName: nameParts.secondLastName || '',
        direccion: d.direccion,
        telefono: d.telefono,
        departamento: d.departamento,
        ciudad: d.ciudad,
        isActive: d.is_active,
        createdAt: d.created_at,
      } as Tercero;
    });
  },

  async createTercero(tercero: Partial<Tercero>): Promise<Tercero> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');

    const nombre = tercero.nombre || formatFullName({
      firstName: tercero.firstName,
      secondName: tercero.secondName,
      lastName: tercero.lastName,
      secondLastName: tercero.secondLastName,
    });
    if (!nombre) throw new Error('Nombre del tercero requerido');

    const payload = {
      nit: tercero.nit,
      nombre,
      first_name: tercero.firstName || null,
      second_name: tercero.secondName || null,
      last_name: tercero.lastName || null,
      second_last_name: tercero.secondLastName || null,
      direccion: tercero.direccion || null,
      telefono: tercero.telefono || null,
      departamento: tercero.departamento || null,
      ciudad: tercero.ciudad || null,
    };

    const { data, error } = await supabase.from('terceros').insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      nit: data.nit,
      nombre: data.nombre,
      firstName: data.first_name ?? '',
      secondName: data.second_name ?? '',
      lastName: data.last_name ?? '',
      secondLastName: data.second_last_name ?? '',
      direccion: data.direccion,
      telefono: data.telefono,
      departamento: data.departamento,
      ciudad: data.ciudad,
      isActive: data.is_active,
      createdAt: data.created_at,
    } as Tercero;
  },

  async updateTercero(id: string, tercero: Partial<Tercero>): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');

    const payload: any = {};
    if (tercero.nit !== undefined) payload.nit = tercero.nit;
    if (tercero.firstName !== undefined) payload.first_name = tercero.firstName || null;
    if (tercero.secondName !== undefined) payload.second_name = tercero.secondName || null;
    if (tercero.lastName !== undefined) payload.last_name = tercero.lastName || null;
    if (tercero.secondLastName !== undefined) payload.second_last_name = tercero.secondLastName || null;
    if (tercero.nombre !== undefined) payload.nombre = tercero.nombre;
    if (tercero.direccion !== undefined) payload.direccion = tercero.direccion || null;
    if (tercero.telefono !== undefined) payload.telefono = tercero.telefono || null;
    if (tercero.departamento !== undefined) payload.departamento = tercero.departamento || null;
    if (tercero.ciudad !== undefined) payload.ciudad = tercero.ciudad || null;

    if (tercero.nombre === undefined) {
      const computedNombre = formatFullName({
        firstName: tercero.firstName,
        secondName: tercero.secondName,
        lastName: tercero.lastName,
        secondLastName: tercero.secondLastName,
      });
      if (computedNombre) payload.nombre = computedNombre;
    }

    const { error } = await supabase.from('terceros').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteTercero(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase no configurado');

    const { error } = await supabase.from('terceros').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },
};
