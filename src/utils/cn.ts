import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines multiple Tailwind CSS class names resolving conflicting utilities
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
