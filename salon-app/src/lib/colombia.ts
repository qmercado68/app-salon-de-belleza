export const COLOMBIA_DEPARTMENTS = [
  { department: 'Amazonas', capital: 'Leticia' },
  { department: 'Antioquia', capital: 'Medellín' },
  { department: 'Arauca', capital: 'Arauca' },
  { department: 'Atlántico', capital: 'Barranquilla' },
  { department: 'Bogotá, D.C.', capital: 'Bogotá, D.C.' },
  { department: 'Bolívar', capital: 'Cartagena de Indias' },
  { department: 'Boyacá', capital: 'Tunja' },
  { department: 'Caldas', capital: 'Manizales' },
  { department: 'Caquetá', capital: 'Florencia' },
  { department: 'Casanare', capital: 'Yopal' },
  { department: 'Cauca', capital: 'Popayán' },
  { department: 'Cesar', capital: 'Valledupar' },
  { department: 'Chocó', capital: 'Quibdó' },
  { department: 'Córdoba', capital: 'Montería' },
  { department: 'Cundinamarca', capital: 'Bogotá' },
  { department: 'Guainía', capital: 'Inírida' },
  { department: 'Guaviare', capital: 'San José del Guaviare' },
  { department: 'Huila', capital: 'Neiva' },
  { department: 'La Guajira', capital: 'Riohacha' },
  { department: 'Magdalena', capital: 'Santa Marta' },
  { department: 'Meta', capital: 'Villavicencio' },
  { department: 'Nariño', capital: 'Pasto' },
  { department: 'Norte de Santander', capital: 'Cúcuta' },
  { department: 'Putumayo', capital: 'Mocoa' },
  { department: 'Quindío', capital: 'Armenia' },
  { department: 'Risaralda', capital: 'Pereira' },
  { department: 'San Andrés, Providencia y Santa Catalina', capital: 'San Andrés' },
  { department: 'Santander', capital: 'Bucaramanga' },
  { department: 'Sucre', capital: 'Sincelejo' },
  { department: 'Tolima', capital: 'Ibagué' },
  { department: 'Valle del Cauca', capital: 'Cali' },
  { department: 'Vaupés', capital: 'Mitú' },
  { department: 'Vichada', capital: 'Puerto Carreño' },
];

export const CAPITAL_BY_DEPARTMENT = COLOMBIA_DEPARTMENTS.reduce<Record<string, string>>((acc, item) => {
  acc[item.department] = item.capital;
  return acc;
}, {});

export const DEPARTMENT_OPTIONS = COLOMBIA_DEPARTMENTS.map((item) => item.department);

export const getCityOptionsForDepartment = (department: string, currentCity?: string) => {
  const capital = CAPITAL_BY_DEPARTMENT[department];
  const options = capital ? [capital] : [];
  if (currentCity && !options.includes(currentCity)) {
    options.unshift(currentCity);
  }
  return options;
};
