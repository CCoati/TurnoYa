import React from 'react'
import { Service } from '@/features/services/types'
import { Clock, Check, Scissors } from 'lucide-react'

interface BookingStepServiceProps {
  services: Service[]
  selectedService: Service | null
  onSelectService: (service: Service) => void
  onNext: () => void
}

export const BookingStepService: React.FC<BookingStepServiceProps> = ({
  services,
  selectedService,
  onSelectService,
  onNext,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Scissors className="w-5 h-5 text-brand-400" />
          1. Selecciona el Servicio
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Elige el corte o tratamiento que deseas realizarte.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-dark border border-dashed border-white/10 text-center">
          <Scissors className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No hay servicios disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id

            return (
              <div
                key={service.id}
                onClick={() => {
                  onSelectService(service)
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30'
                    : 'bg-surface-dark border-white/10 text-slate-300 hover:border-brand-500/40 hover:bg-surface-elevated/70'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{service.name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                      <Clock className="w-3 h-3 text-brand-400" />
                      {service.duration_minutes} min
                    </span>
                  </div>

                  {service.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-emerald-400">
                      ${service.price}
                    </span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-brand-500 border-brand-400 text-white'
                        : 'border-white/20 bg-surface-elevated'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedService && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Continuar con Barbero</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
