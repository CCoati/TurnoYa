/**
 * PostgreSQL & Supabase Database Model Definitions for TurnosYa
 * Multi-Tenant normalized SaaS architecture.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MemberRole = 'owner' | 'admin' | 'staff'
export type BusinessRole = MemberRole

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid_in_full'
  | 'refunded'

export type BusinessCategory =
  | 'barbershop'
  | 'hair_salon'
  | 'beauty_aesthetics'
  | 'health_medical'
  | 'sports_fitness'
  | 'professional_services'
  | 'automotive'
  | 'pet_care'
  | 'other'
  | string

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise'

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          business_id: string
          created_at: string
          customer_name: string
          customer_phone: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          staff_id: string
          start_time: string
          status: AppointmentStatus
          updated_at: string
        }
        Insert: {
          appointment_date: string
          business_id: string
          created_at?: string
          customer_name: string
          customer_phone: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          staff_id: string
          start_time: string
          status?: AppointmentStatus
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          business_id?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          staff_id?: string
          start_time?: string
          status?: AppointmentStatus
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_staff_id_fkey'
            columns: ['staff_id']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_hours_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: MemberRole
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: MemberRole
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: MemberRole
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_members_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'business_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      business_settings: {
        Row: {
          booking_enabled: boolean
          business_id: string
          created_at: string
          currency: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          booking_enabled?: boolean
          business_id: string
          created_at?: string
          currency?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          booking_enabled?: boolean
          business_id?: string
          created_at?: string
          currency?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_settings_business_id_fkey'
            columns: ['business_id']
            isOneToOne: true
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      businesses: {
        Row: {
          active: boolean
          address: string | null
          category: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'services_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          avatar_url: string | null
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'staff_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'staff_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: {
          p_business_id: string
          p_staff_id: string
          p_service_id: string
          p_date: string
          p_slot_interval?: number
        }
        Returns: {
          slot_start: string
          slot_end: string
          slot_duration: number
          is_available: boolean
        }[]
      }
      book_appointment: {
        Args: {
          p_business_id: string
          p_staff_id: string
          p_service_id: string
          p_appointment_date: string
          p_start_time: string
          p_customer_name: string
          p_customer_phone: string
          p_notes?: string | null
        }
        Returns: {
          id: string
          business_id: string
          staff_id: string
          staff_name: string
          service_id: string
          service_name: string
          customer_name: string
          customer_phone: string
          appointment_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          status: AppointmentStatus
          notes: string | null
          created_at: string
        }
      }
    }
    Enums: {
      appointment_status: AppointmentStatus
      member_role: MemberRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience Type Aliases
export type DbProfile = Database['public']['Tables']['profiles']['Row']
export type DbBusiness = Database['public']['Tables']['businesses']['Row']
export type DbBusinessMember = Database['public']['Tables']['business_members']['Row']
export type DbStaff = Database['public']['Tables']['staff']['Row']
export type DbService = Database['public']['Tables']['services']['Row']
export type DbBusinessHours = Database['public']['Tables']['business_hours']['Row']
export type DbBusinessHour = DbBusinessHours
export type DbBusinessSettings = Database['public']['Tables']['business_settings']['Row']
export type DbAppointment = Database['public']['Tables']['appointments']['Row']

export interface DbStaffService {
  business_id: string
  staff_id: string
  service_id: string
  custom_duration_minutes?: number | null
  custom_price?: number | null
}
