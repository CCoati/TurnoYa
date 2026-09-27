import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from './AuthContext'
import { useBusinessContext } from '@/features/businesses/BusinessContext'
import {
  User,
  Mail,
  Phone,
  Store,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
} from 'lucide-react'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenCreateBusiness?: () => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateBusiness,
}) => {
  const { user, profile, signOut, updatePassword } = useAuth()
  const {
    activeBusiness,
    availableBusinesses,
    activeMembership,
    setActiveBusinessId,
  } = useBusinessContext()

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<{ success?: string; error?: string } | null>(null)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordStatus(null)
    if (newPassword.length < 6) {
      setPasswordStatus({ error: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: 'Las contraseñas no coinciden' })
      return
    }

    setIsSubmittingPassword(true)
    try {
      const res = await updatePassword(newPassword)
      if (res.success) {
        setPasswordStatus({ success: 'Contraseña actualizada con éxito' })
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setIsChangingPassword(false), 1500)
      } else {
        setPasswordStatus({ error: res.error || 'Error al actualizar contraseña' })
      }
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Avatar name={profile?.full_name || user?.email || 'Usuario'} size="md" status="online" />
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {profile?.full_name || 'Mi Perfil'}
            </h3>
            <span className="text-xs text-slate-400">{user?.email}</span>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-6">
        {/* User Info Overview */}
        <div className="p-4 rounded-xl bg-surface-900 border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-400" />
              Nombre
            </span>
            <span className="font-semibold text-slate-200">
              {profile?.full_name || 'Sin nombre asignado'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-400" />
              Email
            </span>
            <span className="font-mono text-slate-200">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              Teléfono
            </span>
            <span className="text-slate-200">{profile?.phone || 'No registrado'}</span>
          </div>
        </div>

        {/* Business Context & Multi-Tenant Memberships */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tus Negocios ({availableBusinesses.length})
              </h4>
            </div>
            {onOpenCreateBusiness && (
              <Button
                variant="ghost"
                size="sm"
                className="text-brand-400 hover:text-brand-300 text-xs h-7 px-2"
                onClick={() => {
                  onClose()
                  onOpenCreateBusiness()
                }}
              >
                + Nuevo Negocio
              </Button>
            )}
          </div>

          {availableBusinesses.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center space-y-2">
              <Store className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                Aún no eres miembro de ningún negocio en TurnosYa.
              </p>
              {onOpenCreateBusiness && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onOpenCreateBusiness()
                  }}
                >
                  Registrar mi primer Negocio
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {availableBusinesses.map(biz => {
                const isActive = activeBusiness?.id === biz.id
                return (
                  <div
                    key={biz.id}
                    onClick={() => setActiveBusinessId(biz.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-brand-600/15 border-brand-500/40 text-white'
                        : 'bg-surface-800/40 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/10 flex items-center justify-center font-bold text-xs text-brand-400">
                        {biz.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{biz.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">/{biz.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <Badge variant="brand" size="sm">
                          Activo
                        </Badge>
                      )}
                      {activeMembership?.role && isActive && (
                        <Badge variant="neutral" size="sm">
                          {activeMembership.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Password Change Accordion */}
        <div className="pt-2 border-t border-white/10">
          {!isChangingPassword ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsChangingPassword(true)}
              className="w-full justify-center"
            >
              <KeyRound className="w-3.5 h-3.5 mr-2 text-slate-400" />
              Cambiar Contraseña
            </Button>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-3 p-3.5 rounded-xl bg-surface-900 border border-white/10">
              <h5 className="text-xs font-bold text-slate-200">Cambiar Contraseña</h5>

              {passwordStatus?.error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{passwordStatus.error}</span>
                </div>
              )}

              {passwordStatus?.success && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{passwordStatus.success}</span>
                </div>
              )}

              <Input
                type="password"
                placeholder="Nueva Contraseña (mínimo 6)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Confirmar Contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingPassword}
                  className="flex-1"
                >
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sesión protegida por Supabase Auth</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </Modal>
  )
}
