import React, { useState } from 'react'
import {
  Button,
  Input,
  Select,
  Modal,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Avatar,
  Dropdown,
  Toast,
  LoadingSpinner,
} from '@/components/ui'
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Mail,
  User,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { brandTokens } from '@/styles/tokens'
import { useDisclosure } from '@/hooks/useDisclosure'
import { SupabaseConnectionTester } from '@/components/SupabaseConnectionTester'

export const DesignSystemPage: React.FC = () => {
  // Modal state
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useDisclosure(false)
  
  // Interactive state demos
  const [btnLoading, setBtnLoading] = useState(false)
  const [inputText, setInputText] = useState('')
  const [selectValue, setSelectValue] = useState('beauty')
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>>([
    {
      id: 'welcome',
      type: 'info',
      title: 'Sistema de Diseño Activo',
      message: 'Tokens y componentes construidos fielmente a la identidad del logo.',
    },
  ])

  const triggerToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString()
    const contentMap = {
      success: { title: 'Acción Exitosa', message: 'El turno fue reservado en 1 click.' },
      error: { title: 'Error de Validación', message: 'Revisa los campos obligatorios.' },
      warning: { title: 'Atención', message: 'El profesional tiene pocos cupos disponibles.' },
      info: { title: 'Información', message: 'SaaS Multi-Rubro listo para escalar.' },
    }
    setToasts((prev) => [...prev, { id, type, ...contentMap[type] }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-12">
      {/* Toast floating notifications overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>

      {/* Hero: Visual Identity & Logo Source Analysis */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-900 border border-white/10 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/30 text-xs text-brand-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Identidad Visual Extraída del Logo Original</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Turno<span className="text-transparent bg-clip-text bg-brand-gradient">Ya</span> Design System
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              Base de componentes desacoplados, escalables y centralizados para una plataforma SaaS multi-rubro de reservas. La estética, colores y estilo visual derivan directamente del isotipo y logotipo oficial.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                leftIcon={<Zap className="w-4 h-4" />}
                onClick={() => {
                  setBtnLoading(true)
                  setTimeout(() => setBtnLoading(false), 1200)
                }}
                isLoading={btnLoading}
              >
                Probar Acción Rápida
              </Button>
              <Button variant="secondary" onClick={openModal}>
                Abrir Modal Base
              </Button>
              <Button
                variant="outline"
                onClick={() => triggerToast('success')}
              >
                Lanzar Notificación Toast
              </Button>
            </div>
          </div>

          {/* Logo Showcase Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-950/70 border border-white/10 shadow-inner text-center">
            <img
              src="/logosinfondo.png"
              alt="TurnosYa Logo"
              className="max-h-28 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(124,58,237,0.5)] mb-3"
            />
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Logo Oficial TurnosYa
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              "Reservas en un click" • Púrpura eléctrico + Blanco puro + Lienzo Obsidiana
            </p>
          </div>
        </div>
      </section>

      {/* Supabase Client Integration & Health Check */}
      <section>
        <SupabaseConnectionTester />
      </section>

      {/* Brand Identity Extraction Report */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              1. Análisis e Identidad Visual del Logo
            </h2>
            <p className="text-sm text-slate-400">
              Parámetros visuales identificados y transferidos al sistema de tokens.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Colores Principales</span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-600 shadow-sm" />
                <span className="w-6 h-6 rounded-lg bg-brand-500 shadow-sm" />
                <span className="w-6 h-6 rounded-lg bg-indigo-500 shadow-sm" />
              </div>
              <p className="text-sm font-bold text-white">Electric Violet & Indigo</p>
              <p className="text-xs text-slate-400 leading-normal">
                {brandTokens.colors.primary.DEFAULT} / #8B5CF6 / #6366F1: Extraídos del degradado en "Ya", el checkmark y los anillos del calendario ({brandTokens.tagline}).
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lienzo y Fondo</span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-surface-darkest border border-white/10" />
                <span className="w-6 h-6 rounded-lg bg-surface-900 border border-white/10" />
                <span className="w-6 h-6 rounded-lg bg-white" />
              </div>
              <p className="text-sm font-bold text-white">Obsidiana Profunda & Blanco</p>
              <p className="text-xs text-slate-400 leading-normal">
                #06080E / #0E121E y #FFFFFF para contraste premium y máxima legibilidad de turnos y tarjetas.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Formas y Estilo</span>
              <div className="flex items-center gap-2 text-brand-400">
                <Calendar className="w-5 h-5" />
                <CheckCircle2 className="w-5 h-5" />
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-white">Bordes Suaves & Pills</p>
              <p className="text-xs text-slate-400 leading-normal">
                Esquinas redondeadas (12px a 24px), pastillas de velocidad horizontales y sutiles resplandores violetas.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personalidad de Marca</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="brand" size="sm">Velocidad</Badge>
                <Badge variant="neutral" size="sm">Confianza</Badge>
              </div>
              <p className="text-sm font-bold text-white">Ágil, Multi-Rubro & Moderno</p>
              <p className="text-xs text-slate-400 leading-normal">
                Transmite rapidez ("Ya", "en un click") y robustez tecnológica para cualquier tipo de negocio.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Component Gallery */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            2. Catálogo de Componentes Reutilizables
          </h2>
          <p className="text-sm text-slate-400">
            Los 10 componentes base construidos y listos para todas las características del SaaS.
          </p>
        </div>

        {/* Grid of Components Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Component: Button */}
          <Card>
            <CardHeader>
              <CardTitle>Button (Botones)</CardTitle>
              <CardDescription>Variantes estilizadas con el degradado de marca y feedback táctil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Brand</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">Small</Button>
                <Button size="md" variant="primary">Medium</Button>
                <Button size="lg" variant="primary">Large</Button>
                <Button variant="primary" isLoading>Cargando</Button>
                <Button variant="primary" disabled>Deshabilitado</Button>
              </div>
            </CardContent>
          </Card>

          {/* Component: Input & Select */}
          <Card>
            <CardHeader>
              <CardTitle>Input & Select (Formularios)</CardTitle>
              <CardDescription>Campos estandarizados con foco activo violeta y soporte de iconos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Búsqueda de Servicio o Turno"
                placeholder="Ej. Limpieza facial, Corte clásico, Consulta..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                helperText="Presiona enter para filtrar turnos disponibles."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Correo del Cliente"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Select
                  label="Rubro del Negocio"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  options={[
                    { value: 'beauty', label: 'Estética & Belleza' },
                    { value: 'health', label: 'Salud & Medicina' },
                    { value: 'sports', label: 'Deportes & Fitness' },
                    { value: 'professional', label: 'Servicios Profesionales' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Component: Badges & Avatars */}
          <Card>
            <CardHeader>
              <CardTitle>Badge & Avatar</CardTitle>
              <CardDescription>Píldoras de estado y representaciones de clientes y profesionales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Badges de Estado</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" dot>Confirmado</Badge>
                  <Badge variant="success" dot>Disponible</Badge>
                  <Badge variant="warning" dot>Pendiente</Badge>
                  <Badge variant="danger" dot>Cancelado</Badge>
                  <Badge variant="neutral">Finalizado</Badge>
                  <Badge variant="outline">Sin Asignar</Badge>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Avatares con Estado</span>
                <div className="flex items-center gap-4">
                  <Avatar name="Dr. Juan Pérez" status="online" size="lg" />
                  <Avatar name="Sofia Martinez" status="busy" size="md" />
                  <Avatar name="Lucas Barber" status="offline" size="sm" />
                  <Avatar name="Turnos Ya" size="xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component: Cards, Dropdown & LoadingSpinner */}
          <Card>
            <CardHeader>
              <CardTitle>Dropdown & LoadingSpinner</CardTitle>
              <CardDescription>Menús contextuales y retroalimentación de carga sincronizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Menú Desplegable</span>
                  <Dropdown
                    trigger={
                      <Button variant="secondary" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Opciones del Turno
                      </Button>
                    }
                    items={[
                      { id: '1', label: 'Ver detalles de cita', icon: <User className="w-4 h-4" /> },
                      { id: '2', label: 'Reprogramar horario', icon: <Clock className="w-4 h-4" /> },
                      { id: 'div-1', label: '', divider: true },
                      { id: '3', label: 'Cancelar turno', danger: true },
                    ]}
                  />
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Spinners de Carga</span>
                  <div className="flex items-center gap-3 text-brand-500">
                    <LoadingSpinner size="sm" />
                    <LoadingSpinner size="md" />
                    <LoadingSpinner size="lg" />
                  </div>
                </div>
              </div>

              {/* Toast Triggers */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Probar Notificaciones Toast</span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => triggerToast('success')}>Éxito</Button>
                  <Button size="sm" variant="outline" onClick={() => triggerToast('error')}>Error</Button>
                  <Button size="sm" variant="outline" onClick={() => triggerToast('warning')}>Alerta</Button>
                  <Button size="sm" variant="outline" onClick={() => triggerToast('info')}>Info</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Card Variants Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Variantes de Tarjetas (Card)</h2>
          <p className="text-sm text-slate-400">Contenedores estilizados para los diferentes módulos del SaaS.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Superficie sólida con bordes sutiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-300">
                Ideal para listados densos de información como listas de turnos o configuración general.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-slate-400">Estado: Estable</span>
            </CardFooter>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass Panel</CardTitle>
              <CardDescription>Efecto de desenfoque translúcido.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-300">
                Utilizado para elementos flotantes, headers y tarjetas destacadas de métricas.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="brand" size="sm">Glassmorphic</Badge>
            </CardFooter>
          </Card>

          <Card variant="interactive" onClick={openModal}>
            <CardHeader>
              <CardTitle className="text-brand-300 flex items-center justify-between">
                <span>Interactive Card</span>
                <Sparkles className="w-4 h-4 text-brand-400" />
              </CardTitle>
              <CardDescription>Hover glow violeta interactivo.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-300">
                Haz clic en esta tarjeta para abrir el componente Modal demostrando la integración.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-brand-400 font-semibold">Clic para abrir modal &rarr;</span>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Reusable Modal Component Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            Modal Base Reutilizable
          </span>
        }
        description="Componente listo para crear turnos, editar profesionales y gestionar negocios."
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                triggerToast('success')
                closeModal()
              }}
            >
              Confirmar Acción
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Este modal cuenta con bloqueo automático de scroll, cierre con tecla <kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-white/10 text-xs">Esc</kbd>, clic fuera del contenedor (backdrop), y soporte para footer dinámico.
          </p>
          <Input
            label="Ejemplo de campo en modal"
            placeholder="Nombre de la reserva o servicio..."
          />
        </div>
      </Modal>
    </div>
  )
}
