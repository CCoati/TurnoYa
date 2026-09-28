import React from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { useBusinessContext } from '@/features/businesses/BusinessContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Store,
  CalendarDays,
  Users,
  Briefcase,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import {
  useBusinessPlan,
  PlanBadge,
  PlanUsageCard,
  PlanComparisonModal,
} from '@/features/subscription'

interface DashboardPageProps {
  onOpenCreateBusiness: () => void
  onNavigateTab: (tab: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCreateBusiness,
  onNavigateTab,
}) => {
  const { user, profile } = useAuth()
  const {
    activeBusiness,
    activeMembership,
    availableBusinesses,
    hasBusiness,
    setActiveBusinessId,
  } = useBusinessContext()

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const [staffCount, setStaffCount] = React.useState<number | null>(null)
  const [servicesCount, setServicesCount] = React.useState<number | null>(null)
  const [todayAppointmentsCount, setTodayAppointmentsCount] = React.useState<number | null>(null)

  // SaaS Subscription & Plan
  const { plan, refresh: refreshPlan } = useBusinessPlan(activeBusiness?.id)
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState<boolean>(false)

  React.useEffect(() => {
    let isMounted = true
    if (activeBusiness?.id) {
      const businessId = activeBusiness.id
      const todayStr = new Date().toISOString().split('T')[0]

      // Execute all 3 independent count queries in parallel
      Promise.all([
        supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId),
        supabase
          .from('services')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('active', true),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('appointment_date', todayStr)
          .neq('status', 'cancelled'),
      ]).then(([staffRes, servicesRes, appointmentsRes]) => {
        if (!isMounted) return
        if (!staffRes.error && staffRes.count !== null) setStaffCount(staffRes.count)
        if (!servicesRes.error && servicesRes.count !== null) setServicesCount(servicesRes.count)
        if (!appointmentsRes.error && appointmentsRes.count !== null) setTodayAppointmentsCount(appointmentsRes.count)
      })
    }
    return () => {
      isMounted = false
    }
  }, [activeBusiness?.id])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-brand-900/40 via-surface-900/60 to-surface-900/80 border border-brand-500/20 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>SaaS Multi-Tenant Activo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">{userName}</span>! 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Bienvenido al panel central de TurnosYa. Administra tus negocios, servicios, staff y reservas en un único ecosistema multi-tenant.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasBusiness ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigateTab('calendar')}
                className="shadow-brand-md"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Ver Calendario
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={onOpenCreateBusiness}
                className="shadow-brand-md"
              >
                <Store className="w-4 h-4 mr-2" />
                Crear Mi Primer Negocio
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* State 1: User without business yet */}
      {!hasBusiness ? (
        <Card variant="glass" className="border-brand-500/20 text-center py-12 px-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/15 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-brand-400">
            <Store className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Tu cuenta de usuario está lista</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
            En TurnosYa, tu perfil de usuario es independiente de los negocios. Puedes crear tu propio negocio ahora mismo o esperar a que te inviten a uno existente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onOpenCreateBusiness}
              className="shadow-brand-md"
            >
              <Store className="w-4 h-4 mr-2" />
              Crear Nuevo Negocio
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigateTab('design-system')}
            >
              Explorar Sistema de Diseño
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 max-w-md mx-auto grid grid-cols-2 gap-4 text-left text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Multi-negocio en una sola cuenta</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Aislamiento estricto de base de datos</span>
            </div>
          </div>
        </Card>
      ) : (
        /* State 2: User with active business */
        <div className="space-y-6">
          {/* Active Business Bar & Multi-Tenant Switcher */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-900 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-300 font-extrabold text-lg">
                {activeBusiness?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">{activeBusiness?.name}</h3>
                  <Badge variant="brand" size="sm">
                    {activeMembership?.role ? `Rol: ${activeMembership.role}` : 'Miembro'}
                  </Badge>
                  {plan && (
                    <PlanBadge
                      planId={plan.id}
                      planName={plan.name}
                      onClick={() => setIsPlanModalOpen(true)}
                      size="sm"
                    />
                  )}
                  {activeBusiness?.category && (
                    <Badge variant="neutral" size="sm">
                      {activeBusiness.category === 'barbershop'
                        ? 'Barbería'
                        : activeBusiness.category === 'hair_salon'
                        ? 'Peluquería'
                        : activeBusiness.category === 'aesthetics'
                        ? 'Estética'
                        : activeBusiness.category === 'beauty_salon'
                        ? 'Centro de Belleza'
                        : activeBusiness.category === 'spa_wellness'
                        ? 'Spa & Bienestar'
                        : 'Servicios'}
                    </Badge>
                  )}
                  <Badge variant="neutral" size="sm" dot>
                    Activo
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('public-page')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-mono mt-0.5 flex items-center gap-1 group/link cursor-pointer text-left"
                  title="Abrir página pública de reservas para clientes"
                >
                  <span>turnosya.com/{activeBusiness?.slug}</span>
                  <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Switch business buttons if user has more than 1 */}
            <div className="flex items-center gap-2">
              {availableBusinesses.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Cambiar a:</span>
                  {availableBusinesses
                    .filter(b => b.id !== activeBusiness?.id)
                    .map(b => (
                      <Button
                        key={b.id}
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveBusinessId(b.id)}
                        className="text-xs h-8"
                      >
                        <Building2 className="w-3.5 h-3.5 mr-1 text-brand-400" />
                        {b.name}
                      </Button>
                    ))}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenCreateBusiness}
                className="text-xs text-brand-300 hover:text-white border border-brand-500/20 h-8"
              >
                + Otro Negocio
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              variant="interactive"
              onClick={() => onNavigateTab('appointments')}
              className="p-5 border-white/5 hover:border-brand-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Citas de Hoy</span>
                <Clock className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-2xl font-black text-white">
                {todayAppointmentsCount !== null ? todayAppointmentsCount : '—'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-brand-400 mt-2 font-medium">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>
                  {todayAppointmentsCount === 0
                    ? 'Sin citas agendadas hoy'
                    : todayAppointmentsCount === 1
                    ? '1 cita activa hoy'
                    : `${todayAppointmentsCount} citas activas hoy`}
                </span>
              </div>
            </Card>

            <Card
              variant="interactive"
              onClick={() => onNavigateTab('staff')}
              className="p-5 border-white/5 hover:border-brand-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Profesionales</span>
                <Users className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-2xl font-black text-white">
                {staffCount !== null ? staffCount : '—'}
              </p>
              <p className="text-xs text-brand-400 mt-2 font-medium">
                {staffCount === 0
                  ? 'Sin colaboradores aún'
                  : staffCount === 1
                  ? '1 profesional registrado'
                  : `${staffCount} profesionales registrados`}
              </p>
            </Card>

            <Card
              variant="interactive"
              onClick={() => onNavigateTab('services')}
              className="p-5 border-white/5 hover:border-brand-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Servicios Activos</span>
                <Briefcase className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-2xl font-black text-white">
                {servicesCount !== null ? servicesCount : '—'}
              </p>
              <p className="text-xs text-brand-400 mt-2 font-medium">
                {servicesCount === 0
                  ? 'Sin servicios aún'
                  : servicesCount === 1
                  ? '1 servicio activo'
                  : `${servicesCount} servicios en catálogo`}
              </p>
            </Card>

            <Card variant="default" className="p-5 border-white/5 hover:border-brand-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Seguridad Supabase</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-300">Auth Conectado</p>
              <p className="text-[11px] text-slate-500 mt-2">JWT + PostgREST Activo</p>
            </Card>
          </div>

          {/* SaaS Limits & Usage Overview */}
          <PlanUsageCard onOpenPlansModal={() => setIsPlanModalOpen(true)} />

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card
              variant="interactive"
              className="p-6 cursor-pointer group"
              onClick={() => onNavigateTab('calendar')}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                Calendario de Turnos
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Visualiza la agenda del día o semana, filtra por profesional y agenda citas.
              </p>
              <div className="flex items-center gap-1 text-xs text-brand-400 font-semibold mt-4">
                <span>Abrir Agenda</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            <Card
              variant="interactive"
              className="p-6 cursor-pointer group"
              onClick={() => onNavigateTab('services')}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                Catálogo de Servicios
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Configura duraciones, precios, descripciones y disponibilidad de tu catálogo.
              </p>
              <div className="flex items-center gap-1 text-xs text-brand-400 font-semibold mt-4">
                <span>Gestionar Servicios</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            <Card
              variant="interactive"
              className="p-6 cursor-pointer group"
              onClick={() => onNavigateTab('staff')}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                Equipo & Profesionales
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Administra a tu equipo, asocia usuarios con roles y define su estado activo.
              </p>
              <div className="flex items-center gap-1 text-xs text-brand-400 font-semibold mt-4">
                <span>Ver Profesionales</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            <Card
              variant="interactive"
              className="p-6 cursor-pointer group"
              onClick={() => onNavigateTab('hours')}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                Horarios de Atención
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Define los días de apertura y las horas de atención para generar disponibilidad.
              </p>
              <div className="flex items-center gap-1 text-xs text-brand-400 font-semibold mt-4">
                <span>Configurar Horarios</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Plan comparison and upgrade modal */}
      {activeBusiness && (
        <PlanComparisonModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          currentPlanId={plan?.id || 'free'}
          onPlanChanged={refreshPlan}
          businessId={activeBusiness.id}
        />
      )}
    </div>
  )
}
