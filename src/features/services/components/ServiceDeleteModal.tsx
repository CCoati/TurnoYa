import React, { useState, useEffect } from 'react'
import { Service } from '../types'
import { serviceService } from '@/services/serviceService'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  AlertTriangle,
  ShieldCheck,
  Power,
  Trash2,
  RefreshCw,
} from 'lucide-react'

interface ServiceDeleteModalProps {
  isOpen: boolean
  service: Service | null
  businessId: string
  onClose: () => void
  onDeleted: (serviceId: string, softDeleted: boolean) => void
}

export const ServiceDeleteModal: React.FC<ServiceDeleteModalProps> = ({
  isOpen,
  service,
  businessId,
  onClose,
  onDeleted,
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && service) {
      setIsChecking(true)
      setErrorMessage(null)
      serviceService.checkAppointmentsCount(businessId, service.id).then((res) => {
        if (res.success && res.data !== null) {
          setAppointmentsCount(res.data)
        } else {
          setAppointmentsCount(0)
        }
        setIsChecking(false)
      })
    }
  }, [isOpen, service, businessId])

  if (!service) return null

  // Soft delete action
  const handleSoftDelete = async () => {
    setIsProcessing(true)
    setErrorMessage(null)

    const res = await serviceService.toggleServiceActive(businessId, service.id, false)
    setIsProcessing(false)

    if (res.success) {
      onDeleted(service.id, true)
      onClose()
    } else {
      setErrorMessage(res.error || 'No se pudo desactivar el servicio.')
    }
  }

  // Hard delete action (only when 0 appointments)
  const handleHardDelete = async () => {
    setIsProcessing(true)
    setErrorMessage(null)

    const res = await serviceService.deleteService(businessId, service.id, false)
    setIsProcessing(false)

    if (res.success) {
      onDeleted(service.id, res.data?.softDeleted ?? false)
      onClose()
    } else {
      setErrorMessage(res.error || 'No se pudo eliminar el servicio.')
    }
  }

  const hasHistoricalAppointments = appointmentsCount > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isProcessing && onClose()}
      title="Eliminar o Desactivar Servicio"
      size="md"
    >
      <div className="space-y-5">
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Loading check */}
        {isChecking ? (
          <div className="p-6 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">
              Analizando historial de citas y dependencias en la base de datos...
            </p>
          </div>
        ) : (
          <>
            {/* Service Summary Card */}
            <div className="p-4 rounded-xl bg-surface-900 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Servicio seleccionado
              </span>
              <h4 className="text-base font-bold text-white">{service.name}</h4>
              <p className="text-xs text-slate-400">
                Duración: <strong className="text-white">{service.duration_minutes} min</strong> — Precio: <strong className="text-emerald-400">${service.price}</strong>
              </p>
            </div>

            {/* Scenario A: Appointments exist -> Must Soft Delete */}
            {hasHistoricalAppointments ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-amber-300">
                      Tiene {appointmentsCount} turnos registrados
                    </h5>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      Este servicio no puede ser eliminado físicamente de la base de datos para no corromper el historial de citas de los clientes ni los balances contables.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-950/60 border border-amber-500/20 text-xs text-slate-300">
                  <span className="font-semibold text-white block mb-0.5">
                    Solución recomendada (Soft Delete):
                  </span>
                  Se cambiará su estado a <strong>Inactivo</strong>. Ya no aparecerá disponible para nuevos turnos ni para reservas públicas, pero conservará intacto todo el historial.
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    disabled={isProcessing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSoftDelete}
                    isLoading={isProcessing}
                    className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                  >
                    <Power className="w-3.5 h-3.5 mr-1.5" />
                    Desactivar Servicio (Soft Delete)
                  </Button>
                </div>
              </div>
            ) : (
              /* Scenario B: 0 appointments exist -> Can hard delete or soft delete */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h5 className="font-bold text-emerald-300 text-sm">
                      Sin turnos históricos asociados
                    </h5>
                    <p className="text-slate-300 leading-relaxed">
                      Este servicio no cuenta con ninguna cita registrada. Puedes eliminarlo físicamente sin riesgo de alterar registros.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSoftDelete}
                    isLoading={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    <Power className="w-3.5 h-3.5 mr-1.5" />
                    Solo Desactivar (Soft Delete)
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleHardDelete}
                    isLoading={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Eliminar Físicamente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
