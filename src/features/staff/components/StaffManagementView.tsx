import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Staff } from '../types'
import { StaffCard } from './StaffCard'
import { StaffFormModal } from './StaffFormModal'
import { StaffDetailModal } from './StaffDetailModal'
import { staffService } from '@/services/staffService'
import { useBusinessContext } from '@/features/businesses/BusinessContext'
import { useBusinessPlan, PlanBadge, PlanComparisonModal } from '@/features/subscription'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Trash2,
  Sparkles,
} from 'lucide-react'

export const StaffManagementView: React.FC = () => {
  const { activeBusiness, activeMembership } = useBusinessContext()

  // Permissions check
  const isOwnerOrAdmin =
    activeMembership?.role === 'owner' || activeMembership?.role === 'admin'

  // Data state
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // SaaS Subscription & Limits Check (Backend dynamic limits)
  const { canAddStaff, staffCheck, plan, refresh: refreshPlan } = useBusinessPlan(activeBusiness?.id)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  const [deleteCandidate, setDeleteCandidate] = useState<Staff | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Load staff strictly for the active business
  const loadStaff = useCallback(async () => {
    if (!activeBusiness?.id) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await staffService.getStaff(activeBusiness.id)
    if (res.success && res.data) {
      setStaffList(res.data)
    } else {
      setErrorMessage(res.error || 'No se pudo cargar el listado de colaboradores.')
    }
    setIsLoading(false)
  }, [activeBusiness?.id])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successToast])

  // Toggle active/inactive
  const handleToggleActive = async (staff: Staff) => {
    if (!activeBusiness?.id || !isOwnerOrAdmin) return

    setTogglingId(staff.id)
    const newActiveState = !staff.active

    const res = await staffService.toggleStaffActive(
      activeBusiness.id,
      staff.id,
      newActiveState
    )

    setTogglingId(null)

    if (res.success && res.data) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? res.data! : s))
      )
      // Also update selectedStaff if open in modal
      if (selectedStaff?.id === staff.id) {
        setSelectedStaff(res.data)
      }
      setSuccessToast(
        `${staff.name} fue ${newActiveState ? 'activado' : 'desactivado'} correctamente.`
      )
    } else {
      setErrorMessage(res.error || 'Error al cambiar el estado del colaborador.')
    }
  }

  // Handle open create modal
  const handleOpenCreate = () => {
    if (!canAddStaff) {
      setIsPlanModalOpen(true)
      return
    }
    setEditingStaff(null)
    setIsFormModalOpen(true)
  }

  // Handle open edit modal
  const handleOpenEdit = (staff: Staff) => {
    setEditingStaff(staff)
    setIsFormModalOpen(true)
  }

  // Handle open detail modal
  const handleOpenDetail = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsDetailModalOpen(true)
  }

  // Saved callback from FormModal
  const handleSavedStaff = (savedStaff: Staff, isNew: boolean) => {
    if (isNew) {
      setStaffList((prev) => [...prev, savedStaff])
      setSuccessToast(`¡${savedStaff.name} ha sido agregado exitosamente!`)
    } else {
      setStaffList((prev) =>
        prev.map((s) => (s.id === savedStaff.id ? savedStaff : s))
      )
      if (selectedStaff?.id === savedStaff.id) {
        setSelectedStaff(savedStaff)
      }
      setSuccessToast(`Datos de ${savedStaff.name} actualizados.`)
    }
    refreshPlan()
  }

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteCandidate || !activeBusiness?.id) return

    setIsDeleting(true)
    const res = await staffService.deleteStaff(activeBusiness.id, deleteCandidate.id)
    setIsDeleting(false)

    if (res.success) {
      setStaffList((prev) => prev.filter((s) => s.id !== deleteCandidate.id))
      setSuccessToast(`${deleteCandidate.name} fue eliminado correctamente.`)
      setDeleteCandidate(null)
      if (selectedStaff?.id === deleteCandidate.id) {
        setIsDetailModalOpen(false)
        setSelectedStaff(null)
      }
      refreshPlan()
    } else {
      setErrorMessage(res.error || 'No se pudo eliminar al colaborador.')
      setDeleteCandidate(null)
    }
  }

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Status filter
      if (statusFilter === 'active' && !s.active) return false
      if (statusFilter === 'inactive' && s.active) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = s.name.toLowerCase().includes(query)
        const matchesPhone = s.phone ? s.phone.toLowerCase().includes(query) : false
        return matchesName || matchesPhone
      }

      return true
    })
  }, [staffList, statusFilter, searchQuery])

  // Counters
  const totalCount = staffList.length
  const activeCount = staffList.filter((s) => s.active).length
  const inactiveCount = staffList.filter((s) => !s.active).length

  if (!activeBusiness) {
    return (
      <Card variant="glass" className="p-8 text-center border-brand-500/20">
        <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Selecciona un Negocio</h3>
        <p className="text-xs text-slate-400">
          Debes seleccionar o crear un negocio para gestionar su equipo de profesionales.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Success Toast Banner */}
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

      {/* Top Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-sm text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadStaff} className="text-xs">
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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Gestión de Barberos & Staff
                </h2>
                {plan && (
                  <PlanBadge
                    planId={plan.id}
                    planName={plan.name}
                    onClick={() => setIsPlanModalOpen(true)}
                    size="sm"
                  />
                )}
              </div>
              <p className="text-xs text-slate-400">
                Equipo de <span className="text-brand-300 font-semibold">{activeBusiness.name}</span>
                {staffCheck.isUnlimited ? (
                  <span className="text-slate-500 ml-2">• Barberos ilimitados</span>
                ) : (
                  <span className="text-slate-500 ml-2">
                    • {staffCheck.current} de {staffCheck.max} cupos ocupados
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button & Role Indicator */}
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
            onClick={loadStaff}
            disabled={isLoading}
            title="Recargar datos de Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {isOwnerOrAdmin && (
            <Button
              variant={canAddStaff ? 'primary' : 'outline'}
              size="md"
              onClick={handleOpenCreate}
              className={canAddStaff ? 'shadow-brand-md' : 'border-amber-500/40 text-amber-300'}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {canAddStaff ? 'Nuevo Barbero' : 'Límite de Plan (Mejorar)'}
            </Button>
          )}
        </div>
      </div>

      {/* SaaS Limit Warning Banner */}
      {!canAddStaff && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-100">
                Límite de barberos alcanzado ({staffCheck.current} de {staffCheck.max} profesionales en Plan {plan?.name || 'Free'})
              </p>
              <p className="text-[11px] text-amber-300">
                Tu plan actual ha llegado a la capacidad máxima de staff. Actualiza a un plan superior para habilitar más barberos.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPlanModalOpen(true)}
            className="text-xs shrink-0 font-bold self-start sm:self-auto bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            Mejorar Plan
          </Button>
        </div>
      )}

      {/* Counters & Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por nombre o teléfono..."
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

      {/* MAIN CONTENT AREA WITH 4 STATES */}

      {/* 1. LOADING STATE: Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <Card key={n} variant="default" className="p-5 border-white/5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-surface-800" />
                <div className="w-16 h-5 rounded-full bg-surface-800" />
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-4 rounded bg-surface-800" />
                <div className="w-1/2 h-3 rounded bg-surface-800" />
              </div>
              <div className="pt-3 border-t border-white/5 flex gap-2">
                <div className="flex-1 h-8 rounded bg-surface-800" />
                <div className="flex-1 h-8 rounded bg-surface-800" />
              </div>
            </Card>
          ))}
        </div>
      ) : staffList.length === 0 ? (
        /* 2. EMPTY STATE (No staff created yet in this business) */
        <Card variant="glass" className="py-16 px-6 text-center border-brand-500/20 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Aún no tienes barberos registrados
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Agrega a los profesionales de tu equipo para comenzar a asignarles turnos y gestionar las reservas de tus clientes en {activeBusiness.name}.
          </p>
          {isOwnerOrAdmin && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenCreate}
              className="shadow-brand-md"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Mi Primer Barbero
            </Button>
          )}
        </Card>
      ) : filteredStaff.length === 0 ? (
        /* 3. FILTER EMPTY STATE (Search query returned 0 matches) */
        <Card variant="default" className="py-12 px-6 text-center border-white/5">
          <Filter className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-white mb-1">
            No se encontraron colaboradores
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            No hay ningún barbero que coincida con los filtros actuales.
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
          {filteredStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              isOwnerOrAdmin={isOwnerOrAdmin}
              onEdit={handleOpenEdit}
              onViewDetail={handleOpenDetail}
              onToggleActive={handleToggleActive}
              onDelete={(s) => setDeleteCandidate(s)}
              isToggling={togglingId === staff.id}
            />
          ))}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <StaffFormModal
        isOpen={isFormModalOpen}
        staff={editingStaff}
        businessId={activeBusiness.id}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={handleSavedStaff}
      />

      {/* Detail Modal */}
      <StaffDetailModal
        isOpen={isDetailModalOpen}
        staff={selectedStaff}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(s) => {
          setIsDetailModalOpen(false)
          handleOpenEdit(s)
        }}
        onToggleActive={handleToggleActive}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <Modal
          isOpen={!!deleteCandidate}
          onClose={() => !isDeleting && setDeleteCandidate(null)}
          title="Eliminar Colaborador"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                isLoading={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Eliminar Permanentemente
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-white">{deleteCandidate.name}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              <span className="font-semibold block mb-0.5">Nota importante:</span>
              Si este barbero ya tiene citas registradas, la base de datos impedirá su eliminación para proteger el historial. En ese caso, puedes cambiar su estado a <strong>Inactivo</strong>.
            </div>
          </div>
        </Modal>
      )}

      {/* Plan comparison and upgrade modal */}
      {activeBusiness && (
        <PlanComparisonModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          currentPlanId={plan?.id || 'free'}
          onPlanChanged={refreshPlan}
          businessId={activeBusiness.id}
        />
      )}
    </div>
  )
}
