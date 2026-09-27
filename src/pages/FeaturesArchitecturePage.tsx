import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@/components/ui'
import {
  Store,
  Users,
  Briefcase,
  Calendar,
  Clock,
  Layers,
  CheckCircle,
  Database,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Network,
  Lock,
} from 'lucide-react'

interface FeaturesArchitecturePageProps {
  onGoToDesignSystem: () => void
}

export const FeaturesArchitecturePage: React.FC<FeaturesArchitecturePageProps> = ({
  onGoToDesignSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'entities' | 'rls' | 'scalability'>('entities')

  const entities = [
    {
      name: 'profiles',
      type: 'Plataforma / Identidad',
      description: 'Cuentas de usuario de la plataforma. user_id != business_id. Un perfil puede crear o pertenecer a múltiples negocios.',
      icon: <Users className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'id (auth.users)',
    },
    {
      name: 'businesses',
      type: 'Tenant Principal',
      description: 'Entidad de cada negocio (ej. The Barber Club u otros). Almacena slug único, categoría, moneda, zona horaria y plan SaaS.',
      icon: <Store className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'id (Primary Key)',
    },
    {
      name: 'business_members',
      type: 'Relación N:N',
      description: 'Vínculo explícito entre usuarios y negocios con roles (owner, admin, staff, extensible) y estado activo/inactivo.',
      icon: <Network className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'business_id + user_id',
    },
    {
      name: 'business_settings',
      type: 'Configuración 1:1',
      description: 'Reglas de reserva: intervalo de turnos (15/30/45 min), anticipación mínima/máxima, políticas de cancelación y flags de sucursal.',
      icon: <Sliders className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'business_id (Unique)',
    },
    {
      name: 'staff',
      type: 'Colaboradores',
      description: 'Profesionales y barberos pertenecientes al negocio. Soporte opcional de perfil de usuario, comisiones y branch_id.',
      icon: <Users className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'business_id',
    },
    {
      name: 'services',
      type: 'Catálogo de Servicios',
      description: 'Servicios del negocio con duración, tiempos de preparación (buffer times), categorías y precios por moneda.',
      icon: <Briefcase className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'business_id',
    },
    {
      name: 'business_hours',
      type: 'Horarios Comerciales',
      description: 'Horarios semanales recurrentes por día de la semana (0 a 6), descansos intermedios y soporte por sucursal.',
      icon: <Calendar className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'business_id',
    },
    {
      name: 'appointments',
      type: 'Citas & Reservas',
      description: 'Turnos reservados vinculando servicio, staff y cliente. Estados: pending, confirmed, in_progress, completed, cancelled.',
      icon: <Clock className="w-4 h-4 text-brand-400" />,
      multiTenantKey: 'business_id (Mandatory)',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/30 text-xs text-brand-300 font-semibold mb-2">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span>Núcleo Multi-Tenant TurnosYa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Arquitectura de Negocios Independientes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aislamiento estricto por <code className="text-brand-300 bg-surface-800 px-1.5 py-0.5 rounded font-mono text-xs">business_id</code> y seguridad PostgreSQL Row Level Security (RLS).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onGoToDesignSystem} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Ver Sistema de Diseño
          </Button>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'entities'
              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-brand-sm'
              : 'text-slate-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          Entidades & Multi-Tenancy (8 Tablas)
        </button>
        <button
          onClick={() => setActiveTab('rls')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'rls'
              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-brand-sm'
              : 'text-slate-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          PostgreSQL + Supabase RLS
        </button>
        <button
          onClick={() => setActiveTab('scalability')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'scalability'
              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-brand-sm'
              : 'text-slate-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          Matriz de Escalabilidad Futura
        </button>
      </div>

      {/* Tab: Entities */}
      {activeTab === 'entities' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-surface-900 border border-brand-500/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">Regla de Oro de Multi-Tenancy:</p>
              <p>
                Un usuario no equivale a un negocio (<code className="text-brand-300 font-mono">user_id != business_id</code>). Todos los servicios, colaboradores, horarios y citas requieren obligatoriamente <code className="text-brand-300 font-mono">business_id</code> para garantizar aislamiento total entre negocios.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {entities.map((item) => (
              <Card key={item.name} variant="default" className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-surface-800 border border-white/5">
                        {item.icon}
                      </div>
                      <Badge variant="brand" size="sm">
                        {item.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-mono text-brand-300">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-3">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </div>
                <div className="px-6 py-3 bg-surface-950/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="text-slate-500">Scope:</span>
                  <span className="text-slate-200">{item.multiTenantKey}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: RLS Security */}
      {activeTab === 'rls' && (
        <Card variant="glass" className="space-y-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <CardTitle>Seguridad en la Capa de Datos (PostgreSQL + Supabase RLS)</CardTitle>
            </div>
            <CardDescription>
              La separación entre negocios no depende exclusivamente del frontend React. Toda consulta pasa por políticas de Row-Level Security en PostgreSQL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-950 font-mono text-xs text-slate-300 space-y-2 border border-white/10 overflow-x-auto">
              <p className="text-brand-400 font-semibold">-- Función helper en PostgreSQL para validar pertenencia:</p>
              <pre className="text-slate-300">
{`CREATE FUNCTION public.is_business_member(lookup_business_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = lookup_business_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;`}
              </pre>
              <p className="text-brand-400 font-semibold pt-2">-- Política para citas (appointments):</p>
              <pre className="text-emerald-400">
{`CREATE POLICY "Appointments visible only to business members or client"
  ON public.appointments FOR SELECT
  USING (public.is_business_member(business_id) OR auth.uid() = customer_profile_id);`}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-surface-850 border border-white/5">
                <span className="text-xs font-semibold text-white block mb-1">Rol: owner</span>
                <p className="text-xs text-slate-400">Control total, facturación, planes y configuración de la empresa.</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-850 border border-white/5">
                <span className="text-xs font-semibold text-white block mb-1">Rol: admin</span>
                <p className="text-xs text-slate-400">Gestión de staff, servicios, horarios y citas.</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-850 border border-white/5">
                <span className="text-xs font-semibold text-white block mb-1">Rol: staff</span>
                <p className="text-xs text-slate-400">Visualización de agenda personal y turnos asignados.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Scalability Matrix */}
      {activeTab === 'scalability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Multi-Negocio & Multi-Usuario
              </CardTitle>
              <CardDescription>
                Un usuario con una sola cuenta puede ser "owner" en una barbería y "staff" en otra.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-300 space-y-2">
              <p>• La tabla de unión <code className="text-brand-300 font-mono">business_members</code> desacopla las credenciales de la propiedad del negocio.</p>
              <p>• Preparado para selector de empresas tipo "Cambiar de Organización".</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Múltiples Sucursales (Multi-Branch Ready)
              </CardTitle>
              <CardDescription>
                Campos <code className="text-brand-300 font-mono">branch_id</code> preparados en staff, services y appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-300 space-y-2">
              <p>• El flag <code className="text-brand-300 font-mono">branch_enabled</code> en <code className="text-brand-300 font-mono">business_settings</code> permite activar sucursales sin migraciones destructivas.</p>
              <p>• Horarios comerciales independientes por sucursal cuando se habilite el módulo.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Múltiples Planes SaaS (Billing Tiers)
              </CardTitle>
              <CardDescription>
                Columna <code className="text-brand-300 font-mono">subscription_tier</code> en cada negocio.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-300 space-y-2">
              <p>• Planes preparados: <code className="text-brand-300 font-mono">free</code>, <code className="text-brand-300 font-mono">starter</code>, <code className="text-brand-300 font-mono">pro</code>, <code className="text-brand-300 font-mono">enterprise</code>.</p>
              <p>• Listo para integrar pasarelas (Mercado Pago, Stripe) limitando número de barberos o sucursales por plan.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Capa de Servicios Desacoplada
              </CardTitle>
              <CardDescription>
                Zero SQL dentro de componentes visuales de React.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-300 space-y-2">
              <p>• Servicios preparados: <code className="text-brand-300 font-mono">authService</code>, <code className="text-brand-300 font-mono">businessService</code>, <code className="text-brand-300 font-mono">staffService</code>, <code className="text-brand-300 font-mono">serviceService</code>, <code className="text-brand-300 font-mono">appointmentService</code>.</p>
              <p>• Todos exigen <code className="text-brand-300 font-mono">business_id</code> en sus parámetros.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
