import React from 'react'
import { Staff } from '@/features/staff/types'
import { User, Users, Check, ArrowLeft } from 'lucide-react'

interface BookingStepStaffProps {
  staffList: Staff[]
  selectedStaff: Staff | null
  onSelectStaff: (staff: Staff | null) => void
  onNext: () => void
  onBack: () => void
}

export const BookingStepStaff: React.FC<BookingStepStaffProps> = ({
  staffList,
  selectedStaff,
  onSelectStaff,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <User className="w-5 h-5 text-brand-400" />
          2. Selecciona tu Barbero / Profesional
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Puedes elegir a tu profesional favorito o permitir que el sistema asigne el primer turno disponible.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option 1: Any available staff */}
        <div
          onClick={() => onSelectStaff(null)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            selectedStaff === null
              ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30'
              : 'bg-surface-dark border-white/10 text-slate-300 hover:border-brand-500/40 hover:bg-surface-elevated/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">Cualquier Profesional</p>
              <p className="text-xs text-slate-400">Mayor disponibilidad de horarios</p>
            </div>
          </div>

          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
              selectedStaff === null
                ? 'bg-brand-500 border-brand-400 text-white'
                : 'border-white/20 bg-surface-elevated'
            }`}
          >
            {selectedStaff === null && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Option 2: Specific staff members */}
        {staffList.map((st) => {
          const isSelected = selectedStaff?.id === st.id

          return (
            <div
              key={st.id}
              onClick={() => onSelectStaff(st)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30'
                  : 'bg-surface-dark border-white/10 text-slate-300 hover:border-brand-500/40 hover:bg-surface-elevated/70'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-brand-400/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-extrabold text-base flex-shrink-0 overflow-hidden">
                  {st.avatar_url ? (
                    <img
                      src={st.avatar_url}
                      alt={st.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    st.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="truncate">
                  <p className="font-bold text-sm text-white truncate">{st.name}</p>
                  <p className="text-xs text-slate-400">Especialista</p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                  isSelected
                    ? 'bg-brand-500 border-brand-400 text-white'
                    : 'border-white/20 bg-surface-elevated'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Servicio</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
        >
          <span>Elegir Horario</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}
