import { supabase, isSupabaseConfigured } from './supabase';
import { createClient } from '@/utils/supabase/client';
import {
  mockServices,
  mockAppointments,
  mockCurrentUser,
  mockClients
} from './mockData';
import { Service, Appointment, Profile, Product, ProductSale, SaleItem, DailyReportSummary, Stylist, TimeSlot, Salon } from './types';
import { mockProducts, mockProductSales } from './mockData';

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
      slug: d.slug,
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
      slug: data.slug,
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
      slug: salon.slug,
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
      slug: data.slug,
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
    if (salon.slug !== undefined) payload.slug = salon.slug;
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

  async createService(service: Partial<Service>, userId?: string): Promise<Service> {
    if (!isSupabaseConfigured()) throw new Error('Mock no soportado en creación admin.');

    let salonId = service.salonId;
    if (!salonId && userId) {
      salonId = (await api.getSalonId(userId)) ?? undefined;
    }

    const payload = {
      name: service.name,
      description: service.description,
      duration_minutes: service.durationMinutes,
      price: service.price,
      category: service.category,
      image_url: service.imageUrl,
      is_active: service.isActive ?? true,
      salon_id: salonId ?? null,
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
      workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : undefined,
      workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : undefined,
    })) as Profile[];
  },

  async getStylists(): Promise<Stylist[]> {
    if (!isSupabaseConfigured()) {
      return [
        { id: 'sty-1', name: 'Ana Rodríguez', specialty: 'Colorista Senior', description: 'Experta en balayage.', workStartTime: '09:00', workEndTime: '15:00' },
        { id: 'sty-2', name: 'Carlos López', specialty: 'Estilista', description: 'Cortes modernos.', workStartTime: '12:00', workEndTime: '19:00' },
      ];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, specialty, avatar_url, medical_conditions, work_start_time, work_end_time')
      .eq('role', 'stylist')
      .order('full_name', { ascending: true });

    if (error) throw error;
    
    return (data as any[]).map((d) => ({
      id: d.id,
      name: d.full_name ?? '',
      specialty: d.specialty ?? 'Estilista',
      avatarUrl: d.avatar_url ?? undefined,
      description: d.medical_conditions ?? '',
      workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : '09:00', // Time comes as HH:mm:ss, convert to HH:mm
      workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : '18:00',
    })) as Stylist[];
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
      workStartTime: d.work_start_time ? d.work_start_time.substring(0, 5) : undefined,
      workEndTime: d.work_end_time ? d.work_end_time.substring(0, 5) : undefined,
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
    if (profile.workStartTime !== undefined) payload.work_start_time = profile.workStartTime ? `${profile.workStartTime}:00` : null;
    if (profile.workEndTime !== undefined) payload.work_end_time = profile.workEndTime ? `${profile.workEndTime}:00` : null;

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

  async getAvailableTimeSlots(date: string, stylistId: string, durationMinutes: number, workStartTimeStr: string = '09:00', workEndTimeStr: string = '18:00'): Promise<TimeSlot[]> {
    const baseSlots: string[] = [];
    
    // Parse work bounds
    const [startH, startM] = workStartTimeStr.split(':').map(Number);
    const [endH, endM] = workEndTimeStr.split(':').map(Number);
    const startTotalMins = (startH || 9) * 60 + (startM || 0);
    const endTotalMins = (endH || 18) * 60 + (endM || 0);

    for (let currentMins = startTotalMins; currentMins < endTotalMins; currentMins += 30) {
      if (currentMins + durationMinutes > endTotalMins) {
        continue; // Don't allow scheduling if the service would finish after work ends
      }
      const h = Math.floor(currentMins / 60).toString().padStart(2, '0');
      const m = (currentMins % 60).toString().padStart(2, '0');
      baseSlots.push(`${h}:${m}`);
    }

    if (!isSupabaseConfigured() || !stylistId) {
      return baseSlots.map(time => ({ time, available: true }));
    }

    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // Fetch existing appointments for the stylist on that day
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_date, services(duration_minutes), status')
      .eq('stylist_id', stylistId)
      .neq('status', 'cancelada')
      .gte('appointment_date', startOfDay)
      .lte('appointment_date', endOfDay);

    if (error) {
      console.error('Error fetching appointments for slots:', error);
      return baseSlots.map(time => ({ time, available: true })); // fallback
    }

    // Parse each appointment into a start and end time (in minutes from midnight)
    const occupiedRanges = (appointments || []).map((appt: any) => {
      const d = new Date(appt.appointment_date);
      const startMins = d.getHours() * 60 + d.getMinutes();
      const dur = appt.services?.duration_minutes || 30; // default to 30 if null
      return { start: startMins, end: startMins + dur };
    });

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
  },

  async getUnpaidAppointments(date: string): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) {
      return mockAppointments.filter(a => 
        a.appointmentDate.startsWith(date) && !a.isPaid && a.status !== 'cancelada'
      );
    }

    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(name, price), profiles!client_id(full_name), stylist:profiles!stylist_id(full_name)')
      .eq('is_paid', false)
      .neq('status', 'cancelada')
      .gte('appointment_date', startOfDay)
      .lte('appointment_date', endOfDay);

    if (error) throw error;
    return (data as any[]).map((d) => ({
      id: d.id,
      clientId: d.client_id,
      clientName: d.profiles?.full_name ?? '',
      serviceId: d.service_id,
      serviceName: d.services?.name ?? '',
      servicePrice: d.services?.price ?? 0,
      stylistId: d.stylist_id,
      stylistName: d.stylist?.full_name ?? 'Sin asignar', // Corrected join name
      appointmentDate: d.appointment_date,
      status: d.status,
      paymentMethod: d.payment_method,
      isPaid: d.is_paid ?? false,
      notes: d.notes ?? '',
      salonId: d.salon_id,
    })) as Appointment[];
  },

  // PRODUCTS & INVENTORY
  async getProducts(userId?: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) return mockProducts;

    let query = supabase.from('products').select('*').order('name');

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
      price: d.price,
      stock: d.stock,
      category: d.category,
      imageUrl: d.image_url,
      isActive: d.is_active,
      brand: d.brand,
      unit: d.unit,
      minStock: d.min_stock,
      maxStock: d.max_stock,
      supplierName: d.supplier_name,
      supplierPhone: d.supplier_phone,
      lastArrival: d.last_arrival,
    })) as Product[];
  },

  async updateProductStock(id: string, newStock: number): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log(`Mock: Stock de producto ${id} actualizado a ${newStock}`);
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
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
      image_url: product.imageUrl,
      is_active: product.isActive ?? true,
      brand: product.brand,
      unit: product.unit,
      min_stock: product.minStock,
      max_stock: product.maxStock,
      supplier_name: product.supplierName,
      supplier_phone: product.supplierPhone,
      last_arrival: product.lastArrival,
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
    if (product.imageUrl !== undefined) payload.image_url = product.imageUrl;
    if (product.isActive !== undefined) payload.is_active = product.isActive;
    if (product.brand !== undefined) payload.brand = product.brand;
    if (product.unit !== undefined) payload.unit = product.unit;
    if (product.minStock !== undefined) payload.min_stock = product.minStock;
    if (product.maxStock !== undefined) payload.max_stock = product.maxStock;
    if (product.supplierName !== undefined) payload.supplier_name = product.supplierName;
    if (product.supplierPhone !== undefined) payload.supplier_phone = product.supplierPhone;
    if (product.lastArrival !== undefined) payload.last_arrival = product.lastArrival;

    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) throw error;
  },

  // POS / SALES
  async processSale(sale: Omit<ProductSale, 'id' | 'saleDate'>, userId?: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      console.log('Mock: Venta procesada', sale);
      return 'mock-sale-' + Date.now();
    }

    let salonId: string | null = null;
    if (userId) {
      salonId = await api.getSalonId(userId);
    }

    // Usar la función RPC 'process_sale' definida en el esquema SQL
    const { data, error } = await supabase.rpc('process_sale', {
      p_client_id: sale.clientId,
      p_seller_id: sale.sellerId,
      p_payment_method: sale.paymentMethod,
      p_salon_id: salonId,
      p_items: sale.items.map(item => ({
        product_id: item.productId || null,
        service_id: item.serviceId || null,
        appointment_id: item.appointmentId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        name: item.productName || 'Servicio'
      }))
    });

    if (error) throw error;
    return data as string;
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

    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

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
          servicesTotal += si.unit_price * si.quantity;
          appointmentsCount++;
          
          const name = si.appointments?.profiles?.full_name || 'Sin asignar';
          if (!stylistSales[name]) stylistSales[name] = { name, amount: 0 };
          stylistSales[name].amount += si.unit_price * si.quantity;
        } else {
          productsTotal += si.unit_price * si.quantity;
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

    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

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
          type,
          clientName: s.profiles?.full_name || 'Venta Directa',
          concept: si.appointment_id ? si.services?.name : (si.product_id ? 'Producto' : 'Venta'),
          date: s.created_at,
          paymentMethod: s.payment_method,
          amount: si.unit_price * si.quantity,
          status: 'Pagado'
        });
      });
    });

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};
