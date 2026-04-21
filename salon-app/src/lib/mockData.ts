import {
  Profile,
  Service,
  Appointment,
  DashboardStats,
  TimeSlot,
  Stylist,
  Product,
  ProductSale,
} from './types';

// ==========================================
// Mock Users / Profiles
// ==========================================
export const mockCurrentUser: Profile = {
  id: 'user-001',
  fullName: 'María García',
  email: 'maria@email.com',
  phone: '+52 555 123 4567',
  address: 'Av. Reforma 234, Col. Centro',
  bloodType: 'O+',
  medicalConditions: 'Ninguna',
  allergies: 'Alergia al látex',
  role: 'client',
  createdAt: '2025-01-15',
};

export const mockAdminUser: Profile = {
  id: 'admin-001',
  fullName: 'Ana Rodríguez',
  email: 'ana@salon.com',
  phone: '+52 555 987 6543',
  address: 'Blvd. Principal 100',
  bloodType: 'A+',
  medicalConditions: '',
  allergies: '',
  role: 'admin',
  createdAt: '2024-06-01',
};

export const mockClients: Profile[] = [
  mockCurrentUser,
  {
    id: 'user-002',
    fullName: 'Laura Martínez',
    email: 'laura@email.com',
    phone: '+52 555 234 5678',
    address: 'Calle 5 de Mayo 45',
    bloodType: 'B+',
    medicalConditions: 'Diabetes tipo 2',
    allergies: 'Alergia a parabenos y sulfatos',
    role: 'client',
    createdAt: '2025-02-20',
  },
  {
    id: 'user-003',
    fullName: 'Carmen López',
    email: 'carmen@email.com',
    phone: '+52 555 345 6789',
    address: 'Insurgentes Sur 1020',
    bloodType: 'AB-',
    medicalConditions: 'Hipertensión',
    allergies: '',
    role: 'client',
    createdAt: '2025-03-01',
  },
  {
    id: 'user-004',
    fullName: 'Sofía Hernández',
    email: 'sofia@email.com',
    phone: '+52 555 456 7890',
    address: 'Paseo de la Reforma 500',
    bloodType: 'O-',
    medicalConditions: '',
    allergies: 'Alergia al formaldehído, amoníaco',
    role: 'client',
    createdAt: '2025-03-10',
  },
  {
    id: 'user-005',
    fullName: 'Isabella Torres',
    email: 'isabella@email.com',
    phone: '+52 555 567 8901',
    address: 'Av. Universidad 300',
    bloodType: 'A-',
    medicalConditions: 'Asma',
    allergies: 'Alergia a tintes con PPD',
    role: 'client',
    createdAt: '2025-03-15',
  },
];

// ==========================================
// Mock Services
// ==========================================
export const mockServices: Service[] = [
  {
    id: 'srv-001',
    name: 'Corte de Cabello',
    description: 'Corte personalizado con lavado y secado incluido',
    durationMinutes: 45,
    price: 350,
    category: 'Cabello',
  },
  {
    id: 'srv-002',
    name: 'Tinte Completo',
    description: 'Aplicación de color completo con productos premium',
    durationMinutes: 120,
    price: 1200,
    category: 'Cabello',
  },
  {
    id: 'srv-003',
    name: 'Mechas / Balayage',
    description: 'Técnica de iluminación con efecto natural',
    durationMinutes: 180,
    price: 2500,
    category: 'Cabello',
  },
  {
    id: 'srv-004',
    name: 'Manicure Gel',
    description: 'Manicure con esmalte en gel de larga duración',
    durationMinutes: 60,
    price: 450,
    category: 'Uñas',
  },
  {
    id: 'srv-005',
    name: 'Pedicure Spa',
    description: 'Pedicure completo con tratamiento spa para pies',
    durationMinutes: 75,
    price: 550,
    category: 'Uñas',
  },
  {
    id: 'srv-006',
    name: 'Facial Hidratante',
    description: 'Limpieza profunda e hidratación con productos naturales',
    durationMinutes: 60,
    price: 800,
    category: 'Facial',
  },
  {
    id: 'srv-007',
    name: 'Depilación con Cera',
    description: 'Depilación profesional con cera caliente',
    durationMinutes: 30,
    price: 250,
    category: 'Cuerpo',
  },
  {
    id: 'srv-008',
    name: 'Tratamiento Keratina',
    description: 'Alisado y nutrición profunda con keratina brasileña',
    durationMinutes: 150,
    price: 3000,
    category: 'Cabello',
  },
  {
    id: 'srv-009',
    name: 'Maquillaje Profesional',
    description: 'Maquillaje para eventos especiales o sesiones fotográficas',
    durationMinutes: 90,
    price: 1500,
    category: 'Maquillaje',
  },
  {
    id: 'srv-010',
    name: 'Peinado de Ocasión',
    description: 'Peinado elaborado para bodas, graduaciones y eventos',
    durationMinutes: 90,
    price: 1000,
    category: 'Cabello',
  },
];

// ==========================================
// Mock Stylists
// ==========================================
export const mockStylists: Stylist[] = [
  {
    id: 'sty-001',
    name: 'Ana Rodríguez',
    specialty: 'Colorista Senior & Corte',
    description: 'Especialista en Balayage y cambios de imagen con más de 10 años de experiencia.',
    workStartTime: '09:00',
    workEndTime: '15:00',
  },
  {
    id: 'sty-002',
    name: 'Lucía Vega',
    specialty: 'Manicurista & Faciales',
    description: 'Experta en diseño de uñas y tratamientos faciales rejuvenecedores.',
    workStartTime: '12:00',
    workEndTime: '19:00',
  },
  {
    id: 'sty-003',
    name: 'Karla Luna',
    specialty: 'Peinados & Maquillaje',
    description: 'Especialista en novias y maquillaje para eventos sociales.',
    workStartTime: '09:00',
    workEndTime: '18:00',
  },
];

// ==========================================
// Mock Appointments
// ==========================================
export const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    clientId: 'user-001',
    clientName: 'María García',
    clientPhone: '+52 555 123 4567',
    serviceId: 'srv-001',
    serviceName: 'Corte de Cabello',
    stylistId: 'sty-001',
    stylistName: 'Ana Rodríguez',
    appointmentDate: '2026-03-26T10:00:00',
    status: 'confirmada',
    paymentMethod: 'efectivo',
    isPaid: false,
  },
  {
    id: 'apt-002',
    clientId: 'user-002',
    clientName: 'Laura Martínez',
    clientPhone: '+52 555 234 5678',
    serviceId: 'srv-002',
    serviceName: 'Tinte Completo',
    stylistId: 'sty-001',
    stylistName: 'Ana Rodríguez',
    appointmentDate: '2026-03-26T11:00:00',
    status: 'pendiente',
    paymentMethod: 'efectivo',
    isPaid: false,
  },
  {
    id: 'apt-003',
    clientId: 'user-003',
    clientName: 'Carmen López',
    clientPhone: '+52 555 345 6789',
    serviceId: 'srv-004',
    serviceName: 'Manicure Gel',
    stylistId: 'sty-002',
    stylistName: 'Lucía Vega',
    appointmentDate: '2026-03-26T14:00:00',
    status: 'pendiente',
    paymentMethod: 'efectivo',
    isPaid: false,
  },
  {
    id: 'apt-004',
    clientId: 'user-004',
    clientName: 'Sofía Hernández',
    clientPhone: '+52 555 456 7890',
    serviceId: 'srv-003',
    serviceName: 'Mechas / Balayage',
    stylistId: 'sty-001',
    stylistName: 'Ana Rodríguez',
    appointmentDate: '2026-03-25T09:00:00',
    status: 'completada',
    paymentMethod: 'efectivo',
    isPaid: true,
  },
  {
    id: 'apt-005',
    clientId: 'user-005',
    clientName: 'Isabella Torres',
    clientPhone: '+52 555 567 8901',
    serviceId: 'srv-006',
    serviceName: 'Facial Hidratante',
    stylistId: 'sty-002',
    stylistName: 'Lucía Vega',
    appointmentDate: '2026-03-27T10:00:00',
    status: 'pendiente',
    paymentMethod: 'efectivo',
    isPaid: false,
  },
  {
    id: 'apt-006',
    clientId: 'user-001',
    clientName: 'María García',
    clientPhone: '+52 555 123 4567',
    serviceId: 'srv-008',
    serviceName: 'Tratamiento Keratina',
    stylistId: 'sty-001',
    stylistName: 'Ana Rodríguez',
    appointmentDate: '2026-03-20T15:00:00',
    status: 'completada',
    paymentMethod: 'efectivo',
    isPaid: true,
  },
  {
    id: 'apt-007',
    clientId: 'user-001',
    clientName: 'María García',
    clientPhone: '+52 555 123 4567',
    serviceId: 'srv-009',
    serviceName: 'Maquillaje Profesional',
    stylistId: 'sty-002',
    stylistName: 'Lucía Vega',
    appointmentDate: '2026-03-28T16:00:00',
    status: 'pendiente',
    paymentMethod: 'efectivo',
    isPaid: false,
  },
];

// ==========================================
// Mock Dashboard Stats
// ==========================================
export const mockDashboardStats: DashboardStats = {
  todayAppointments: 5,
  pendingAppointments: 8,
  completedAppointments: 142,
  monthlyRevenue: 45800,
  totalClients: 87,
  popularService: 'Corte de Cabello',
};

// ==========================================
// Mock Products & Inventory
// ==========================================
export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Shampoo Reparación Intensa',
    description: 'Shampoo profesional para cabello dañado, 500ml',
    price: 450,
    stock: 24,
    category: 'Cabello',
    brand: 'Loreal',
    unit: '500ml',
    minStock: 10,
    maxStock: 50,
    supplierName: 'Distribuidora ProSalón',
    supplierPhone: '555-1234',
  },
  {
    id: 'prod-002',
    name: 'Acondicionador Brillo Sedoso',
    description: 'Nutrición profunda para todo tipo de cabello, 500ml',
    price: 420,
    stock: 18,
    category: 'Cabello',
    brand: 'Loreal',
    unit: '500ml',
    minStock: 10,
    maxStock: 50,
    supplierName: 'Distribuidora ProSalón',
    supplierPhone: '555-1234',
  },
  {
    id: 'prod-003',
    name: 'Aceite de Argán Premium',
    description: 'Tratamiento hidratante y anti-frizz, 100ml',
    price: 850,
    stock: 12,
    category: 'Cabello',
    brand: 'Moroccanoil',
    unit: '100ml',
    minStock: 5,
    maxStock: 20,
    supplierName: 'Importaciones Beauty',
    supplierPhone: '555-5678',
  },
  {
    id: 'prod-004',
    name: 'Esmalte Gel Pro',
    description: 'Varios tonos de larga duración, calidad salón',
    price: 180,
    stock: 45,
    category: 'Uñas',
    brand: 'OPI',
    unit: '15ml',
    minStock: 20,
    maxStock: 100,
    supplierName: 'Distribuidora Uñas Mágicas',
    supplierPhone: '555-9012',
  },
  {
    id: 'prod-005',
    name: 'Crema Facial Anti-edad',
    description: 'Con ácido hialurónico y colágeno, 50ml',
    price: 1200,
    stock: 8,
    category: 'Facial',
    brand: 'Eucerin',
    unit: '50ml',
    minStock: 5,
    maxStock: 15,
    supplierName: 'Pharma Derm',
    supplierPhone: '555-3456',
  },
];

export const mockProductSales: ProductSale[] = [
  {
    id: 'psale-001',
    sellerId: 'admin-001',
    totalAmount: 900,
    paymentMethod: 'efectivo',
    saleDate: '2026-03-27T10:30:00',
    items: [
      {
        productId: 'prod-001',
        productName: 'Shampoo Reparación Intensa',
        quantity: 2,
        unitPrice: 450,
        subtotal: 900,
      }
    ],
  },
  {
    id: 'psale-002',
    sellerId: 'admin-001',
    totalAmount: 850,
    paymentMethod: 'tarjeta',
    saleDate: '2026-03-27T11:45:00',
    items: [
      {
        productId: 'prod-003',
        productName: 'Aceite de Argán Premium',
        quantity: 1,
        unitPrice: 850,
        subtotal: 850,
      }
    ],
  },
];

// ==========================================
// Mock Time Slots
// ==========================================
export const generateTimeSlots = (date: string): TimeSlot[] => {
  const baseSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
  ];

  // Simulate some slots being occupied
  const occupied = ['10:00', '11:00', '14:00', '16:30'];

  return baseSlots.map((time) => ({
    time,
    available: !occupied.includes(time),
  }));
};
