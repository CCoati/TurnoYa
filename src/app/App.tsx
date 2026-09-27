import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { BusinessProvider } from '@/features/businesses/BusinessContext'
import { AuthModal, AuthModalMode } from '@/features/auth/AuthModal'
import { UserProfileModal } from '@/features/auth/UserProfileModal'
import { BusinessOnboardingWizard } from '@/features/businesses/BusinessOnboardingWizard'
import { BusinessHoursView } from '@/features/businesses'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/layouts/MainLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { DesignSystemPage } from '@/pages/DesignSystemPage'
import { FeaturesArchitecturePage } from '@/pages/FeaturesArchitecturePage'
import { StaffManagementView } from '@/features/staff'
import { ServiceManagementView } from '@/features/services'
import { AppointmentsManagementView } from '@/features/appointments'
import { CalendarView } from '@/features/calendar'
import { PublicBookingPage } from '@/pages/PublicBookingPage'
import { useBusinessContext } from '@/features/businesses/BusinessContext'
import { ExternalLink } from 'lucide-react'

const getInitialPublicSlug = (): string | null => {
  if (typeof window === 'undefined') return null
  const pathname = window.location.pathname
  const hash = window.location.hash
  const searchParams = new URLSearchParams(window.location.search)

  if (searchParams.get('slug')) {
    return searchParams.get('slug')
  }

  // Check /b/:slug, /reservar/:slug, /barberia/:slug
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length >= 2 && (parts[0] === 'b' || parts[0] === 'reservar' || parts[0] === 'barberia')) {
    return parts[1]
  }

  // Check hash #/b/:slug or #/:slug
  if (hash) {
    const hashParts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
    if (hashParts.length >= 2 && (hashParts[0] === 'b' || hashParts[0] === 'reservar' || hashParts[0] === 'barberia')) {
      return hashParts[1]
    }
  }

  return null
}

const AppContent: React.FC = () => {
  const { isPasswordRecovery } = useAuth()
  const { activeBusiness } = useBusinessContext()
  const [currentTab, setCurrentTab] = useState<string>('dashboard')
  const [publicSlug, setPublicSlug] = useState<string | null>(getInitialPublicSlug)

  // Modals state
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean
    mode: AuthModalMode
  }>({
    isOpen: false,
    mode: 'login',
  })
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false)
  const [isCreateBizModalOpen, setIsCreateBizModalOpen] = useState<boolean>(false)

  // Listen to popstate and hashchange
  useEffect(() => {
    const handlePopState = () => {
      setPublicSlug(getInitialPublicSlug())
    }
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  // Automatically prompt password reset modal if recovery link was clicked
  useEffect(() => {
    if (isPasswordRecovery) {
      setAuthModalState({ isOpen: true, mode: 'update_password' })
    }
  }, [isPasswordRecovery])

  const handleOpenAuth = (mode: AuthModalMode = 'login') => {
    setAuthModalState({ isOpen: true, mode })
  }

  const handleCloseAuth = () => {
    setAuthModalState(prev => ({ ...prev, isOpen: false }))
  }

  // If a public business slug is accessed directly via URL, render standalone public booking page
  if (publicSlug) {
    return (
      <PublicBookingPage
        slug={publicSlug}
        onNavigateToDashboard={() => {
          if (window.history.pushState) {
            window.history.pushState({}, '', '/')
          }
          setPublicSlug(null)
          setCurrentTab('dashboard')
        }}
      />
    )
  }

  return (
    <MainLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onOpenAuth={handleOpenAuth}
      onOpenProfile={() => setIsProfileModalOpen(true)}
      onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
    >
      {/* 1. Dashboard (Protected) */}
      {currentTab === 'dashboard' && (
        <ProtectedRoute
          requireBusiness={false}
          onOpenAuth={handleOpenAuth}
          onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
        >
          <DashboardPage
            onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
            onNavigateTab={setCurrentTab}
          />
        </ProtectedRoute>
      )}

      {/* 2. Calendario de Turnos (Protected with Business) */}
      {currentTab === 'calendar' && (
        <ProtectedRoute
          requireBusiness={true}
          onOpenAuth={handleOpenAuth}
          onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
        >
          <CalendarView />
        </ProtectedRoute>
      )}

      {/* 3. Citas / Historial (Protected with Business) */}
      {currentTab === 'appointments' && (
        <ProtectedRoute
          requireBusiness={true}
          onOpenAuth={handleOpenAuth}
          onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
        >
          <AppointmentsManagementView />
        </ProtectedRoute>
      )}

      {/* 4. Servicios (Protected with Business) */}
      {currentTab === 'services' && (
        <ProtectedRoute
          requireBusiness={true}
          onOpenAuth={handleOpenAuth}
          onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
        >
          <ServiceManagementView />
        </ProtectedRoute>
      )}

      {/* 5. Profesionales / Staff (Protected with Business) */}
      {currentTab === 'staff' && (
        <ProtectedRoute
          requireBusiness={true}
          onOpenAuth={handleOpenAuth}
          onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
        >
          <StaffManagementView />
        </ProtectedRoute>
      )}

      {/* 6. Horarios de Atención (Protected with Business) */}
      {currentTab === 'hours' && (
        <ProtectedRoute
          requireBusiness={true}
          onOpenAuth={handleOpenAuth}
          onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
        >
          <BusinessHoursView />
        </ProtectedRoute>
      )}

      {/* 7. Portal Público de Reservas */}
      {currentTab === 'public-page' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-surface-dark border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                Vista previa en vivo del portal de reservas de <strong className="text-white">{activeBusiness?.name}</strong>.
              </span>
            </div>
            <a
              href={`/b/${activeBusiness?.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 font-semibold border border-brand-500/30 transition-colors w-fit"
            >
              <span>Abrir como cliente (url pública)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <PublicBookingPage
              slug={activeBusiness?.slug || 'barberia-san-telmo'}
              onNavigateToDashboard={() => setCurrentTab('dashboard')}
            />
          </div>
        </div>
      )}

      {/* 7. Negocio Multi-Rubro (Architecture Showcase) */}
      {currentTab === 'businesses' && (
        <FeaturesArchitecturePage onGoToDesignSystem={() => setCurrentTab('design-system')} />
      )}

      {/* 8. Sistema de Diseño */}
      {currentTab === 'design-system' && <DesignSystemPage />}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={handleCloseAuth}
        initialMode={authModalState.mode}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenCreateBusiness={() => setIsCreateBizModalOpen(true)}
      />

      <BusinessOnboardingWizard
        isOpen={isCreateBizModalOpen}
        onClose={() => setIsCreateBizModalOpen(false)}
        onSuccess={() => setCurrentTab('dashboard')}
      />
    </MainLayout>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BusinessProvider>
        <AppContent />
      </BusinessProvider>
    </AuthProvider>
  )
}

export default App
