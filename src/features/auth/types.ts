import { User, Session } from '@supabase/supabase-js'
import { DbProfile, DbBusinessMember, MemberRole } from '@/types/database.types'

export type { MemberRole }

export interface Profile extends DbProfile {
  email?: string
}

export interface BusinessSummary {
  id: string
  name: string
  slug: string
  logo_url: string | null
  active: boolean
}

export interface BusinessMembership extends DbBusinessMember {
  business?: BusinessSummary | null
  businessName?: string
  businessSlug?: string
  is_active?: boolean
  invited_at?: string | null
  joined_at?: string | null
}

export interface SignUpDTO {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface SignInDTO {
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  memberships: BusinessMembership[]
  isLoading: boolean
  isAuthenticated: boolean
  isPasswordRecovery: boolean
}

export interface AuthContextType extends AuthState {
  signUp: (dto: SignUpDTO) => Promise<{ success: boolean; error: string | null; needsEmailVerification?: boolean }>
  signIn: (dto: SignInDTO) => Promise<{ success: boolean; error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>
  updatePassword: (password: string) => Promise<{ success: boolean; error: string | null }>
  refreshProfile: () => Promise<void>
  refreshMemberships: () => Promise<void>
  clearPasswordRecovery: () => void
}
