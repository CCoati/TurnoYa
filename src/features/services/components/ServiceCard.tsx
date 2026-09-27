import React from 'react'
import { Service } from '../types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Clock,
  DollarSign,
  Edit3,
  Trash2,
  Power,
} from 'lucide-react'

interface ServiceCardProps {
  service: Service
  isOwnerOrAdmin: boolean
  onEdit: (service: Service) => void
  onToggleActive: (service: Service) => void
  onDelete: (service: Service) => void
  isToggling?: boolean
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isOwnerOrAdmin,
  onEdit,
  onToggleActive,
  onDelete,
  isToggling = false,
}) => {
  // Format duration into readable text
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
  }

  // Format price
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(service.price)

  return (
    <Card
      variant="default"
      className={`group relative overflow-hidden transition-all duration-300 border flex flex-col justify-between ${
        service.active
          ? 'border-white/10 hover:border-brand-500/40 hover:shadow-brand-sm'
          : 'border-white/5 opacity-70 hover:opacity-90 hover:border-white/20'
      }`}
    >
      {/* Top accent line */}
      <div
        className={`h-1.5 w-full transition-colors ${
          service.active
            ? 'bg-gradient-to-r from-brand-500 via-accent-indigo to-emerald-500'
            : 'bg-slate-700'
        }`}
      />

      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Header: Name + Status Badge + Quick Toggle */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
              {service.name}
            </h3>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={service.active ? 'success' : 'neutral'} size="sm" dot>
                {service.active ? 'Activo' : 'Inactivo'}
              </Badge>

              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => onToggleActive(service)}
                  disabled={isToggling}
                  title={service.active ? 'Desactivar servicio' : 'Activar servicio'}
                  className={`p-1.5 rounded-lg border transition-all ${
                    service.active
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/10 border-white/10'
                  } disabled:opacity-50`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {service.description ? (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">Sin descripción</p>
          )}
        </div>

        {/* Highlights: Duration & Price */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-900 border border-white/5">
            {/* Duration */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-400" />
                Duración
              </span>
              <p className="text-sm font-bold text-white">
                {formatDuration(service.duration_minutes)}
              </p>
            </div>

            {/* Price */}
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-slate-400 font-medium flex items-center justify-end gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Precio
              </span>
              <p className="text-sm font-extrabold text-emerald-300">
                {formattedPrice}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isOwnerOrAdmin && (
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(service)}
              className="text-xs px-3 h-8 flex-1"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1 text-brand-400" />
              Editar
            </Button>

            <button
              type="button"
              onClick={() => onDelete(service)}
              title="Eliminar o desactivar servicio"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors h-8 w-8 flex items-center justify-center shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
