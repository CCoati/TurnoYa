import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { useBusinessContext } from './BusinessContext'
import {
  Scissors,
  Sparkles,
  HeartHandshake,
  Crown,
  Flower2,
  Briefcase,
  Store,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building2,
  Globe,
} from 'lucide-react'

export interface BusinessCategoryOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  popular?: boolean
}

interface BusinessOnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (businessId: string) => void
}

const CATEGORIES: BusinessCategoryOption[] = [
  {
    id: 'barbershop',
    title: 'Barbería',
    description: 'Cortes clásicos, degradados, afeitados y perfilado de barba',
    icon: <Scissors className="w-5 h-5 text-brand-400" />,
    popular: true,
  },
  {
    id: 'hair_salon',
    title: 'Peluquería',
    description: 'Cortes unisex, coloración, peinados y tratamientos capilares',
    icon: <Sparkles className="w-5 h-5 text-pink-400" />,
  },
  {
    id: 'aesthetics',
    title: 'Estética',
    description: 'Limpiezas faciales, depilación, cejas, pestañas y cuidado corporal',
    icon: <HeartHandshake className="w-5 h-5 text-purple-400" />,
  },
  {
    id: 'beauty_salon',
    title: 'Centro de Belleza',
    description: 'Servicios integrales de belleza, manicuría, spa y maquillaje',
    icon: <Crown className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'spa_wellness',
    title: 'Spa & Bienestar',
    description: 'Masajes relajantes, descontracturantes, sauna y holística',
    icon: <Flower2 className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'other',
    title: 'Otros Negocios de Turnos',
    description: 'Profesionales, consultorios, veterinarias o entrenamientos',
    icon: <Briefcase className="w-5 h-5 text-sky-400" />,
  },
]

const DAYS_OF_WEEK = [
  { day: 1, label: 'Lun' },
  { day: 2, label: 'Mar' },
  { day: 3, label: 'Mié' },
  { day: 4, label: 'Jue' },
  { day: 5, label: 'Vie' },
  { day: 6, label: 'Sáb' },
  { day: 0, label: 'Dom' },
]

export const BusinessOnboardingWizard: React.FC<BusinessOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshMemberships } = useAuth()
  const { setActiveBusinessId } = useBusinessContext()

  // Wizard Step: 1 to 6
  const [step, setStep] = useState<number>(1)

  // Step 1: Nombre & Slug
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  // Step 2: Tipo de Negocio
  const [category, setCategory] = useState('barbershop')

  // Step 3: Teléfono
  const [phone, setPhone] = useState('')

  // Step 4: Dirección
  const [address, setAddress] = useState('')
  const [hasNoPhysicalStore, setHasNoPhysicalStore] = useState(false)

  // Step 5: Configuración Inicial de Horarios y Reservas
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5, 6]) // Lun a Sáb
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('20:00')
  const [bookingEnabled, setBookingEnabled] = useState(true)

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Automatic clean slug generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    const cleaned = val
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(cleaned)
  }

  const toggleDay = (dayNum: number) => {
    if (openDays.includes(dayNum)) {
      if (openDays.length === 1) return // Keep at least one day
      setOpenDays(openDays.filter(d => d !== dayNum))
    } else {
      setOpenDays([...openDays, dayNum].sort())
    }
  }

  // Step validation
  const validateCurrentStep = (): boolean => {
    setErrorMessage(null)
    if (step === 1) {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMessage('Por favor ingresa un nombre para el negocio (mínimo 2 caracteres).')
        return false
      }
      if (!slug.trim() || slug.trim().length < 2) {
        setErrorMessage('El identificador web (slug) es obligatorio y debe tener al menos 2 caracteres.')
        return false
      }
    } else if (step === 2) {
      if (!category) {
        setErrorMessage('Por favor selecciona el tipo de negocio.')
        return false
      }
    } else if (step === 5) {
      if (openDays.length === 0) {
        setErrorMessage('Debes seleccionar al menos un día de atención semanal.')
        return false
      }
      if (openTime >= closeTime) {
        setErrorMessage('La hora de cierre debe ser posterior a la hora de apertura.')
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(prev => Math.min(prev + 1, 6))
    }
  }

  const prevStep = () => {
    setErrorMessage(null)
    setStep(prev => Math.max(prev - 1, 1))
  }

  // Step 6: Atomic Creation in PostgreSQL
  const handleCreateBusiness = async () => {
    if (!user) {
      setErrorMessage('Debes haber iniciado sesión para crear un negocio.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      // Call PostgreSQL atomic RPC function
      const { data, error } = await supabase.rpc('create_business_onboarding', {
        p_name: name.trim(),
        p_slug: slug.trim().toLowerCase(),
        p_category: category,
        p_phone: phone.trim() || null,
        p_address: hasNoPhysicalStore ? 'Atención a domicilio / Sin local fijo' : address.trim() || null,
        p_description: `Especialistas en ${CATEGORIES.find(c => c.id === category)?.title || 'servicios de turnos'}.`,
        p_timezone: 'America/Argentina/Buenos_Aires',
        p_currency: 'ARS',
        p_booking_enabled: bookingEnabled,
        p_open_time: `${openTime}:00`,
        p_close_time: `${closeTime}:00`,
        p_open_days: openDays,
      })

      if (error) {
        throw new Error(error.message)
      }

      const created = Array.isArray(data) ? data[0] : data
      if (!created || !created.id) {
        throw new Error('No se recibió la confirmación del negocio creado.')
      }

      setSuccessMessage(`¡${name} fue creado exitosamente con rol de Propietario!`)

      // Refresh memberships in AuthContext and switch active business
      await refreshMemberships()
      setActiveBusinessId(created.id)

      setTimeout(() => {
        onSuccess?.(created.id)
        onClose()
      }, 1200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al crear el negocio'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategoryObj = CATEGORIES.find(c => c.id === category)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Bienvenido a TurnosYa
              </h3>
              <p className="text-[11px] text-slate-400">Configuración de tu nuevo Negocio</p>
            </div>
          </div>
          <Badge variant="brand" size="sm">
            Paso {step} de 6
          </Badge>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 to-brand-300 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Global Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 1: Nombre del negocio & Slug Web                           */}
        {/* ============================================================== */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                ¿Cómo se llama tu negocio?
              </h4>
              <p className="text-xs text-slate-400">
                Este nombre aparecerá en tu agenda, en tus notificaciones y en tu página web de reservas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre Comercial <span className="text-rose-400">*</span>
              </label>
              <Input
                value={name}
                onChange={handleNameChange}
                placeholder="Ej. Barbería Roma / Peluquería Glamour / Estética Bella"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Identificador web exclusivo (Slug) <span className="text-rose-400">*</span>
              </label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase())}
                placeholder="mi-negocio"
                leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
                required
              />
              <div className="mt-1.5 p-2.5 rounded-xl bg-surface-900 border border-white/5 flex items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500 font-mono">Link público:</span>
                <span className="font-mono text-brand-300 font-semibold truncate">
                  turnosya.com/{slug || 'tu-negocio'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 2: Tipo de Negocio                                        */}
        {/* ============================================================== */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                ¿A qué rubro pertenece tu negocio?
              </h4>
              <p className="text-xs text-slate-400">
                Selecciona la categoría principal. Podrás agregar más servicios y personalizarlos en cualquier momento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 shadow-brand-sm text-white'
                        : 'bg-surface-900/60 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-surface-800 border border-white/5 shrink-0 mt-0.5">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white">{cat.title}</span>
                        {cat.popular && (
                          <Badge variant="brand" size="sm">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 3: Teléfono / WhatsApp de contacto                        */}
        {/* ============================================================== */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Teléfono o WhatsApp de atención
              </h4>
              <p className="text-xs text-slate-400">
                Tus clientes podrán comunicarse y recibir recordatorios de turnos por WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número de Teléfono / WhatsApp <span className="text-slate-500">(Opcional)</span>
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 9 11 2345-6789"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                autoFocus
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Recomendamos incluir código de país y área (ej. +54 9 ...)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-900 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <span>
                Este teléfono se asociará exclusivamente a este negocio y nunca se compartirá con otros tenants.
              </span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 4: Dirección del Local                                    */}
        {/* ============================================================== */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                ¿Dónde se ubica tu negocio?
              </h4>
              <p className="text-xs text-slate-400">
                Indica la dirección física para que tus clientes sepan a dónde acudir a su cita.
              </p>
            </div>

            {!hasNoPhysicalStore && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dirección del Local / Sucursal
                </label>
                <Input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ej. Av. Corrientes 1450, CABA"
                  leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                  autoFocus
                />
              </div>
            )}

            <div className="pt-1">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasNoPhysicalStore}
                  onChange={e => {
                    setHasNoPhysicalStore(e.target.checked)
                    if (e.target.checked) setAddress('')
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-surface-800 text-brand-600 focus:ring-brand-500"
                />
                <span>Ofrezco atención a domicilio o servicios en línea (sin local físico)</span>
              </label>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 5: Configuración Inicial de Horarios & Reservas           */}
        {/* ============================================================== */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Horarios comerciales de atención
              </h4>
              <p className="text-xs text-slate-400">
                Configura los días y horarios habituales. Los slots de turnos se generarán dentro de este rango.
              </p>
            </div>

            {/* Días laborales */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Días de Apertura
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DAYS_OF_WEEK.map(d => {
                  const isOpen = openDays.includes(d.day)
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => toggleDay(d.day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isOpen
                          ? 'bg-brand-600 text-white shadow-brand-sm'
                          : 'bg-surface-800 text-slate-400 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Horario de Apertura y Cierre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hora de Apertura
                </label>
                <Input
                  type="time"
                  value={openTime}
                  onChange={e => setOpenTime(e.target.value)}
                  leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hora de Cierre
                </label>
                <Input
                  type="time"
                  value={closeTime}
                  onChange={e => setCloseTime(e.target.value)}
                  leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
                  required
                />
              </div>
            </div>

            {/* Toggle de Reservas Online */}
            <div className="p-3.5 rounded-xl bg-surface-900 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Habilitar Reservas Online</p>
                <p className="text-[11px] text-slate-400">
                  Permite a tus clientes reservar turnos desde el link público
                </p>
              </div>
              <input
                type="checkbox"
                checked={bookingEnabled}
                onChange={e => setBookingEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-surface-800 text-brand-600 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 6: Resumen y Confirmación Atómica                         */}
        {/* ============================================================== */}
        {step === 6 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Confirmar y Registrar Negocio
              </h4>
              <p className="text-xs text-slate-400">
                Revisa los datos antes de crear la estructura en PostgreSQL. Quedarás asignado automáticamente como <strong>Owner (Propietario)</strong>.
              </p>
            </div>

            {/* Preview Card */}
            <div className="p-4 rounded-2xl bg-surface-900 border border-brand-500/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-300 font-extrabold text-lg">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-white">{name}</h5>
                    <Badge variant="brand" size="sm">
                      {selectedCategoryObj?.title}
                    </Badge>
                  </div>
                  <p className="text-xs text-brand-300 font-mono">turnosya.com/{slug}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Tu Rol:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Propietario (Owner)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Teléfono:</span>
                  <span className="text-slate-200">{phone || 'No especificado'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Horario:</span>
                  <span className="text-slate-200">{openTime} a {closeTime} hs</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Días abiertos:</span>
                  <span className="text-slate-200">{openDays.length} días / semana</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-2.5 text-xs text-brand-300">
              <Building2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <span>
                Al confirmar, se creará el tenant en <code className="font-mono">businesses</code>, tu membresía como owner en <code className="font-mono">business_members</code>, los ajustes en <code className="font-mono">business_settings</code> y el calendario semanal en <code className="font-mono">business_hours</code> en una <strong>única transacción atómica</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Buttons Nav */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={prevStep}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Anterior
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}

          {step < 6 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={nextStep}
              className="shadow-brand-sm"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleCreateBusiness}
              isLoading={isSubmitting}
              className="shadow-brand-md"
            >
              Confirmar y Crear Negocio
              {!isSubmitting && <CheckCircle2 className="w-4 h-4 ml-1.5" />}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
