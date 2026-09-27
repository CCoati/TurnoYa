import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PlanBadge } from './PlanBadge'
import { useBusinessPlan } from '../hooks/useBusinessPlan'
import {
  Users,
  Calendar,
  Building2,
  HardDrive,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'

interface PlanUsageCardProps {
  onOpenPlansModal?: () => void
}

export const PlanUsageCard: React.FC<PlanUsageCardProps> = ({ onOpenPlansModal }) => {
  const { plan, limits, usage, isLoading, staffCheck, appointmentCheck } = useBusinessPlan()

  if (isLoading) {
    return (
      <Card variant="default" className="p-6 text-center">
        <LoadingSpinner size="md" />
        <p className="text-xs text-slate-400 mt-2">Cargando suscripción y cuotas...</p>
      </Card>
    )
  }

  if (!plan || !limits || !usage) return null

  return (
    <Card variant="glass" className="p-5 sm:p-6 space-y-5 border-white/10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Suscripción Actual
            </span>
            <PlanBadge planId={plan.id} planName={plan.name} size="sm" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Límites y Consumo del Negocio
          </h3>
        </div>

        {onOpenPlansModal && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPlansModal}
            className="flex items-center gap-1.5 text-xs text-brand-300 border-brand-500/30 hover:bg-brand-500/10 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Gestionar Plan</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500" />
          </Button>
        )}
      </div>

      {/* Limits & Usage Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Barberos / Staff */}
        <div className="p-3.5 rounded-xl bg-surface-dark/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              Barberos
            </span>
            <span className="font-bold text-white">
              {usage.current_staff} / {limits.max_staff === -1 ? '∞' : limits.max_staff}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                !staffCheck.allowed
                  ? 'bg-red-500'
                  : staffCheck.percentage > 80
                  ? 'bg-amber-500'
                  : 'bg-brand-500'
              }`}
              style={{ width: `${staffCheck.isUnlimited ? 30 : staffCheck.percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {!staffCheck.allowed
              ? 'Límite alcanzado'
              : staffCheck.isUnlimited
              ? 'Ilimitados'
              : `Te quedan ${staffCheck.remaining} disponible(s)`}
          </p>
        </div>

        {/* 2. Reservas Mensuales */}
        <div className="p-3.5 rounded-xl bg-surface-dark/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              Reservas del Mes
            </span>
            <span className="font-bold text-white">
              {usage.current_monthly_appointments} /{' '}
              {limits.max_monthly_appointments === -1 ? '∞' : limits.max_monthly_appointments}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                !appointmentCheck.allowed
                  ? 'bg-red-500'
                  : appointmentCheck.percentage > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${appointmentCheck.isUnlimited ? 20 : appointmentCheck.percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {!appointmentCheck.allowed
              ? 'Límite mensual alcanzado'
              : appointmentCheck.isUnlimited
              ? 'Ilimitadas este mes'
              : `${appointmentCheck.remaining} turnos restantes este mes`}
          </p>
        </div>

        {/* 3. Sucursales */}
        <div className="p-3.5 rounded-xl bg-surface-dark/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              Sucursales
            </span>
            <span className="font-bold text-white">
              1 / {limits.max_branches === -1 ? '∞' : limits.max_branches}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full bg-brand-400"
              style={{ width: `${limits.max_branches === 1 ? 100 : 20}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {limits.max_branches > 1 ? 'Multi-sucursal habilitado' : '1 local incluido'}
          </p>
        </div>

        {/* 4. Almacenamiento */}
        <div className="p-3.5 rounded-xl bg-surface-dark/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-brand-400" />
              Almacenamiento
            </span>
            <span className="font-bold text-white">{limits.max_storage_mb} MB</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: '15%' }} />
          </div>
          <p className="text-[10px] text-slate-400">Para logos, fotos y catálogo</p>
        </div>
      </div>

      {/* Feature Entitlements Chips */}
      <div className="pt-2 border-t border-white/5">
        <span className="text-[11px] font-semibold text-slate-400 block mb-2">
          Funcionalidades Habilitadas en el Plan:
        </span>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {Object.entries(limits.features || {}).map(([key, enabled]) => {
            const formatKey = (k: string) => {
              switch (k) {
                case 'whatsapp_integration':
                  return 'Enlaces WhatsApp Directo'
                case 'whatsapp_api_automated':
                  return 'Notificaciones WhatsApp Automáticas'
                case 'custom_branding':
                  return 'Personalización de Marca'
                case 'advanced_analytics':
                  return 'Métricas Avanzadas'
                case 'export_reports':
                  return 'Exportación de Reportes'
                case 'multi_branch':
                  return 'Múltiples Sucursales'
                case 'priority_support':
                  return 'Soporte Prioritario'
                case 'api_access':
                  return 'Acceso API REST'
                default:
                  return k.replace(/_/g, ' ')
              }
            }

            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                  enabled
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-surface-elevated/40 border-white/5 text-slate-500 line-through opacity-60'
                }`}
              >
                {enabled ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-slate-600" />
                )}
                <span>{formatKey(key)}</span>
              </span>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
