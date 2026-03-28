# ---

**Documento de Especificación de Requerimientos (ERS)**

**Proyecto:** App de Gestión para Salón de Belleza y Peluquería

**Stack:** React/Next.js \+ Supabase (DB, Auth, Edge Functions)

## ---

**1\. Resumen Ejecutivo**

Desarrollo de una aplicación web moderna que permite a los clientes gestionar sus citas estéticas de manera autónoma, integrando un **perfil de seguridad médica** (tipo de sangre, enfermedades y alergias) para garantizar la integridad física del cliente durante los tratamientos. El sistema operará bajo un modelo de **pago en efectivo** en el local.

## ---

**2\. Arquitectura del Sistema**

* **Autenticación:** Supabase Auth (Magic Links / Email).  
* **Base de Datos:** PostgreSQL en Supabase con políticas de seguridad **RLS** (Row Level Security).  
* **Almacenamiento:** Supabase Storage para fotos de perfil y catálogo.  
* **Lógica de Servidor:** Edge Functions en TypeScript para notificaciones automáticas.

## ---

**3\. Requerimientos Funcionales**

### **A. Módulo de Usuario y Salud**

* **Registro Obligatorio:** El usuario debe completar su perfil antes de su primera cita.  
* **Ficha Clínica:** Campos específicos para:  
  * Teléfono y Dirección.  
  * Tipo de Sangre (Selector de $A+, O-,$ etc.).  
  * Campo de texto para Enfermedades Preexistentes.  
  * Campo de texto destacado para **Alergias** (Crítico para químicos).  
* **Privacidad:** Los datos de salud solo son visibles para el dueño del perfil y el administrador/estilista asignado.

### **B. Sistema de Reservas y Agenda**

* **Catálogo de Servicios:** Visualización de servicios, duración y precio.  
* **Calendario en Tiempo Real:** Selección de fecha y hora según disponibilidad del estilista.  
* **Validación de Disponibilidad:** Bloqueo automático de horarios ya ocupados.  
* **Gestión de Citas:** Los clientes pueden ver su historial y cancelar citas con hasta 24 horas de antelación.

### **C. Gestión de Pagos y Operación**

* **Modelo de Pago:** Únicamente **Efectivo en el Local**.  
* **Estado de Pago:** El administrador marca manualmente la cita como "Pagada" al finalizar el servicio.  
* **Alertas de Salud:** El panel del estilista debe mostrar un banner de advertencia visual si el cliente tiene alergias registradas.

## ---

**4\. Estructura de Datos (Esquema SQL)**

SQL

\-- Perfiles de usuario y ficha médica  
CREATE TABLE profiles (  
  id uuid REFERENCES auth.users PRIMARY KEY,  
  full\_name text,  
  phone text,  
  address text,  
  blood\_type varchar(5),  
  medical\_conditions text,  
  allergies text,  
  role text DEFAULT 'client'  
);

\-- Servicios del salón  
CREATE TABLE services (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  name text NOT NULL,  
  duration\_minutes int NOT NULL,  
  price numeric NOT NULL  
);

\-- Citas  
CREATE TABLE appointments (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  client\_id uuid REFERENCES profiles(id),  
  service\_id uuid REFERENCES services(id),  
  appointment\_date timestamp with time zone,  
  status text DEFAULT 'pendiente', \-- pendiente, completada, cancelada  
  payment\_method text DEFAULT 'efectivo'  
);

## ---

**5\. Requerimientos No Funcionales**

* **Seguridad:** Encriptación de datos sensibles en tránsito y reposo.  
* **Disponibilidad:** Sistema accesible 24/7 para reservas online.  
* **Responsividad:** Interfaz optimizada para dispositivos móviles (Mobile-First).  
* **Legal:** Aviso de privacidad aceptado explícitamente por el usuario para el manejo de datos de salud.

## ---

**6\. Flujo de Notificaciones (Automatización)**

1. **Confirmación Instantánea:** Al crear la cita, una Edge Function envía un email confirmando fecha y hora.  
2. **Recordatorio de Salud:** El email incluye una confirmación de que sus datos médicos han sido recibidos para su seguridad.  
3. **Aviso de Pago:** Se reitera que el pago se realizará en efectivo al asistir al salón.

## ---

**7\. Próximos Pasos Recomendados**

1. **Despliegue de DB:** Ejecutar el SQL en el editor de Supabase.  
2. **Maquetación de UI:** Crear los formularios de registro de salud en React.  
3. **Test de RLS:** Confirmar que un cliente no puede ver la ficha médica de otro cliente.

---

**¿Hay algún detalle adicional que desees ajustar o estás listo para comenzar con la implementación técnica?**