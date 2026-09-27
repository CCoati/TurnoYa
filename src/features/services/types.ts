export type { DbService } from '@/types/database.types'

export interface Service {
  id: string
  business_id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateServiceInput {
  business_id: string
  name: string
  description?: string | null
  duration_minutes: number
  price: number
  active?: boolean
}

export interface UpdateServiceInput {
  name?: string
  description?: string | null
  duration_minutes?: number
  price?: number
  active?: boolean
}

// Preset service templates to help the owner quickly build their catalog
export interface ServiceTemplate {
  name: string
  description: string
  duration_minutes: number
  price: number
  badge?: string
}

export const POPULAR_SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    name: 'Corte',
    description: 'Corte tradicional o moderno con máquina y tijera, incluye lavado y peinado.',
    duration_minutes: 30,
    price: 500,
    badge: 'Popular',
  },
  {
    name: 'Barba',
    description: 'Perfilado de barba con toalla caliente, navaja y aceites hidratantes.',
    duration_minutes: 30,
    price: 350,
  },
  {
    name: 'Corte + Barba',
    description: 'Combo completo de corte personalizado y ritual de cuidado de barba.',
    duration_minutes: 60,
    price: 750,
    badge: 'Combo Recomendado',
  },
  {
    name: 'Afeitado Clásico',
    description: 'Afeitado tradicional a navaja con toallas calientes y bálsamo.',
    duration_minutes: 25,
    price: 300,
  },
  {
    name: 'Coloración / Tintura',
    description: 'Aplicación de tintura, matizado o decoloración profesional.',
    duration_minutes: 90,
    price: 1500,
  },
]
