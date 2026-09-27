import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { subscriptionService } from '@/services/subscriptionService'
import { Plan, PlanTier } from '../types'
import {
  Check,
  Zap,
  Crown,
  Shield,
  Sparkles,
  ArrowRight,
  HardDrive,
  Users,
  Calendar,
  Building2,
  Info,
} from 'lucide-react'

interface PlanComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlanId: PlanTier
  onPlanChanged?: () => void
  businessId: string
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  onPlanChanged,
  businessId,
}) => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPlans()
    }
  }, [isOpen])

  const loadPlans = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    const res = await subscriptionService.getAllPlans()
    if (res.success && res.data) {
      setPlans(res.data)
    } else {
      setErrorMessage(res.error || 'Error al cargar los planes.')
    }
    setIsLoading(false)
  }

  const handleSelectPlan = async (planId: PlanTier) => {
    if (planId === currentPlanId) return
    setIsUpdating(planId)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await subscriptionService.changeBusinessPlan(businessId, planId)
      if (res.success) {
        setSuccessMessage(`¡Plan actualizado con éxito! Nuevos límites aplicados.`)
        if (onPlanChanged) onPlanChanged()
        setTimeout(() => {
          onClose()
          setSuccessMessage(null)
        }, 1500)
      } else {
        setErrorMessage(res.error || 'No se pudo actualizar el plan.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado.')
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold text-white">Planes Comerciales de TurnosYa</h2>
          </div>
          <p className="text-xs text-slate-400">
            Escala tu negocio según el tamaño de tu equipo y volumen de reservas.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Pre-billing notification notice */}
        <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-start gap-2.5 text-xs text-brand-200">
          <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Modo Arquitectura SaaS:</strong> Los límites de barberos, reservas y almacenamiento se configuran dinámicamente desde el backend. Puedes alternar planes para comprobar el comportamiento del sistema. (Pasarela de pagos en desarrollo).
          </span>
        </div>

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs text-center">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400 mt-2">Cargando planes desde el backend...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isCurrent = p.id === currentPlanId
              const isPro = p.id === 'pro'
              const isBusiness = p.id === 'business'
              const limits = p.default_limits

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${
                    isCurrent
                      ? 'bg-brand-500/10 border-brand-500/60 ring-2 ring-brand-500/30'
                      : isPro
                      ? 'bg-surface-dark border-purple-500/30 hover:border-purple-500/60'
                      : 'bg-surface-dark border-white/10 hover:border-white/20'
                  }`}
                >
                  {isPro && !isCurrent && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-brand-500 to-purple-500 text-white shadow-md">
                      Más Popular
                    </span>
                  )}

                  {isCurrent && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md">
                      Plan Actual
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {isBusiness ? (
                          <Crown className="w-4 h-4 text-amber-400" />
                        ) : isPro ? (
                          <Zap className="w-4 h-4 text-brand-400" />
                        ) : (
                          <Shield className="w-4 h-4 text-slate-400" />
                        )}
                        <h3 className="font-extrabold text-base text-white">{p.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 min-h-[32px]">{p.description}</p>
                    </div>

                    {/* Price */}
                    <div className="pb-3 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-white">
                          ${p.price_monthly}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/mes</span>
                      </div>
                    </div>

                    {/* Dynamic Limits Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Users className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                        <span>
                          <strong>{limits.max_staff === -1 ? 'Ilimitados' : limits.max_staff}</strong>{' '}
                          {limits.max_staff === 1 ? 'barbero' : 'barberos'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>
                          <strong>{limits.max_monthly_appointments === -1 ? 'Ilimitadas' : limits.max_monthly_appointments}</strong>{' '}
                          reservas / mes
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span>
                          <strong>{limits.max_branches === -1 ? 'Ilimitadas' : limits.max_branches}</strong>{' '}
                          {limits.max_branches === 1 ? 'sucursal' : 'sucursales'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-200">
                        <HardDrive className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>
                          <strong>{limits.max_storage_mb} MB</strong> almacenamiento
                        </span>
                      </div>
                    </div>

                    {/* Feature list */}
                    <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px]">
                      {Object.entries(p.features || {}).map(([fKey, enabled]) => (
                        <div key={fKey} className="flex items-center gap-2">
                          <Check className={`w-3 h-3 flex-shrink-0 ${enabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span className={enabled ? 'text-slate-300' : 'text-slate-600 line-through'}>
                            {fKey === 'whatsapp_integration' && 'WhatsApp directo'}
                            {fKey === 'whatsapp_api_automated' && 'WhatsApp API automático'}
                            {fKey === 'custom_branding' && 'Personalización de marca'}
                            {fKey === 'advanced_analytics' && 'Métricas avanzadas'}
                            {fKey === 'export_reports' && 'Exportación de reportes'}
                            {fKey === 'multi_branch' && 'Multi-sucursal'}
                            {fKey === 'priority_support' && 'Soporte prioritario'}
                            {fKey === 'api_access' && 'Acceso a API pública'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-5">
                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl bg-surface-elevated/70 border border-white/10 text-center text-xs font-bold text-slate-300">
                        Plan Actual
                      </div>
                    ) : (
                      <Button
                        variant={isPro ? 'primary' : 'outline'}
                        size="sm"
                        disabled={isUpdating === p.id}
                        onClick={() => handleSelectPlan(p.id)}
                        className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-1.5"
                      >
                        {isUpdating === p.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <span>Cambiar a {p.id.toUpperCase()}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
