import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'
import {
  AuthContextType,
  Profile,
  BusinessMembership,
  SignUpDTO,
  SignInDTO,
} from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<BusinessMembership[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false)

  // Loads profile from public.profiles
  const fetchProfile = useCallback(async (userId: string) => {
    const res = await authService.getProfile(userId)
    if (res.success && res.data) {
      setProfile(res.data)
    } else {
      // Fallback: build minimal profile from user metadata if trigger didn't finish yet
      setProfile(prev => prev || {
        id: userId,
        full_name: 'Usuario',
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }, [])

  // Loads business memberships for the user
  const fetchMemberships = useCallback(async (userId: string) => {
    const res = await authService.getUserMemberships(userId)
    if (res.success && res.data) {
      setMemberships(res.data)
    } else {
      setMemberships([])
    }
  }, [])

  // Refreshes profile explicitly
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  // Refreshes memberships explicitly
  const refreshMemberships = useCallback(async () => {
    if (user?.id) {
      await fetchMemberships(user.id)
    }
  }, [user?.id, fetchMemberships])

  // Initialize session detection and subscribe to Auth events
  useEffect(() => {
    let isMounted = true

    // Check URL hash for type=recovery (Supabase password recovery links)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash && hash.includes('type=recovery')) {
        setIsPasswordRecovery(true)
      }
    }

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('[TurnosYa Auth] Error recuperando sesión inicial:', error.message)
        }

        if (isMounted) {
          if (initialSession?.user) {
            setSession(initialSession)
            setUser(initialSession.user)
            await Promise.allSettled([
              fetchProfile(initialSession.user.id),
              fetchMemberships(initialSession.user.id),
            ])
          } else {
            setSession(null)
            setUser(null)
            setProfile(null)
            setMemberships([])
          }
        }
      } catch (err) {
        console.error('[TurnosYa Auth] Error inesperado inicializando auth:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Listen to live Auth events (sign in, sign out, token refresh, password recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await Promise.allSettled([
            fetchProfile(newSession.user.id),
            fetchMemberships(newSession.user.id),
          ])
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        setMemberships([])
        setIsPasswordRecovery(false)
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, fetchMemberships])

  // Sign up action
  const signUp = useCallback(async (dto: SignUpDTO) => {
    setIsLoading(true)
    try {
      const res = await authService.signUp(dto)
      if (res.success && res.data) {
        return {
          success: true,
          error: null,
          needsEmailVerification: res.data.needsEmailVerification,
        }
      }
      return { success: false, error: res.error || 'Error al registrar usuario' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign in action
  const signIn = useCallback(async (dto: SignInDTO) => {
    setIsLoading(true)
    try {
      const res = await authService.signIn(dto)
      if (res.success) {
        return { success: true, error: null }
      }
      return { success: false, error: res.error || 'Credenciales inválidas' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign out action
  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
      setMemberships([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Password reset request
  const resetPassword = useCallback(async (email: string) => {
    const res = await authService.resetPasswordForEmail(email)
    if (res.success) {
      return { success: true, error: null }
    }
    return { success: false, error: res.error || 'Error al solicitar recuperación' }
  }, [])

  // Update password action
  const updatePassword = useCallback(async (password: string) => {
    const res = await authService.updatePassword(password)
    if (res.success) {
      setIsPasswordRecovery(false)
      return { success: true, error: null }
    }
    return { success: false, error: res.error || 'Error al cambiar la contraseña' }
  }, [])

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false)
    if (typeof window !== 'undefined' && window.location.hash) {
      history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    profile,
    memberships,
    isLoading,
    isAuthenticated: Boolean(user && session),
    isPasswordRecovery,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    refreshMemberships,
    clearPasswordRecovery,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth hook: Provides full access to TurnosYa authentication state & actions
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>')
  }
  return context
}

/**
 * useUser hook: Fast convenience hook for current user and profile
 */
export const useUser = () => {
  const { user, profile, isAuthenticated, isLoading } = useAuth()
  return { user, profile, isAuthenticated, isLoading }
}
