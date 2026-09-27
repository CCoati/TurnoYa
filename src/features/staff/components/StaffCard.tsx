import React from 'react'
import { Staff } from '../types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Phone,
  Eye,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  Power,
} from 'lucide-react'

interface StaffCardProps {
  staff: Staff
  isOwnerOrAdmin: boolean
  onEdit: (staff: Staff) => void
  onViewDetail: (staff: Staff) => void
  onToggleActive: (staff: Staff) => void
  onDelete: (staff: Staff) => void
  isToggling?: boolean
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  isOwnerOrAdmin,
  onEdit,
  onViewDetail,
  onToggleActive,
  onDelete,
  isToggling = false,
}) => {
  const cleanPhone = staff.phone ? staff.phone.replace(/[^0-9]/g, '') : null

  return (
    <Card
      variant="default"
      className={`group relative overflow-hidden transition-all duration-300 border ${
        staff.active
          ? 'border-white/10 hover:border-brand-500/40 hover:shadow-brand-sm'
          : 'border-white/5 opacity-75 hover:opacity-100 hover:border-white/20'
      }`}
    >
      {/* Subtle top accent gradient */}
      <div
        className={`h-1.5 w-full transition-colors ${
          staff.active
            ? 'bg-gradient-to-r from-brand-500 to-accent-indigo'
            : 'bg-slate-700'
        }`}
      />

      <div className="p-5 space-y-4">
        {/* Top Header: Avatar + Status Badge + Quick Toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="relative">
            <Avatar
              src={staff.avatar_url || undefined}
              name={staff.name}
              size="lg"
              status={staff.active ? 'online' : 'offline'}
            />
            {staff.active && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-surface-900"></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={staff.active ? 'success' : 'neutral'}
              size="sm"
              dot
            >
              {staff.active ? 'Activo' : 'Inactivo'}
            </Badge>

            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => onToggleActive(staff)}
                disabled={isToggling}
                title={staff.active ? 'Desactivar barbero' : 'Activar barbero'}
                className={`p-1.5 rounded-lg border transition-all ${
                  staff.active
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/10 border-white/10'
                } disabled:opacity-50`}
              >
                <Power className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Name and Basic Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors truncate">
              {staff.name}
            </h3>
          </div>

          {/* Phone */}
          {staff.phone ? (
            <a
              href={cleanPhone ? `tel:${cleanPhone}` : undefined}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-brand-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{staff.phone}</span>
            </a>
          ) : (
            <p className="text-xs text-slate-500 italic">Sin teléfono registrado</p>
          )}
        </div>

        {/* Supabase Auth Link Indicator */}
        <div className="pt-2 border-t border-white/5">
          {staff.profile || staff.user_id ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-medium w-full">
              <UserCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="truncate">
                Cuenta TurnosYa: {staff.profile?.full_name || 'Vinculada'}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-slate-400 text-[11px] font-medium w-full">
              <UserX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Colaborador local (sin cuenta)</span>
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(staff)}
            className="text-xs text-slate-300 hover:text-white px-2.5 h-8 flex-1"
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Detalle
          </Button>

          {isOwnerOrAdmin && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(staff)}
                className="text-xs px-2.5 h-8 flex-1"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1 text-brand-400" />
                Editar
              </Button>

              <button
                type="button"
                onClick={() => onDelete(staff)}
                title="Eliminar profesional"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors h-8 w-8 flex items-center justify-center shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
