import { supabase } from '@/lib/supabase'
import {
  SignUpDTO,
  SignInDTO,
  Profile,
  BusinessMembership,
} from '@/features/auth/types'
import { ApiResponse } from '@/types'

/**
 * Supabase Auth Service
 * Pure Supabase client implementation.
 * Zero manual password handling or custom token storage.
 */
class AuthService {
  /**
   * Registers a new user with Supabase Auth
   * Note: The database trigger `on_auth_user_created` will automatically
   * insert the profile row, but we also run a safe upsert as insurance.
   */
  async signUp(dto: SignUpDTO): Promise<ApiResponse<{ needsEmailVerification: boolean }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: dto.email.trim().toLowerCase(),
        password: dto.password,
        options: {
          data: {
            full_name: dto.fullName.trim(),
            name: dto.fullName.trim(),
            phone: dto.phone?.trim() || null,
          },
        },
      })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      // If a session was created immediately (email confirmation disabled in Supabase), ensure profile exists
      if (data.user) {
        try {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              full_name: dto.fullName.trim(),
              phone: dto.phone?.trim() || null,
            },
            { onConflict: 'id' }
          )
        } catch {
          // If trigger already handled it or RLS pending, non-fatal
        }
      }

      // If user exists but session is null, email confirmation is required
      const needsEmailVerification = Boolean(data.user && !data.session)

      return {
        data: { needsEmailVerification },
        error: null,
        success: true,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado durante el registro'
      return { data: null, error: message, success: false }
    }
  }

  /**
   * Logs in an existing user with Supabase Auth
   */
  async signIn(dto: SignInDTO): Promise<ApiResponse<{ user: unknown; session: unknown }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: dto.email.trim().toLowerCase(),
        password: dto.password,
      })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return {
        data: { user: data.user, session: data.session },
        error: null,
        success: true,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      return { data: null, error: message, success: false }
    }
  }

  /**
   * Logs out the user from Supabase Auth and clears session storage
   */
  async signOut(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { data: null, error: error.message, success: false }
      }
      return { data: null, error: null, success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      return { data: null, error: message, success: false }
    }
  }

  /**
   * Sends password reset email through Supabase Auth
   */
  async resetPasswordForEmail(email: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        }
      )

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data: null, error: null, success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al solicitar recuperación de contraseña'
      return { data: null, error: message, success: false }
    }
  }

  /**
   * Updates user's password once authenticated (e.g. from recovery link)
   */
  async updatePassword(password: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        return { data: null, error: error.message, success: false }
      }
      return { data: null, error: null, success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar contraseña'
      return { data: null, error: message, success: false }
    }
  }

  /**
   * Loads profile data from public.profiles
   */
  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      if (!data) {
        return { data: null, error: 'Perfil no encontrado', success: false }
      }

      return {
        data: data as Profile,
        error: null,
        success: true,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar perfil'
      return { data: null, error: message, success: false }
    }
  }

  /**
   * Loads all business memberships for this user.
   * Multi-Tenant: A user can have 0, 1, or N business memberships.
   */
  async getUserMemberships(userId: string): Promise<ApiResponse<BusinessMembership[]>> {
    try {
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          id,
          business_id,
          user_id,
          role,
          created_at,
          updated_at,
          businesses (
            id,
            name,
            slug,
            logo_url,
            active
          )
        `)
        .eq('user_id', userId)

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const formatted: BusinessMembership[] = (data || []).map((row: any) => ({
        id: row.id,
        business_id: row.business_id,
        user_id: row.user_id,
        role: row.role,
        created_at: row.created_at,
        updated_at: row.updated_at,
        business: row.businesses
          ? {
              id: row.businesses.id,
              name: row.businesses.name,
              slug: row.businesses.slug,
              logo_url: row.businesses.logo_url,
              active: row.businesses.active,
            }
          : null,
        businessName: row.businesses?.name,
        businessSlug: row.businesses?.slug,
      }))

      return {
        data: formatted,
        error: null,
        success: true,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar membresías'
      return { data: null, error: message, success: false }
    }
  }
}

export const authService = new AuthService()
