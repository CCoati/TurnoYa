import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BusinessHour,
  DAYS_OF_WEEK_ORDERED,
} from './types'
import { useBusinessContext } from './BusinessContext'
import { businessService } from '@/services/businessService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Copy,
  Sparkles,
  ShieldAlert,
  CalendarX,
  Palmtree,
  PartyPopper,
  Info,
} from 'lucide-react'

export const BusinessHoursView: React.FC = () => {
  const { activeBusiness, activeMembership } = useBusinessContext()

  // Permissions: owner and admin can edit
  const isOwnerOrAdmin =
    activeMembership?.role === 'owner' || activeMembership?.role === 'admin'

  // State
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  // Load business hours from Supabase
  const loadHours = useCallback(async () => {
    if (!activeBusiness?.id) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await businessService.getBusinessHours(activeBusiness.id)
    if (res.success && res.data) {
      // Normalize times (slice seconds e.g. "09:00:00" -> "09:00")
      const normalized = res.data.map((item) => ({
        ...item,
        open_time: item.open_time ? item.open_time.slice(0, 5) : '09:00',
        close_time: item.close_time ? item.close_time.slice(0, 5) : '20:00',
      }))
      setHours(normalized)
      setHasUnsavedChanges(false)
    } else {
      setErrorMessage(res.error || 'No se pudieron cargar los horarios de atención.')
    }

    setIsLoading(false)
  }, [activeBusiness?.id])

  useEffect(() => {
    loadHours()
  }, [loadHours])

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successToast])

  // Toggle open / close for a day
  const handleToggleDay = (dayOfWeek: number) => {
    setHours((prev) =>
      prev.map((item) => {
        if (item.day_of_week === dayOfWeek) {
          const nextIsOpen = !item.is_open
          return {
            ...item,
            is_open: nextIsOpen,
            // If turning on and times are missing, assign reasonable defaults
            open_time: nextIsOpen && !item.open_time ? '09:00' : item.open_time,
            close_time: nextIsOpen && !item.close_time ? '20:00' : item.close_time,
          }
        }
        return item
      })
    )
    setHasUnsavedChanges(true)
  }

  // Update open or close time
  const handleTimeChange = (
    dayOfWeek: number,
    field: 'open_time' | 'close_time',
    value: string
  ) => {
    setHours((prev) =>
      prev.map((item) => {
        if (item.day_of_week === dayOfWeek) {
          return { ...item, [field]: value }
        }
        return item
      })
    )
    setHasUnsavedChanges(true)
  }

  // Quick Action 1: Copy Monday's schedule to all working days (Tuesday to Saturday)
  const handleCopyMondayToWeek = () => {
    const monday = hours.find((h) => h.day_of_week === 1)
    if (!monday) return

    setHours((prev) =>
      prev.map((item) => {
        // Apply to Tuesday (2) through Saturday (6)
        if (item.day_of_week >= 2 && item.day_of_week <= 6) {
          return {
            ...item,
            is_open: monday.is_open,
            open_time: monday.open_time,
            close_time: monday.close_time,
          }
        }
        return item
      })
    )
    setHasUnsavedChanges(true)
    setSuccessToast('Horario de Lunes replicado de Martes a Sábado.')
  }

  // Quick Action 2: Apply Typical Commercial (09:00 to 20:00, Sunday closed)
  const handleApplyCommercial = () => {
    setHours((prev) =>
      prev.map((item) => ({
        ...item,
        is_open: item.day_of_week !== 0,
        open_time: item.day_of_week !== 0 ? '09:00' : null,
        close_time: item.day_of_week !== 0 ? '20:00' : null,
      }))
    )
    setHasUnsavedChanges(true)
    setSuccessToast('Plantilla comercial (09:00 a 20:00) aplicada.')
  }

  // Quick Action 3: Apply Continuous Barbershop (10:00 to 21:00, Sunday closed)
  const handleApplyBarbershop = () => {
    setHours((prev) =>
      prev.map((item) => ({
        ...item,
        is_open: item.day_of_week !== 0,
        open_time: item.day_of_week !== 0 ? '10:00' : null,
        close_time: item.day_of_week !== 0 ? '21:00' : null,
      }))
    )
    setHasUnsavedChanges(true)
    setSuccessToast('Plantilla corrida de barbería (10:00 a 21:00) aplicada.')
  }

  // Calculate day difference in hours for display
  const getDayWorkingDuration = (openTime: string | null, closeTime: string | null) => {
    if (!openTime || !closeTime) return null
    const [hOpen, mOpen] = openTime.split(':').map(Number)
    const [hClose, mClose] = closeTime.split(':').map(Number)
    const startMins = hOpen * 60 + mOpen
    const endMins = hClose * 60 + mClose

    if (endMins <= startMins) return null

    const diffMins = endMins - startMins
    const hoursPart = Math.floor(diffMins / 60)
    const minsPart = diffMins % 60
    return minsPart > 0 ? `${hoursPart}h ${minsPart}m` : `${hoursPart} hs`
  }

  // Validation: Check if any open day has open_time >= close_time
  const validationErrors = useMemo(() => {
    const errors: Record<number, string> = {}
    hours.forEach((h) => {
      if (h.is_open) {
        if (!h.open_time || !h.close_time) {
          errors[h.day_of_week] = 'Debes definir horario de apertura y cierre.'
        } else if (h.open_time >= h.close_time) {
          errors[h.day_of_week] = 'La hora de apertura debe ser menor a la hora de cierre.'
        }
      }
    })
    return errors
  }, [hours])

  const hasErrors = Object.keys(validationErrors).length > 0

  // Save changes to Supabase
  const handleSave = async () => {
    if (!activeBusiness?.id || !isOwnerOrAdmin) return

    if (hasErrors) {
      setErrorMessage('Por favor corrige los horarios señalados antes de guardar.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    // Format for PostgreSQL TIME column ("HH:MM:00")
    const payloadToSave: BusinessHour[] = hours.map((item) => ({
      ...item,
      open_time: item.is_open && item.open_time ? `${item.open_time.slice(0, 5)}:00` : null,
      close_time: item.is_open && item.close_time ? `${item.close_time.slice(0, 5)}:00` : null,
    }))

    const res = await businessService.updateBusinessHours(activeBusiness.id, payloadToSave)
    setIsSaving(false)

    if (res.success && res.data) {
      setSuccessToast('¡Horarios de atención guardados exitosamente!')
      setHasUnsavedChanges(false)
      // Re-normalize times in state
      setHours(
        res.data.map((item) => ({
          ...item,
          open_time: item.open_time ? item.open_time.slice(0, 5) : '09:00',
          close_time: item.close_time ? item.close_time.slice(0, 5) : '20:00',
        }))
      )
    } else {
      setErrorMessage(res.error || 'Error al guardar los horarios de atención.')
    }
  }

  // Count open days
  const openDaysCount = hours.filter((h) => h.is_open).length

  if (!activeBusiness) {
    return (
      <Card variant="glass" className="p-8 text-center border-brand-500/20">
        <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Selecciona un Negocio</h3>
        <p className="text-xs text-slate-400">
          Debes seleccionar o crear un negocio para configurar sus horarios de atención.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-sm text-emerald-300 animate-slide-down">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-sm text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadHours} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Recargar
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Horarios de Atención
              </h2>
              <p className="text-xs text-slate-400">
                Disponibilidad semanal de atención al público para{' '}
                <span className="text-brand-300 font-semibold">{activeBusiness.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Button & Status */}
        <div className="flex items-center gap-3">
          {!isOwnerOrAdmin && (
            <Badge variant="warning" size="sm">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Solo Lectura
            </Badge>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={loadHours}
            disabled={isLoading || isSaving}
            title="Recargar horarios de Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {isOwnerOrAdmin && (
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isLoading || hasErrors || !hasUnsavedChanges}
              className="shadow-brand-md"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          )}
        </div>
      </div>

      {/* Quick Templates Bar */}
      {isOwnerOrAdmin && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="font-semibold text-white">Plantillas y Atajos:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleApplyCommercial}
              className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Comercial (09:00 a 20:00)
            </button>
            <button
              type="button"
              onClick={handleApplyBarbershop}
              className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Barbería (10:00 a 21:00)
            </button>
            <button
              type="button"
              onClick={handleCopyMondayToWeek}
              className="px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-xs text-brand-300 hover:text-brand-200 transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" />
              Copiar Lunes a Mar-Sáb
            </button>
          </div>
        </div>
      )}

      {/* Summary Status Strip */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand-400" />
          <span>
            {openDaysCount === 7
              ? 'Abierto todos los días de la semana'
              : openDaysCount === 0
              ? 'Todos los días cerrados temporalmente'
              : `Abierto ${openDaysCount} de 7 días semanales`}
          </span>
        </div>

        {hasUnsavedChanges && (
          <span className="text-amber-400 font-medium animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Tienes cambios sin guardar
          </span>
        )}
      </div>

      {/* MAIN SCHEDULE LIST: Monday through Sunday */}
      {isLoading ? (
        /* Skeletons */
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Card key={n} variant="default" className="p-4 border-white/5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-28 h-5 rounded bg-surface-800" />
                <div className="w-64 h-8 rounded bg-surface-800" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS_OF_WEEK_ORDERED.map((meta) => {
            const dayRecord = hours.find((h) => h.day_of_week === meta.day)
            const isOpen = dayRecord?.is_open ?? false
            const openTime = dayRecord?.open_time || '09:00'
            const closeTime = dayRecord?.close_time || '20:00'
            const dayError = validationErrors[meta.day]
            const durationLabel = isOpen ? getDayWorkingDuration(openTime, closeTime) : null

            return (
              <Card
                key={meta.day}
                variant="default"
                className={`p-4 sm:p-5 transition-all border ${
                  dayError
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : isOpen
                    ? 'border-white/10 hover:border-brand-500/30'
                    : 'border-white/5 opacity-70 bg-surface-950/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Day Name + Toggle Switch + Badge */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    {/* Toggle switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={() => handleToggleDay(meta.day)}
                        disabled={!isOwnerOrAdmin || isSaving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {meta.name}
                        </span>
                        <Badge
                          variant={isOpen ? 'success' : 'neutral'}
                          size="sm"
                          dot
                        >
                          {isOpen ? 'Abierto' : 'Cerrado'}
                        </Badge>
                      </div>

                      {isOpen && durationLabel && (
                        <span className="text-[11px] text-slate-400">
                          {durationLabel} de atención
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Time Selectors (when open) or Closed label */}
                  {isOpen ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        {/* Open Time */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Apertura
                          </span>
                          <input
                            type="time"
                            value={openTime}
                            onChange={(e) =>
                              handleTimeChange(meta.day, 'open_time', e.target.value)
                            }
                            disabled={!isOwnerOrAdmin || isSaving}
                            className={`px-3 py-1.5 rounded-xl bg-surface-900 border text-xs font-mono text-white focus:outline-none focus:border-brand-500 transition-colors ${
                              dayError ? 'border-rose-500' : 'border-white/10'
                            }`}
                          />
                        </div>

                        <span className="text-slate-500 pt-4">—</span>

                        {/* Close Time */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Cierre
                          </span>
                          <input
                            type="time"
                            value={closeTime}
                            onChange={(e) =>
                              handleTimeChange(meta.day, 'close_time', e.target.value)
                            }
                            disabled={!isOwnerOrAdmin || isSaving}
                            className={`px-3 py-1.5 rounded-xl bg-surface-900 border text-xs font-mono text-white focus:outline-none focus:border-brand-500 transition-colors ${
                              dayError ? 'border-rose-500' : 'border-white/10'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Error text if open_time >= close_time */}
                      {dayError && (
                        <div className="text-[11px] text-rose-400 font-medium flex items-center gap-1 sm:ml-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{dayError}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic py-2">
                      <CalendarX className="w-4 h-4 text-slate-600" />
                      <span>Cerrado todo el día (sin turnos disponibles)</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bottom Save Bar (Sticky on Mobile/Desktop when unsaved changes exist) */}
      {isOwnerOrAdmin && hasUnsavedChanges && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-900/80 via-surface-900 to-brand-900/80 border border-brand-500/40 shadow-brand-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2 text-xs text-white">
            <Info className="w-4 h-4 text-brand-400 shrink-0" />
            <span>
              Tienes modificaciones pendientes en el horario semanal. Recuerda guardar para actualizar la disponibilidad de reservas.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadHours}
              disabled={isSaving}
              className="text-xs"
            >
              Descartar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={hasErrors}
              className="shadow-brand-md text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      )}

      {/* ARCHITECTURAL EXTENSION POINT: Holidays, Vacations & Special Hours (Prepared for next iteration) */}
      <Card variant="glass" className="p-6 border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-semibold">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Arquitectura Modular Preparada</span>
            </div>
            <h4 className="text-sm font-bold text-white">
              Próximamente: Feriados, Vacaciones & Fechas Especiales
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              La base de datos y la arquitectura multi-tenant de TurnosYa están listas para superponer reglas y excepciones al horario estándar semanal sin romper la consistencia.
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-surface-900 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
              <span>Feriados Nacionales</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cierre automático del calendario en días feriados oficiales.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-900 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Palmtree className="w-3.5 h-3.5 text-emerald-400" />
              <span>Períodos de Vacaciones</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Bloqueo de rangos de fechas por receso anual del negocio.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-900 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <CalendarDays className="w-3.5 h-3.5 text-brand-400" />
              <span>Horarios Extendidos</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Apertura especial en vísperas de fiesta o temporadas de alta demanda.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-900 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <CalendarX className="w-3.5 h-3.5 text-rose-400" />
              <span>Cierres Extraordinarios</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cierres imprevistos por remodelación, capacitación o eventos.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
