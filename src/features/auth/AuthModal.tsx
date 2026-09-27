import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from './AuthContext'
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react'

export type AuthModalMode = 'login' | 'register' | 'forgot' | 'update_password'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: AuthModalMode
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const {
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    isPasswordRecovery,
    clearPasswordRecovery,
  } = useAuth()

  const [mode, setMode] = useState<AuthModalMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Switch to update_password mode if password recovery was detected
  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('update_password')
    } else {
      setMode(initialMode)
    }
  }, [initialMode, isPasswordRecovery])

  // Reset fields when opening modal or changing mode
  useEffect(() => {
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setErrorMessage('Por favor ingresa tu email y contraseña.')
          return
        }
        const res = await signIn({ email, password })
        if (!res.success) {
          setErrorMessage(res.error || 'Credenciales inválidas.')
        } else {
          onClose()
        }
      } else if (mode === 'register') {
        if (!fullName.trim()) {
          setErrorMessage('Por favor ingresa tu nombre completo.')
          return
        }
        if (!email.trim() || !password) {
          setErrorMessage('Email y contraseña requeridos.')
          return
        }
        if (password.length < 6) {
          setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
          return
        }

        const res = await signUp({
          email,
          password,
          fullName,
          phone: phone.trim() || undefined,
        })

        if (!res.success) {
          setErrorMessage(res.error || 'Error al crear la cuenta.')
        } else if (res.needsEmailVerification) {
          setSuccessMessage(
            '¡Cuenta creada exitosamente! Revisa tu correo electrónico para verificar tu cuenta e iniciar sesión.'
          )
        } else {
          setSuccessMessage('¡Cuenta creada y sesión iniciada exitosamente!')
          setTimeout(() => {
            onClose()
          }, 1000)
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMessage('Ingresa el correo asociado a tu cuenta.')
          return
        }
        const res = await resetPassword(email)
        if (!res.success) {
          setErrorMessage(res.error || 'Error al enviar enlace de recuperación.')
        } else {
          setSuccessMessage(
            'Te hemos enviado un correo con instrucciones para restablecer tu contraseña.'
          )
        }
      } else if (mode === 'update_password') {
        if (password.length < 6) {
          setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.')
          return
        }
        if (password !== confirmPassword) {
          setErrorMessage('Las contraseñas no coinciden.')
          return
        }
        const res = await updatePassword(password)
        if (!res.success) {
          setErrorMessage(res.error || 'Error al actualizar contraseña.')
        } else {
          setSuccessMessage('¡Contraseña actualizada con éxito!')
          clearPasswordRecovery()
          setTimeout(() => {
            onClose()
          }, 1200)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Iniciar Sesión'
      case 'register':
        return 'Crear Cuenta'
      case 'forgot':
        return 'Recuperar Contraseña'
      case 'update_password':
        return 'Nueva Contraseña'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isPasswordRecovery) clearPasswordRecovery()
        onClose()
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            {mode === 'update_password' ? <KeyRound className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">{getTitle()}</h3>
            <p className="text-xs text-slate-400">TurnosYa Platform</p>
          </div>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Register-only fields */}
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre Completo <span className="text-rose-400">*</span>
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ej. Lucas Gómez"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Teléfono / WhatsApp <span className="text-slate-500">(Opcional)</span>
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 9 11 2345-6789"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </>
        )}

        {/* Email field (for login, register, forgot) */}
        {mode !== 'update_password' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico <span className="text-rose-400">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
              autoFocus={mode !== 'register'}
            />
          </div>
        )}

        {/* Password field (for login, register, update_password) */}
        {mode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {mode === 'update_password' ? 'Nueva Contraseña' : 'Contraseña'}{' '}
                <span className="text-rose-400">*</span>
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'register' && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Mínimo 6 caracteres
              </span>
            )}
          </div>
        )}

        {/* Confirm password field (update_password) */}
        {mode === 'update_password' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Confirmar Nueva Contraseña <span className="text-rose-400">*</span>
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center shadow-brand-md"
          >
            {mode === 'login' && 'Entrar a TurnosYa'}
            {mode === 'register' && 'Crear mi Cuenta'}
            {mode === 'forgot' && 'Enviar Enlace de Recuperación'}
            {mode === 'update_password' && 'Guardar Nueva Contraseña'}
            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>

        {/* Mode Switcher Links */}
        <div className="pt-3 border-t border-white/10 text-center text-xs text-slate-400">
          {mode === 'login' && (
            <p>
              ¿No tienes una cuenta aún?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4 ml-1"
              >
                Regístrate gratis
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4 ml-1"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'update_password') && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-slate-400 hover:text-white font-medium inline-flex items-center gap-1.5"
            >
              ← Volver a Iniciar Sesión
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
