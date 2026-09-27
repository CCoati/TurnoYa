import React from 'react'
import { Staff } from '../types'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Phone,
  Calendar,
  Clock,
  UserX,
  UserCheck,
  Edit3,
  Power,
  MessageSquare,
  Key,
} from 'lucide-react'

interface StaffDetailModalProps {
  isOpen: boolean
  staff: Staff | null
  onClose: () => void
  onEdit: (staff: Staff) => void
  onToggleActive: (staff: Staff) => void
  isOwnerOrAdmin: boolean
}

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  isOpen,
  staff,
  onClose,
  onEdit,
  onToggleActive,
  isOwnerOrAdmin,
}) => {
  if (!staff) return null

  const cleanPhone = staff.phone ? staff.phone.replace(/[^0-9]/g, '') : null
  const formattedCreated = staff.created_at
    ? new Date(staff.created_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'
  const formattedUpdated = staff.updated_at
    ? new Date(staff.updated_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha del Profesional"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          {isOwnerOrAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant={staff.active ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onToggleActive(staff)}
              >
                <Power className="w-3.5 h-3.5 mr-1.5" />
                {staff.active ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose()
                  onEdit(staff)
                }}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Editar Datos
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="p-5 rounded-2xl bg-surface-900 border border-white/10 flex items-center gap-4">
          <Avatar
            src={staff.avatar_url || undefined}
            name={staff.name}
            size="xl"
            status={staff.active ? 'online' : 'offline'}
          />

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white truncate">{staff.name}</h3>
              <Badge variant={staff.active ? 'success' : 'neutral'} size="sm" dot>
                {staff.active ? 'Disponible para turnos' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-xs text-brand-400 font-medium">Colaborador / Barbero</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-4 rounded-xl bg-surface-800/40 border border-white/5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Información de Contacto
          </h4>

          <div className="flex items-center justify-between py-1.5 border-b border-white/5">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Teléfono:
            </span>
            {staff.phone ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white">{staff.phone}</span>
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                  >
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">No especificado</span>
            )}
          </div>
        </div>

        {/* Supabase Auth Connection Section */}
        <div className="p-4 rounded-xl bg-surface-800/40 border border-white/5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-brand-400" />
            Acceso & Usuario de TurnosYa
          </h4>

          {staff.profile || staff.user_id ? (
            <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 space-y-2">
              <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold">
                <UserCheck className="w-4 h-4 text-brand-400" />
                <span>Vinculado con cuenta de usuario Supabase Auth</span>
              </div>
              <p className="text-xs text-slate-300">
                Nombre de perfil: <span className="text-white font-medium">{staff.profile?.full_name || 'Usuario'}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Este barbero puede iniciar sesión en TurnosYa y sus permisos operativos se rigen según su rol en este negocio.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-surface-900 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                <UserX className="w-4 h-4 text-slate-400" />
                <span>Colaborador local sin usuario vinculado</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este colaborador está registrado para la asignación de citas y turnos en tu panel. Próximamente podrás invitarlo por correo electrónico para que gestione su propia agenda.
              </p>
            </div>
          )}
        </div>

        {/* Database Audit / Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 bg-surface-900/50 p-3 rounded-xl border border-white/5">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500">Fecha de alta:</span>
            <p className="text-white font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              {formattedCreated}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500">Última actualización:</span>
            <p className="text-white font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              {formattedUpdated}
            </p>
          </div>
          <div className="col-span-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-slate-500 font-mono">
              ID PostgreSQL: {staff.id}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
