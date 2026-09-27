import React, { useState, useEffect } from 'react'
import {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
  POPULAR_SERVICE_TEMPLATES,
  ServiceTemplate,
} from '../types'
import { serviceService } from '@/services/serviceService'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  Briefcase,
  Clock,
  DollarSign,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

interface ServiceFormModalProps {
  isOpen: boolean
  service: Service | null
  businessId: string
  onClose: () => void
  onSaved: (savedService: Service, isNew: boolean) => void
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  service,
  businessId,
  onClose,
  onSaved,
}) => {
  const isEditing = !!service

  // Form states
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [price, setPrice] = useState<number>(500)
  const [active, setActive] = useState<boolean>(true)

  // Status & error
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Quick duration presets (in minutes)
  const durationPresets = [15, 30, 45, 60, 90, 120]

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null)
      if (service) {
        setName(service.name || '')
        setDescription(service.description || '')
        setDurationMinutes(service.duration_minutes || 30)
        setPrice(service.price || 0)
        setActive(service.active ?? true)
      } else {
        setName('')
        setDescription('')
        setDurationMinutes(30)
        setPrice(500)
        setActive(true)
      }
    }
  }, [isOpen, service])

  // Apply template
  const applyTemplate = (tpl: ServiceTemplate) => {
    setName(tpl.name)
    setDescription(tpl.description)
    setDurationMinutes(tpl.duration_minutes)
    setPrice(tpl.price)
  }

  // Format readable duration helper
  const getReadableDuration = (mins: number) => {
    if (!mins || mins <= 0) return '0 min'
    if (mins < 60) return `${mins} minutos`
    const hours = Math.floor(mins / 60)
    const rest = mins % 60
    return rest > 0 ? `${hours} h ${rest} min` : `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('El nombre del servicio es obligatorio.')
      return
    }
    if (trimmedName.length < 2) {
      setErrorMessage('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (!durationMinutes || durationMinutes <= 0) {
      setErrorMessage('La duración debe ser un número entero mayor a 0 minutos.')
      return
    }
    if (price < 0 || isNaN(price)) {
      setErrorMessage('El precio no puede ser negativo.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && service) {
        const updatePayload: UpdateServiceInput = {
          name: trimmedName,
          description: description.trim() || null,
          duration_minutes: Math.round(durationMinutes),
          price: Number(price),
          active,
        }

        const res = await serviceService.updateService(businessId, service.id, updatePayload)
        if (!res.success || !res.data) {
          setErrorMessage(res.error || 'Error al actualizar el servicio.')
          return
        }

        onSaved(res.data, false)
        onClose()
      } else {
        const createPayload: CreateServiceInput = {
          business_id: businessId,
          name: trimmedName,
          description: description.trim() || null,
          duration_minutes: Math.round(durationMinutes),
          price: Number(price),
          active,
        }

        const res = await serviceService.createService(createPayload)
        if (!res.success || !res.data) {
          setErrorMessage(res.error || 'Error al crear el servicio.')
          return
        }

        onSaved(res.data, true)
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al guardar el servicio.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Templates suggestions on Create */}
        {!isEditing && (
          <div className="space-y-2 p-3 rounded-xl bg-brand-500/5 border border-brand-500/15">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Plantillas rápidas de ejemplo:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {POPULAR_SERVICE_TEMPLATES.slice(0, 3).map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg bg-surface-900 border border-white/10 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span className="font-medium text-white">{tpl.name}</span>
                  <span className="text-[11px] text-brand-400 font-mono">
                    {tpl.duration_minutes}m · ${tpl.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1. Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Nombre del servicio <span className="text-rose-400">*</span>
          </label>
          <Input
            placeholder="Ej. Corte, Barba, Corte + Barba..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
            autoFocus
            required
          />
        </div>

        {/* 2. Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Descripción (Opcional)
          </label>
          <div className="relative">
            <textarea
              rows={2}
              placeholder="Detalla qué incluye el servicio, productos utilizados o recomendaciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* 3. Duration & Price (Side by side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Duración (minutos) <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-brand-400 font-medium">
                {getReadableDuration(durationMinutes)}
              </span>
            </div>

            <Input
              type="number"
              min={5}
              max={720}
              step={5}
              value={durationMinutes || ''}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
              required
            />

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {durationPresets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    durationMinutes === mins
                      ? 'bg-brand-600 text-white font-bold'
                      : 'bg-surface-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Precio <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-bold">
                ${price || 0}
              </span>
            </div>

            <Input
              type="number"
              min={0}
              step={50}
              value={price !== undefined ? price : ''}
              onChange={(e) => setPrice(Number(e.target.value))}
              leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
              required
            />

            {/* Price Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[350, 500, 750, 1000, 1500].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrice(p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    price === p
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-surface-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Active Status */}
        <div className="p-3.5 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white block">
              Estado del servicio
            </span>
            <span className="text-[11px] text-slate-400">
              {active
                ? 'Visible y disponible para reservas de clientes.'
                : 'Pausado (no aparecerá en el catálogo para nuevos turnos).'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="shadow-brand-md"
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
