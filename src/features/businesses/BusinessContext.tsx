import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { BusinessMembership, BusinessSummary } from '@/features/auth/types'
import { supabase } from '@/lib/supabase'
import { Business } from './types'

interface BusinessContextType {
  activeBusiness: Business | null
  activeMembership: BusinessMembership | null
  availableBusinesses: BusinessSummary[]
  hasBusiness: boolean
  isLoadingBusiness: boolean
  setActiveBusinessId: (id: string | null) => void
  refreshActiveBusiness: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

const ACTIVE_BUSINESS_STORAGE_KEY = 'turnosya_active_business_id'

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { memberships, isAuthenticated } = useAuth()
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY)
    }
    return null
  })
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null)
  const [isLoadingBusiness, setIsLoadingBusiness] = useState<boolean>(false)

  // Extract available businesses from memberships
  const availableBusinesses: BusinessSummary[] = useMemo(() => {
    return memberships
      .filter(m => m.business && m.business.active)
      .map(m => m.business as BusinessSummary)
  }, [memberships])

  const hasBusiness = availableBusinesses.length > 0

  // Set active business ID with persistence
  const setActiveBusinessId = useCallback((id: string | null) => {
    setActiveBusinessIdState(id)
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, id)
      } else {
        localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY)
      }
    }
  }, [])

  // Auto-select or validate activeBusinessId whenever memberships change
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveBusiness(null)
      setActiveBusinessIdState(null)
      return
    }

    if (availableBusinesses.length === 0) {
      // User has no business yet (valid state!)
      setActiveBusiness(null)
      setActiveBusinessIdState(null)
      return
    }

    // If currently selected ID is still in available businesses, keep it
    if (activeBusinessId && availableBusinesses.some(b => b.id === activeBusinessId)) {
      return
    }

    // Otherwise, default to the first available business
    const firstBusiness = availableBusinesses[0]
    if (firstBusiness) {
      setActiveBusinessId(firstBusiness.id)
    }
  }, [availableBusinesses, activeBusinessId, isAuthenticated, setActiveBusinessId])

  // Fetch full details of the active business whenever activeBusinessId changes
  const fetchActiveBusiness = useCallback(async (businessId: string) => {
    setIsLoadingBusiness(true)
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle()

      if (!error && data) {
        setActiveBusiness(data as Business)
      } else {
        setActiveBusiness(null)
      }
    } catch {
      setActiveBusiness(null)
    } finally {
      setIsLoadingBusiness(false)
    }
  }, [])

  useEffect(() => {
    if (activeBusinessId) {
      fetchActiveBusiness(activeBusinessId)
    } else {
      setActiveBusiness(null)
    }
  }, [activeBusinessId, fetchActiveBusiness])

  const refreshActiveBusiness = useCallback(async () => {
    if (activeBusinessId) {
      await fetchActiveBusiness(activeBusinessId)
    }
  }, [activeBusinessId, fetchActiveBusiness])

  // Current user's membership in the active business
  const activeMembership = useMemo(() => {
    if (!activeBusinessId) return null
    return memberships.find(m => m.business_id === activeBusinessId) || null
  }, [memberships, activeBusinessId])

  const value = {
    activeBusiness,
    activeMembership,
    availableBusinesses,
    hasBusiness,
    isLoadingBusiness,
    setActiveBusinessId,
    refreshActiveBusiness,
  }

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}

/**
 * useBusinessContext hook: Access active tenant and multi-business switching
 */
export const useBusinessContext = (): BusinessContextType => {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusinessContext debe ser utilizado dentro de un <BusinessProvider>')
  }
  return context
}

export const useBusiness = useBusinessContext

