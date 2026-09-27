export * from './database.types'
export * from '../features/auth/types'
export * from '../features/businesses/types'
export * from '../features/staff/types'
export * from '../features/services/types'
export * from '../features/appointments/types'
export * from '../features/calendar/types'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
