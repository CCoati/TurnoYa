# TurnosYa - Plataforma SaaS Multi-Tenant de Gestión de Turnos y Reservas

<p align="center">
  <img src="./logo.png" alt="TurnosYa Logo" width="180" />
</p>

**TurnosYa** es una plataforma moderna de gestión de reservas y turnos diseñada específicamente para barberías, peluquerías, salones de belleza y centros de estética. Cuenta con arquitectura multi-tenant estricta, motor de disponibilidad atómico en PostgreSQL, integración con FullCalendar, enlace con WhatsApp y preparación completa para suscripciones SaaS.

---

## 🚀 Características Principales

### 🏢 Multi-Tenancy & Seguridad
- **Aislamiento Total de Tenants**: Implementado a nivel de base de datos con **PostgreSQL Row Level Security (RLS)**.
- **Roles Granulares**: Soporte para `owner`, `admin` y `staff`.
- **Protección de Datos Privados**: Los clientes y usuarios anónimos solo pueden ver información pública autorizada; los teléfonos y notas de otros clientes nunca son expuestos.

### 📅 Motor de Reservas y Disponibilidad en Tiempo Real
- **Prevención de Solapamiento Cero**: Exclusion Constraint en PostgreSQL (`btree_gist`) que garantiza transaccionalidad atómica y evita reservas dobles o *race conditions*.
- **Cálculo Inteligente de Slots**: Basado en los horarios de atención del negocio, duración del servicio seleccionado y disponibilidad del profesional.
- **Soporte de Zonas Horarias**: Adaptación automática al huso horario del negocio (por ej. `America/Argentina/Buenos_Aires`).
- **Liberación Inmediata de Horarios**: Las cancelaciones liberan automáticamente el slot en la base de datos.

### 💈 Gestión de Profesionales (Staff) y Servicios
- **Staff / Barberos**: Alta, edición, activación/desactivación y vinculación opcional con usuarios autenticados de Supabase.
- **Catálogo de Servicios**: Configuración de precios, duraciones en minutos y protección contra borrado accidental de servicios con historial de turnos (soft-delete seguro).
- **Horarios Comerciales**: Configuración semanal de días de apertura y horas de atención (`open_time < close_time`).

### 📱 Experiencia Pública de Reserva (Portal Cliente)
- **Ruta Pública por Slug**: `turnosya.com/b/:slug` accesible desde cualquier dispositivo móvil o de escritorio sin necesidad de registrarse.
- **Flujo Guiado en Pasos**:
  1. Selección de Servicio
  2. Selección de Barbero/Profesional
  3. Selección de Fecha
  4. Horario Disponible
  5. Datos de Contacto
  6. Confirmación con Código Amigable de Turno (`#TY-XXXX`)

### 💬 Integración con WhatsApp
- Botón **"Contactar por WhatsApp"** para clientes tras confirmar la reserva.
- Botón en panel administrativo para que el negocio contacte al cliente directamente.
- Normalización automática de números de teléfono (soporte para formatos argentinos con código de país `+54 9`, números locales y números internacionales).

### 💎 Arquitectura SaaS Comercial (Planes y Límites)
- Planes configurables: **Free**, **Pro** y **Business**.
- Control dinámico de límites en backend:
  - Máximo de colaboradores/barberos (`can_add_staff`) protegido por Trigger en PostgreSQL.
  - Límite mensual de reservas (`can_create_appointment`) validado directamente en la función RPC `book_appointment`.
  - Habilitación de funcionalidades avanzadas (`can_use_feature`).
- Modal interactivo de selección y comparación de planes con RPC `change_business_plan`.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, FullCalendar v6
- **Build Tool**: Vite 6 con code-splitting optimizado (`manualChunks`)
- **Backend / Database**: PostgreSQL con Supabase (Auth, PostgREST, RLS, Functions, Triggers, GiST Indexes)

---

## 📦 Instalación y Desarrollo Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/CCoati/TurnoYa.git
cd TurnoYa
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` basado en `.env.example`:
```bash
cp .env.example .env.local
```

Completa con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

### 4. Aplicar migraciones en Supabase
Las migraciones se encuentran ordenadas en el directorio `supabase/migrations/`:
- `20260925233000_create_turnosya_schema.sql`
- `20260925234500_implement_multi_tenant_rls.sql`
- `20260925235500_business_onboarding_and_category.sql`
- `20260927160000_create_booking_engine.sql`
- `20260927180000_enable_public_business_booking_rls.sql`
- `20260927200000_create_saas_plans_and_limits.sql`
- `20260927210000_production_readiness_audit_fixes.sql`

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 6. Build de producción
```bash
npm run build
```

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
