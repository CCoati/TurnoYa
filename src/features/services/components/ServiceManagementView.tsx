import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Service, POPULAR_SERVICE_TEMPLATES } from '../types'
import { ServiceCard } from './ServiceCard'
import { ServiceFormModal } from './ServiceFormModal'
import { ServiceDeleteModal } from './ServiceDeleteModal'
import { serviceService } from '@/services/serviceService'
import { useBusinessContext } from '@/features/businesses/BusinessContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Briefcase,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

export const ServiceManagementView: React.FC = () => {
  const { activeBusiness, activeMembership } = useBusinessContext()

  // Permissions check
  const isOwnerOrAdmin =
    activeMembership?.role === 'owner' || activeMembership?.role === 'admin'

  // Data state
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const [deleteCandidate, setDeleteCandidate] = useState<Service | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Load services strictly for active business
  const loadServices = useCallback(async () => {
    if (!activeBusiness?.id) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await serviceService.getServices(activeBusiness.id)
    if (res.success && res.data) {
      setServices(res.data)
    } else {
      setErrorMessage(res.error || 'No se pudo cargar el catálogo de servicios.')
    }
    setIsLoading(false)
  }, [activeBusiness?.id])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successToast])

  // Fast toggle active/inactive
  const handleToggleActive = async (service: Service) => {
    if (!activeBusiness?.id || !isOwnerOrAdmin) return

    setTogglingId(service.id)
    const newActiveState = !service.active

    const res = await serviceService.toggleServiceActive(
      activeBusiness.id,
      service.id,
      newActiveState
    )

    setTogglingId(null)

    if (res.success && res.data) {
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? res.data! : s))
      )
      setSuccessToast(
        `Servicio "${service.name}" ${newActiveState ? 'activado' : 'desactivado'}.`
      )
    } else {
      setErrorMessage(res.error || 'Error al cambiar estado del servicio.')
    }
  }

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingService(null)
    setIsFormModalOpen(true)
  }

  // Handle open edit modal
  const handleOpenEdit = (service: Service) => {
    setEditingService(service)
    setIsFormModalOpen(true)
  }

  // Callback when created or updated
  const handleSavedService = (savedService: Service, isNew: boolean) => {
    if (isNew) {
      setServices((prev) => [...prev, savedService])
      setSuccessToast(`¡Servicio "${savedService.name}" creado con éxito!`)
    } else {
      setServices((prev) =>
        prev.map((s) => (s.id === savedService.id ? savedService : s))
      )
      setSuccessToast(`Servicio "${savedService.name}" actualizado.`)
    }
  }

  // Callback when deleted (hard or soft)
  const handleDeletedService = (serviceId: string, softDeleted: boolean) => {
    if (softDeleted) {
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, active: false } : s))
      )
      setSuccessToast('Servicio desactivado de forma segura (Soft Delete).')
    } else {
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      setSuccessToast('Servicio eliminado definitivamente.')
    }
    setDeleteCandidate(null)
  }

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Status filter
      if (statusFilter === 'active' && !s.active) return false
      if (statusFilter === 'inactive' && s.active) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = s.name.toLowerCase().includes(query)
        const matchesDesc = s.description ? s.description.toLowerCase().includes(query) : false
        return matchesName || matchesDesc
      }

      return true
    })
  }, [services, statusFilter, searchQuery])

  // Counters
  const totalCount = services.length
  const activeCount = services.filter((s) => s.active).length
  const inactiveCount = services.filter((s) => !s.active).length

  if (!activeBusiness) {
    return (
      <Card variant="glass" className="p-8 text-center border-brand-500/20">
        <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Selecciona un Negocio</h3>
        <p className="text-xs text-slate-400">
          Debes seleccionar o crear un negocio para gestionar su catálogo de servicios.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-sm text-emerald-300 animate-slide-down">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-sm text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadServices} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Catálogo de Servicios
              </h2>
              <p className="text-xs text-slate-400">
                Servicios disponibles para clientes de{' '}
                <span className="text-brand-300 font-semibold">{activeBusiness.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Role Indicator */}
        <div className="flex items-center gap-3">
          {!isOwnerOrAdmin && (
            <Badge variant="warning" size="sm">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Solo Lectura
            </Badge>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={loadServices}
            disabled={isLoading}
            title="Recargar servicios"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {isOwnerOrAdmin && (
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreate}
              className="shadow-brand-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          )}
        </div>
      </div>

      {/* Counters & Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-950 border border-white/5 self-start md:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-brand-600 text-white shadow-brand-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'inactive'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Inactivos ({inactiveCount})
          </button>
        </div>
      </div>

      {/* 4 STATES */}

      {/* 1. LOADING STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <Card key={n} variant="default" className="p-5 border-white/5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-28 h-5 rounded bg-surface-800" />
                <div className="w-16 h-5 rounded-full bg-surface-800" />
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 rounded bg-surface-800" />
                <div className="w-2/3 h-3 rounded bg-surface-800" />
              </div>
              <div className="p-3 rounded-xl bg-surface-800 h-14" />
              <div className="pt-3 border-t border-white/5 flex gap-2">
                <div className="flex-1 h-8 rounded bg-surface-800" />
                <div className="w-8 h-8 rounded bg-surface-800" />
              </div>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        /* 2. EMPTY STATE */
        <Card variant="glass" className="py-14 px-6 text-center border-brand-500/20 max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              Aún no tienes servicios configurados
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Crea tu catálogo con duraciones exactas en minutos y precios. Tus clientes podrán seleccionar estos servicios al solicitar un turno.
            </p>
          </div>

          {isOwnerOrAdmin && (
            <div className="space-y-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOpenCreate}
                className="shadow-brand-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Mi Primer Servicio
              </Button>

              <div className="pt-4 border-t border-white/10">
                <p className="text-[11px] text-slate-400 mb-2">O crea a partir de una plantilla:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_SERVICE_TEMPLATES.slice(0, 3).map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => {
                        setEditingService({
                          id: '',
                          business_id: activeBusiness.id,
                          name: tpl.name,
                          description: tpl.description,
                          duration_minutes: tpl.duration_minutes,
                          price: tpl.price,
                          active: true,
                          created_at: '',
                          updated_at: '',
                        })
                        setIsFormModalOpen(true)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface-900 border border-white/10 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-brand-400" />
                      <span>{tpl.name} ({tpl.duration_minutes}m · ${tpl.price})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : filteredServices.length === 0 ? (
        /* 3. FILTER EMPTY STATE */
        <Card variant="default" className="py-12 px-6 text-center border-white/5">
          <Filter className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-white mb-1">
            No se encontraron servicios
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            No hay ningún servicio que coincida con los filtros seleccionados.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
          >
            Limpiar Filtros
          </Button>
        </Card>
      ) : (
        /* 4. SUCCESS / DATA GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isOwnerOrAdmin={isOwnerOrAdmin}
              onEdit={handleOpenEdit}
              onToggleActive={handleToggleActive}
              onDelete={(s) => setDeleteCandidate(s)}
              isToggling={togglingId === service.id}
            />
          ))}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <ServiceFormModal
        isOpen={isFormModalOpen}
        service={editingService}
        businessId={activeBusiness.id}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={handleSavedService}
      />

      {/* Safe Delete Modal */}
      <ServiceDeleteModal
        isOpen={!!deleteCandidate}
        service={deleteCandidate}
        businessId={activeBusiness.id}
        onClose={() => setDeleteCandidate(null)}
        onDeleted={handleDeletedService}
      />
    </div>
  )
}
