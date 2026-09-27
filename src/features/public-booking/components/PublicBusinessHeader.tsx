import React from 'react'
import { Business, BusinessHour } from '@/features/businesses/types'
import {
  MapPin,
  Phone,
  Clock,
  Scissors,
  CheckCircle,
} from 'lucide-react'

interface PublicBusinessHeaderProps {
  business: Business
  hours: BusinessHour[]
  onOpenHoursModal: () => void
}

export const PublicBusinessHeader: React.FC<PublicBusinessHeaderProps> = ({
  business,
  hours,
  onOpenHoursModal,
}) => {
  // Check if business is open today
  const todayDayOfWeek = new Date().getDay()
  const todayHours = hours.find((h) => h.day_of_week === todayDayOfWeek)
  const isOpenToday = todayHours ? todayHours.is_open : false

  const cleanPhone = business.phone ? business.phone.replace(/[^0-9]/g, '') : ''

  return (
    <header className="relative w-full overflow-hidden border-b border-white/10 bg-gradient-to-b from-surface-elevated/90 to-surface-dark/95 backdrop-blur-2xl">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-80 h-80 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top tiny bar with TurnosYa branding */}
      <div className="px-4 py-2 border-b border-white/5 bg-surface-darkest/50 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span>TurnosYa • Reserva Online Instantánea</span>
        </div>
        <span className="text-emerald-400 font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Disponibilidad en vivo
        </span>
      </div>

      {/* Main Business Banner */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          {/* Business Logo or Avatar */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-brand-400/20 border-2 border-brand-500/40 p-1 flex items-center justify-center shadow-xl shadow-brand-500/10 flex-shrink-0 overflow-hidden">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-surface-dark flex items-center justify-center font-extrabold text-2xl text-brand-300">
                  {business.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                <Scissors className="w-3 h-3" />
                {business.category === 'barbershop'
                  ? 'Barbería'
                  : business.category === 'hair_salon'
                  ? 'Peluquería'
                  : 'Estética & Belleza'}
              </span>

              {isOpenToday ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Abierto Hoy ({todayHours?.open_time?.slice(0, 5)} - {todayHours?.close_time?.slice(0, 5)})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Cerrado Hoy
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {business.name}
            </h1>

            {business.description && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2 sm:line-clamp-none leading-relaxed">
                {business.description}
              </p>
            )}

            {/* Address & Phone row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-5 text-xs text-slate-400 pt-1">
              {business.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                  <span>{business.address}</span>
                </div>
              )}

              {business.phone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{business.phone}</span>
                </a>
              )}

              <button
                type="button"
                onClick={onOpenHoursModal}
                className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors font-medium underline underline-offset-4"
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Ver Horarios</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
