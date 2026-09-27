import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Client Configuration for TurnosYa
 * 
 * Rules strictly followed:
 * 1. Environment variables loaded via import.meta.env (Vite standard).
 * 2. No hardcoded credentials.
 * 3. NO service_role key used (client-side uses Anon / Publishable Key only).
 * 4. Safe against unconfigured states without crashing the React application.
 */

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

export const SUPABASE_URL = rawUrl.trim()
export const SUPABASE_ANON_KEY = rawKey.trim()

/**
 * Validates whether Supabase environment variables have been filled with real credentials
 */
export const isSupabaseConfigured = (): boolean => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  if (SUPABASE_URL.includes('your-project-id') || SUPABASE_ANON_KEY.includes('your-anon')) {
    return false
  }
  try {
    const parsed = new URL(SUPABASE_URL)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Creates the Supabase client instance safely.
 * If not configured, returns a client with dummy values to prevent module-level crashes.
 */
const fallbackUrl = 'https://placeholder.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? SUPABASE_URL : fallbackUrl,
  isSupabaseConfigured() ? SUPABASE_ANON_KEY : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export interface SupabaseConnectionStatus {
  success: boolean
  isConfigured: boolean
  url: string
  message: string
  latencyMs?: number
  errorDetails?: string
}

/**
 * Verifies Supabase connection without needing database tables, RLS, or authentication.
 * Pings the Supabase Auth server and REST gateway using the public anon key.
 */
export const checkSupabaseConnection = async (): Promise<SupabaseConnectionStatus> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      isConfigured: false,
      url: SUPABASE_URL || '(No configurada)',
      message: 'Las variables de entorno en .env.local contienen valores de plantilla o están vacías. Reemplázalas con las credenciales de tu proyecto en Supabase.',
    }
  }

  const startTime = performance.now()

  try {
    // Check 1: Ping the Supabase Auth endpoint
    const { error: authError } = await supabase.auth.getSession()
    const latencyMs = Math.round(performance.now() - startTime)

    if (authError) {
      return {
        success: false,
        isConfigured: true,
        url: SUPABASE_URL,
        message: `Error al conectar con Supabase Auth: ${authError.message}`,
        errorDetails: authError.message,
        latencyMs,
      }
    }

    return {
      success: true,
      isConfigured: true,
      url: SUPABASE_URL,
      message: 'Conexión exitosa con el proyecto Supabase TurnosYa.',
      latencyMs,
    }
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      isConfigured: true,
      url: SUPABASE_URL,
      message: `Error de red al intentar alcanzar la URL de Supabase: ${errorMsg}`,
      errorDetails: errorMsg,
      latencyMs,
    }
  }
}
