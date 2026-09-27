/**
 * TurnosYa Centralized Design Tokens
 * 
 * Sourced directly from the official TurnosYa logo and brand identity:
 * - Primary Violet: #7C3AED (TurnosYa "Ya" & Checkmark)
 * - Accent Purple: #8B5CF6 / #6366F1
 * - Dark Canvas: #06080E / #0E121E
 * - Crisp White: #FFFFFF ("Turno" text)
 */

export const brandTokens = {
  name: 'TurnosYa',
  tagline: 'Reservas en un click',
  colors: {
    primary: {
      light: '#A78BFA',
      DEFAULT: '#7C3AED',
      hover: '#6D28D9',
      active: '#5B21B6',
      subtle: '#2E1065',
    },
    accent: {
      indigo: '#6366F1',
      purple: '#8B5CF6',
      glow: 'rgba(124, 58, 237, 0.45)',
    },
    canvas: {
      darkest: '#06080E',
      surface: '#0E121E',
      surfaceElevated: '#161C2E',
      surfaceHover: '#1E263C',
      border: 'rgba(255, 255, 255, 0.08)',
      borderFocus: '#7C3AED',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      muted: '#64748B',
      inverse: '#0F172A',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#6366F1',
    },
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

export type BrandTokens = typeof brandTokens
