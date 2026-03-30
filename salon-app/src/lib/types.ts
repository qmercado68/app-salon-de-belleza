// ==========================================
// Domain Types for Salon de Belleza App
// ==========================================

export type UserRole = 'client' | 'admin' | 'stylist';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  bloodType: BloodType | '';
  medicalConditions: string;
  allergies: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  salonId?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  imageUrl?: string;
  salonId?: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
  avatarUrl?: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
}

export interface ProductSale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  saleDate: string;
  paymentMethod: PaymentMethod;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
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

export interface NavItemData {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}
