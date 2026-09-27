import React, { useState, useEffect } from 'react'
import {
  Staff,
  CreateStaffInput,
  UpdateStaffInput,
  PRESET_AVATARS,
  BusinessMemberOption,
} from '../types'
import { staffService } from '@/services/staffService'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import {
  User,
  Phone,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Link2,
} from 'lucide-react'

interface StaffFormModalProps {
  isOpen: boolean
  staff: Staff | null
  businessId: string
  onClose: () => void
  onSaved: (savedStaff: Staff, isNew: boolean) => void
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  staff,
  businessId,
  onClose,
  onSaved,
}) => {
  const isEditing = !!staff

  // Form State
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [active, setActive] = useState<boolean>(true)
  const [userId, setUserId] = useState<string>('')
  const [isCustomAvatar, setIsCustomAvatar] = useState<boolean>(false)

  // Status & Validation
  const [eligibleMembers, setEligibleMembers] = useState<BusinessMemberOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Reset or populate fields when modal opens or staff changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null)
      if (staff) {
        setName(staff.name || '')
        setPhone(staff.phone || '')
        setAvatarUrl(staff.avatar_url || '')
        setActive(staff.active ?? true)
        setUserId(staff.user_id || '')
        // Check if avatar is one of the presets
        const isPreset = PRESET_AVATARS.some((p) => p.url === staff.avatar_url)
        setIsCustomAvatar(!isPreset && !!staff.avatar_url)
      } else {
        setName('')
        setPhone('')
        setAvatarUrl(PRESET_AVATARS[0].url)
        setActive(true)
        setUserId('')
        setIsCustomAvatar(false)
      }

      // Load eligible members for linking
      staffService.getEligibleMembersForLinking(businessId).then((res) => {
        if (res.success && res.data) {
          setEligibleMembers(res.data)
        }
      })
    }
  }, [isOpen, staff, businessId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validation
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('El nombre del barbero o profesional es obligatorio.')
      return
    }
    if (trimmedName.length < 2) {
      setErrorMessage('El nombre debe tener al menos 2 caracteres.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && staff) {
        // Update existing staff
        const updatePayload: UpdateStaffInput = {
          name: trimmedName,
          phone: phone.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          active,
          user_id: userId ? userId : null,
        }

        const res = await staffService.updateStaff(businessId, staff.id, updatePayload)
        if (!res.success || !res.data) {
          setErrorMessage(res.error || 'Error al actualizar el profesional.')
          return
        }

        onSaved(res.data, false)
        onClose()
      } else {
        // Create new staff
        const createPayload: CreateStaffInput = {
          business_id: businessId,
          name: trimmedName,
          phone: phone.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          active,
          user_id: userId ? userId : null,
        }

        const res = await staffService.createStaff(createPayload)
        if (!res.success || !res.data) {
          setErrorMessage(res.error || 'Error al registrar el profesional.')
          return
        }

        onSaved(res.data, true)
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al guardar el colaborador.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Barbero / Profesional' : 'Agregar Nuevo Barbero'}
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

        {/* 1. Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Nombre del profesional <span className="text-rose-400">*</span>
          </label>
          <Input
            placeholder="Ej. Mateo Rossi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            autoFocus
            required
          />
        </div>

        {/* 2. Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Teléfono de contacto (Opcional)
          </label>
          <Input
            placeholder="Ej. +54 9 11 9876-5432"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Utilizado para comunicaciones internas y notificaciones por WhatsApp.
          </p>
        </div>

        {/* 3. Avatar / Photo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Foto o Avatar del profesional
            </label>
            <button
              type="button"
              onClick={() => setIsCustomAvatar(!isCustomAvatar)}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              {isCustomAvatar ? 'Elegir avatar predeterminado' : 'Ingresar URL personalizada'}
            </button>
          </div>

          {/* Live Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-900 border border-white/5">
            <Avatar
              src={avatarUrl || undefined}
              name={name || 'Barbero'}
              size="lg"
              status={active ? 'online' : 'offline'}
            />
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-white block">
                {name.trim() || 'Nombre del Barbero'}
              </span>
              <span>Vista previa en la tarjeta de reserva</span>
            </div>
          </div>

          {/* Mode A: Preset Selection */}
          {!isCustomAvatar ? (
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.url
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatarUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 ${
                      isSelected
                        ? 'border-brand-500 shadow-brand-sm scale-105'
                        : 'border-transparent hover:border-white/30 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-white text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            /* Mode B: Custom URL input */
            <div>
              <Input
                placeholder="https://ejemplo.com/foto-barbero.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                leftIcon={<ImageIcon className="w-4 h-4 text-slate-400" />}
              />
            </div>
          )}
        </div>

        {/* 4. Active Status Toggle */}
        <div className="p-3.5 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white block">
              Estado operativo
            </span>
            <span className="text-[11px] text-slate-400">
              {active
                ? 'Disponible para recibir y agendar turnos.'
                : 'Pausado temporalmente (no aparecerá en reservas).'}
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

        {/* 5. Link with Supabase Auth user (Architecture preparation) */}
        <div className="p-3.5 rounded-xl bg-surface-900/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-brand-400" />
              Vincular con usuario de TurnosYa
            </label>
            <span className="text-[10px] text-brand-400 font-mono">Opcional</span>
          </div>

          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="">Sin vincular (Colaborador local sin cuenta de acceso)</option>
            {eligibleMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.full_name} ({member.role.toUpperCase()})
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Permite que un usuario registrado en el sistema quede asociado a este profesional para gestionar su propia agenda.
          </p>
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
            {isEditing ? 'Guardar Cambios' : 'Crear Barbero'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
