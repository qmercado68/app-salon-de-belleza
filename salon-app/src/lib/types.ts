// ==========================================
// Domain Types for Salon de Belleza App
// ==========================================

export type UserRole = 'client' | 'admin' | 'stylist' | 'superadmin';
export type SalonTaxRegime = 'responsable_iva' | 'no_responsable_iva' | 'simple';
export type TaxTreatment = 'gravado' | 'exento' | 'excluido';

export interface Salon {
  id: string;
  name: string;
  nit: string;
  slug: string;
  taxRegime?: SalonTaxRegime;
  dianResolution?: string;
  invoiceRangeFrom?: number;
  invoiceRangeTo?: number | null;
  invoiceValidUntil?: string | null;
  appliesVat?: boolean;
  vatPercentage?: number;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
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

export type ProfileStatus = 'active' | 'inactive' | 'terminated';

export interface Profile {
  id: string;
  fullName: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  secondLastName?: string;
  documentId?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | '';
  email: string;
  phone: string;
  address: string;
  department?: string;
  city?: string;
  isAvailable?: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
  bloodType: BloodType | '';
  medicalConditions: string;
  allergies: string;
  medicalFormRequested?: boolean;
  role: UserRole;
  status?: ProfileStatus;
  terminatedAt?: string | null;
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
  taxTreatment?: TaxTreatment;
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
  breakStartTime?: string;
  breakEndTime?: string;
  isAvailable?: boolean;
}

export interface StylistUnavailability {
  id: string;
  stylistId: string;
  salonId?: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  isAllDay: boolean;
  reason?: string | null;
  createdAt?: string;
  createdBy?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  taxTreatment?: TaxTreatment;
  imageUrl?: string;
  isActive?: boolean;
  brand?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  supplierName?: string;
  supplierPhone?: string;
  lastArrival?: string;
  costPrice?: number;
  purchaseDate?: string;
  salonId?: string;
  terceroId?: string;
  terceroNombre?: string;
  terceroNit?: string;
}

export interface Tercero {
  id: string;
  nit: string;
  nombre: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  secondLastName?: string;
  direccion?: string;
  telefono?: string;
  departamento?: string;
  ciudad?: string;
  salonId?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface SaleItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxTreatment?: TaxTreatment;
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
  invoiceNumber?: string;
  items: SaleItem[];
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  serviceTaxTreatment?: TaxTreatment;
  stylistId?: string;
  stylistName?: string;
  appointmentDate: string;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  notes?: string;
  salonId?: string;
  salonName?: string;
  clientPhone?: string;
  allergies?: string;
  medicalConditions?: string;
  medicalFormRequested?: boolean;
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

export type StylistServiceReportStatus = 'pagados' | 'cancelados' | 'todos';

export interface StylistServiceReportFilters {
  startDate: string;
  endDate: string;
  status: StylistServiceReportStatus;
  includeClients?: boolean;
}

export interface StylistServiceReportRow {
  stylistId?: string;
  stylistName: string;
  serviceId: string;
  serviceName: string;
  appointmentsCount: number;
  totalAmount: number;
  clients?: string[];
}

export interface StylistServiceReportDetailRow {
  appointmentId: string;
  invoiceNumber?: string;
  discountPercentage?: number;
  discountAmount?: number;
  stylistId?: string;
  stylistName: string;
  serviceId: string;
  serviceName: string;
  clientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  isPaid: boolean;
  amount: number;
}

export interface ProductSoldReportFilters {
  startDate: string;
  endDate: string;
  includeClients?: boolean;
}

export interface ProductSoldReportDetailRow {
  saleId: string;
  invoiceNumber?: string;
  discountPercentage?: number;
  discountAmount?: number;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxTreatment?: TaxTreatment;
  saleDate: string;
  saleTime: string;
  paymentMethod: PaymentMethod;
  status: 'completed' | 'cancelled' | 'refunded';
  sellerName: string;
  clientName?: string;
}

export interface NavItemData {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}
