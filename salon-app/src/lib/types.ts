// ==========================================
// Domain Types for Salon de Belleza App
// ==========================================

export type UserRole = 'client' | 'admin' | 'stylist' | 'superadmin';

export interface Salon {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  themeColor?: string;
  isActive?: boolean;
  ownerId?: string;
  createdAt?: string;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Profile {
  id: string;
  fullName: string;
  documentId?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | '';
  email: string;
  phone: string;
  address: string;
  bloodType: BloodType | '';
  medicalConditions: string;
  allergies: string;
  role: UserRole;
  specialty?: string;
  avatarUrl?: string;
  createdAt: string;
  salonId?: string;
  workStartTime?: string;
  workEndTime?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  imageUrl?: string;
  isActive?: boolean;
  salonId?: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
  avatarUrl?: string;
  description?: string;
  workStartTime?: string;
  workEndTime?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  isActive?: boolean;
  brand?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  supplierName?: string;
  supplierPhone?: string;
  lastArrival?: string;
}

export interface SaleItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  appointmentId?: string;
  serviceId?: string;
}

export interface ProductSale {
  id: string;
  clientId?: string;
  sellerId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  saleDate: string;
  items: SaleItem[];
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  stylistId?: string;
  stylistName?: string;
  appointmentDate: string;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  notes?: string;
  salonId?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DashboardStats {
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  monthlyRevenue: number;
  totalClients: number;
  popularService: string;
}

export interface DailyReportSummary {
  date: string;
  totalSales: number;
  cashTotal: number;
  cardTotal: number;
  servicesTotal: number;
  productsTotal: number;
  appointmentsCount: number;
  productsCount: number;
  topStylist?: { name: string; amount: number };
}

export interface NavItemData {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}
