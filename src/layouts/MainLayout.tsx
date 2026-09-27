import React from 'react'
import {
  CalendarDays,
  Store,
  Users,
  Briefcase,
  Clock,
  LogOut,
  Palette,
  LogIn,
  UserPlus,
  ChevronDown,
  Building2,
  Sparkles,
  LayoutDashboard,
  CalendarCheck,
  Globe,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { useBusinessContext } from '@/features/businesses/BusinessContext'

interface MainLayoutProps {
  children: React.ReactNode
  currentTab: string
  onTabChange: (tab: string) => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
  onOpenProfile?: () => void
  onOpenCreateBusiness?: () => void
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  onOpenAuth,
  onOpenProfile,
  onOpenCreateBusiness,
}) => {
  const { user, profile, isAuthenticated, signOut, isLoading } = useAuth()
  const {
    activeBusiness,
    activeMembership,
    availableBusinesses,
    setActiveBusinessId,
  } = useBusinessContext()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard SaaS', icon: <LayoutDashboard className="w-4 h-4" />, protected: true },
    { id: 'calendar', label: 'Calendario & Turnos', icon: <CalendarDays className="w-4 h-4" />, protected: true },
    { id: 'appointments', label: 'Citas', icon: <CalendarCheck className="w-4 h-4" />, protected: true },
    { id: 'services', label: 'Servicios', icon: <Briefcase className="w-4 h-4" />, protected: true },
    { id: 'staff', label: 'Profesionales', icon: <Users className="w-4 h-4" />, protected: true },
    { id: 'hours', label: 'Horarios', icon: <Clock className="w-4 h-4" />, protected: true },
    { id: 'businesses', label: 'Negocio Multi-Rubro', icon: <Store className="w-4 h-4" /> },
    { id: 'public-page', label: 'Portal Público', icon: <Globe className="w-4 h-4 text-emerald-400" /> },
    { id: 'design-system', label: 'Sistema de Diseño', icon: <Palette className="w-4 h-4" /> },
  ]

  // Dynamic user dropdown items
  const userMenuItems = [
    {
      id: 'profile',
      label: 'Mi Perfil & Ajustes',
      icon: <Users className="w-4 h-4" />,
      onClick: onOpenProfile,
    },
    {
      id: 'hours-settings',
      label: 'Horarios de Atención',
      icon: <Clock className="w-4 h-4 text-brand-400" />,
      onClick: () => onTabChange('hours'),
    },
    ...(availableBusinesses.length > 0
      ? [
          { id: 'divider-biz', label: '', divider: true },
          ...availableBusinesses.map(biz => ({
            id: `biz-${biz.id}`,
            label: `${biz.name}${biz.id === activeBusiness?.id ? ' (Activo)' : ''}`,
            icon: <Building2 className="w-4 h-4 text-brand-400" />,
            onClick: () => setActiveBusinessId(biz.id),
          })),
        ]
      : []),
    {
      id: 'create-business',
      label: '+ Registrar Nuevo Negocio',
      icon: <Store className="w-4 h-4 text-emerald-400" />,
      onClick: onOpenCreateBusiness,
    },
    { id: 'divider-logout', label: '', divider: true },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: () => signOut(),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-surface-darkest text-slate-100 selection:bg-brand-600 selection:text-white relative">
      {/* Background ambient radial glow inspired by logo */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-brand-600/10 blur-[130px] rounded-full pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-surface-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer py-1 select-none"
              onClick={() => onTabChange('dashboard')}
            >
              <img
                src="/logo-optimized.png"
                alt="TurnosYa Logo"
                width="60"
                height="40"
                className="h-10 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                loading="eager"
                decoding="async"
              />
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-white">
                    Turno<span className="text-brand-400">Ya</span>
                  </span>
                  <Badge variant="brand" size="sm" dot>SaaS</Badge>
                </div>
                <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                  Reservas en un click
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-white/10">
              {navItems.map((item) => {
                const isActive = currentTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-brand-sm'
                        : 'text-slate-400 hover:text-white hover:bg-surface-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Active Business Selector / Indicator (if authenticated) */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center">
                {activeBusiness ? (
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800/80 hover:bg-surface-800 border border-white/10 text-xs transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-brand-400" />
                    <span className="font-semibold text-slate-200 max-w-[140px] truncate">
                      {activeBusiness.name}
                    </span>
                    {activeMembership?.role && (
                      <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.5 rounded bg-surface-700">
                        {activeMembership.role}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onOpenCreateBusiness}
                    className="text-xs text-brand-300 hover:text-white border border-brand-500/20 hover:border-brand-500/40"
                  >
                    <Store className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                    + Crear Negocio
                  </Button>
                )}
              </div>
            )}

            {/* Auth Controls */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-surface-800 animate-pulse" />
            ) : isAuthenticated ? (
              /* Authenticated User Menu */
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2.5 pl-2 py-1 cursor-pointer">
                    <Avatar
                      name={profile?.full_name || user?.email || 'Usuario'}
                      status="online"
                      size="sm"
                    />
                    <div className="hidden xl:flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-200">
                        {profile?.full_name || 'Mi Cuenta'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                }
                items={userMenuItems}
              />
            ) : (
              /* Unauthenticated: Iniciar Sesión / Registro */
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAuth?.('login')}
                  className="text-xs font-semibold text-slate-300 hover:text-white"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Iniciar Sesión
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenAuth?.('register')}
                  className="text-xs font-semibold shadow-brand-sm"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Registrarse
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation Scroll */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-t border-white/5 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-surface-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">TurnosYa Platform</span>
            <span>•</span>
            <span>SaaS Multi-Tenant & Gestión de Reservas</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Supabase Auth Conectado
            </span>
            <span>•</span>
            <span className="text-brand-400 font-medium">Reservas en un click</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
