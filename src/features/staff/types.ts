export type { DbStaff } from '@/types/database.types'

export interface StaffProfile {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
}

export interface Staff {
  id: string
  business_id: string
  user_id: string | null
  name: string
  phone: string | null
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
  profile?: StaffProfile | null
}

export interface CreateStaffInput {
  business_id: string
  name: string
  phone?: string | null
  avatar_url?: string | null
  active?: boolean
  user_id?: string | null
}

export interface UpdateStaffInput {
  name?: string
  phone?: string | null
  avatar_url?: string | null
  active?: boolean
  user_id?: string | null
}

export interface BusinessMemberOption {
  user_id: string
  role: string
  full_name: string
  avatar_url: string | null
  phone: string | null
}

// Preset avatars for quick styling
export const PRESET_AVATARS = [
  {
    id: 'barber-1',
    label: 'Barbero Clásico',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'barber-2',
    label: 'Fade Specialist',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'barber-3',
    label: 'Master Barber',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'stylist-1',
    label: 'Estilista Pro',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'stylist-2',
    label: 'Colorista',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'stylist-3',
    label: 'Estética & Spa',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
]
