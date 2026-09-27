/**
 * WhatsApp Integration Service
 * 
 * Provides phone number normalization, message template generation,
 * and wa.me link generation.
 * 
 * Architectural design prepared for future WhatsApp Business API integration
 * (e.g. Meta Cloud API, webhooks, official templates) without requiring a backend today.
 */

export interface AppointmentWhatsAppContext {
  businessName: string
  customerName: string
  customerPhone?: string
  serviceName: string
  staffName: string
  appointmentDate: string
  startTime: string
  endTime?: string
  bookingCode?: string
}

export interface IWhatsAppProvider {
  formatPhoneNumber(phone: string, defaultCountryCode?: string): string
  buildCustomerToBusinessUrl(businessPhone: string, ctx: AppointmentWhatsAppContext): string
  buildBusinessToCustomerUrl(customerPhone: string, ctx: AppointmentWhatsAppContext): string
  generateWaMeLink(phone: string, message: string): string
}

/**
 * Normalizes phone numbers for WhatsApp compatibility.
 * Removes symbols, dashes, spaces, and handles Argentine (+54) and international formats.
 * WhatsApp wa.me links require numbers in pure international format without +, spaces or leading zeros.
 * 
 * Argentina specifics:
 * - Country code: 54
 * - Mobile prefix for WhatsApp: 9
 * - Area code without leading 0
 * - Mobile without local prefix 15
 * E.g.: "+54 9 11 1234-5678" -> "5491112345678"
 *       "011 15-1234-5678"   -> "5491112345678"
 *       "11 1234-5678"       -> "5491112345678"
 */
export function normalizeWhatsAppNumber(phone: string, defaultCountryCode = '54'): string {
  if (!phone) return ''

  // Remove everything except numbers
  let digits = phone.replace(/\D/g, '')
  if (!digits) return ''

  // If starts with leading 0 (trunk code in Argentina/LATAM), strip it
  if (digits.startsWith('0')) {
    digits = digits.substring(1)
  }

  // If already starts with 54
  if (digits.startsWith('54')) {
    // If it starts with 549, it's already well-formatted for Argentine mobile WhatsApp
    if (digits.startsWith('549')) {
      return digits
    }
    // If it starts with 54 (Argentina) but missing the mobile 9, insert it: 54 + 9 + rest
    return `549${digits.substring(2)}`
  }

  // If it's a 10-digit number (common in Argentina: 2-4 digit area code + 6-8 digit local number)
  // e.g. 11 5555 8888 or 351 123 4567
  if (digits.length === 10 && defaultCountryCode === '54') {
    return `549${digits}`
  }

  // If it has local 15 prefix after area code (e.g., 11 15 1234 5678 -> 10 or 12 digits)
  if (digits.length === 11 && digits.startsWith('15') && defaultCountryCode === '54') {
    return `54911${digits.substring(2)}`
  }

  // If user entered full international number with other country code (e.g., 1XXXXXXXXXX, 34XXXXXXXXX)
  if (digits.length >= 11) {
    return digits
  }

  // Fallback: prepend default country code and mobile prefix
  return `${defaultCountryCode}9${digits}`
}

/**
 * Message template builders
 * Ensures only clean, necessary appointment details are included without DB noise.
 */
export function buildCustomerToBusinessMessage(ctx: AppointmentWhatsAppContext): string {
  const codeText = ctx.bookingCode ? ` (Reserva #${ctx.bookingCode})` : ''
  const timeText = ctx.startTime ? ctx.startTime.slice(0, 5) : ''

  return (
    `¡Hola ${ctx.businessName}! Acabo de confirmar mi turno${codeText}.\n\n` +
    `• Cliente: ${ctx.customerName}\n` +
    `• Servicio: ${ctx.serviceName}\n` +
    `• Barbero: ${ctx.staffName}\n` +
    `• Fecha: ${ctx.appointmentDate}\n` +
    `• Hora: ${timeText} hs\n\n` +
    `¡Muchas gracias!`
  )
}

export function buildBusinessToCustomerMessage(ctx: AppointmentWhatsAppContext): string {
  const timeText = ctx.startTime ? ctx.startTime.slice(0, 5) : ''

  return (
    `¡Hola ${ctx.customerName}! Te escribimos de ${ctx.businessName} para coordinar tu turno:\n\n` +
    `• Negocio: ${ctx.businessName}\n` +
    `• Servicio: ${ctx.serviceName}\n` +
    `• Barbero: ${ctx.staffName}\n` +
    `• Fecha: ${ctx.appointmentDate}\n` +
    `• Hora: ${timeText} hs\n\n` +
    `Si necesitas modificar o consultar algo sobre tu turno, avísanos por acá.`
  )
}

/**
 * Generates an encrypted/safe wa.me redirect URL.
 */
export function generateWaMeLink(phone: string, message: string): string {
  const normalizedPhone = normalizeWhatsAppNumber(phone)
  if (!normalizedPhone) return ''
  const encodedText = encodeURIComponent(message)
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`
}

/**
 * Future WhatsApp Business API Service Class
 * Adheres to IWhatsAppProvider interface.
 */
export class WhatsAppService implements IWhatsAppProvider {
  formatPhoneNumber(phone: string, defaultCountryCode = '54'): string {
    return normalizeWhatsAppNumber(phone, defaultCountryCode)
  }

  generateWaMeLink(phone: string, message: string): string {
    return generateWaMeLink(phone, message)
  }

  buildCustomerToBusinessUrl(businessPhone: string, ctx: AppointmentWhatsAppContext): string {
    const message = buildCustomerToBusinessMessage(ctx)
    return generateWaMeLink(businessPhone, message)
  }

  buildBusinessToCustomerUrl(customerPhone: string, ctx: AppointmentWhatsAppContext): string {
    const message = buildBusinessToCustomerMessage(ctx)
    return generateWaMeLink(customerPhone, message)
  }

  // Stubs for future WhatsApp Business API integration:
  // async sendCloudApiTemplate(to: string, templateName: string, components: any[]) {
  //   throw new Error('WhatsApp Business Cloud API not yet configured. Using wa.me links.')
  // }
}

export const whatsappService = new WhatsAppService()
