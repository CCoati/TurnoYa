import React from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useBusinessContext } from '@/features/businesses/BusinessContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Lock, Store, Sparkles, UserPlus } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireBusiness?: boolean
  onOpenAuth?: (initialMode?: 'login' | 'register') => void
  onOpenCreateBusiness?: () => void
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireBusiness = false,
  onOpenAuth,
  onOpenCreateBusiness,
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const { hasBusiness, isLoadingBusiness } = useBusinessContext()

  // 1. Initial Loading State
  if (isLoading || (isAuthenticated && requireBusiness && isLoadingBusiness)) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center gap-4 py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full" />
          <img
            src="/logo-optimized.png"
            alt="TurnosYa Logo"
            className="w-14 h-14 object-contain animate-pulse relative z-10"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <LoadingSpinner size="sm" />
          <span>Verificando credenciales de TurnosYa...</span>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-fade-in">
        <Card variant="glass" className="text-center p-8 border-brand-500/30 shadow-brand-glow">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center mx-auto mb-5 text-brand-400">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Acceso a TurnosYa</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Inicia sesión o crea tu cuenta gratuita para gestionar tus reservas, servicios y clientes en tiempo real.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-brand-md"
              onClick={() => onOpenAuth?.('login')}
            >
              Iniciar Sesión
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full justify-center"
              onClick={() => onOpenAuth?.('register')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Cuenta Nueva
            </Button>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Autenticación segura respaldada por Supabase</span>
          </div>
        </Card>
      </div>
    )
  }

  // 3. User is authenticated, but route requires an active business and user hasn't created/joined one yet
  if (requireBusiness && !hasBusiness) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 animate-fade-in">
        <Card variant="default" className="text-center p-8 border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Store className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Aún no tienes un Negocio activo</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Tu cuenta está activa, pero este panel requiere estar asociado a un negocio. Puedes registrar tu negocio o solicitar que te inviten como miembro o profesional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => onOpenCreateBusiness?.()}
              className="w-full sm:w-auto"
            >
              <Store className="w-4 h-4 mr-2" />
              Crear Mi Primer Negocio
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // 4. Authorized
  return <>{children}</>
}
