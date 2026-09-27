/**
 * TurnosYa Centralized API Client & Service Gateway
 * Scalable architecture for future REST / GraphQL / Supabase RPC calls
 */

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...customConfig } = options

    let url = `${this.baseUrl}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const headers = {
      'Content-Type': 'application/json',
      ...customConfig.headers,
    }

    const config: RequestInit = {
      ...customConfig,
      headers,
    }

    const response = await fetch(url, config)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
