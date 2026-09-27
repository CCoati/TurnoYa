import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PublicBusinessData } from '../types'
import { Business, BusinessHour } from '@/features/businesses/types'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'

export function usePublicBusiness(slug: string | null | undefined) {
  const [data, setData] = useState<PublicBusinessData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadBusiness = useCallback(async () => {
    if (!slug) {
      setIsLoading(false)
      setError('No se especificó el slug del negocio.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Fetch business by slug
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug.trim().toLowerCase())
        .eq('active', true)
        .single()

      if (bizError || !bizData) {
        setIsLoading(false)
        setError(`El negocio con el enlace '${slug}' no fue encontrado o está inactivo.`)
        return
      }

      const business: Business = {
        id: bizData.id,
        name: bizData.name,
        slug: bizData.slug,
        category: bizData.category,
        description: bizData.description,
        logo_url: bizData.logo_url,
        phone: bizData.phone,
        email: bizData.email,
        address: bizData.address,
        active: Boolean(bizData.active),
        is_active: Boolean(bizData.active),
        created_at: bizData.created_at,
        updated_at: bizData.updated_at,
      }

      // 2. Fetch parallel: active services, active staff, and business hours
      const [servicesRes, staffRes, hoursRes] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .eq('business_id', business.id)
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('staff')
          .select('id, business_id, name, phone, avatar_url, active, created_at, updated_at')
          .eq('business_id', business.id)
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('business_hours')
          .select('*')
          .eq('business_id', business.id)
          .order('day_of_week', { ascending: true }),
      ])

      const services: Service[] = (servicesRes.data || []).map((s: any) => ({
        id: s.id,
        business_id: s.business_id,
        name: s.name,
        description: s.description,
        duration_minutes: Number(s.duration_minutes),
        price: Number(s.price),
        active: Boolean(s.active),
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))

      const staff: Staff[] = (staffRes.data || []).map((st: any) => ({
        id: st.id,
        business_id: st.business_id,
        user_id: null, // Private user ID is not exposed to anon
        name: st.name,
        phone: st.phone,
        avatar_url: st.avatar_url,
        active: Boolean(st.active),
        created_at: st.created_at,
        updated_at: st.updated_at,
      }))

      const hours: BusinessHour[] = (hoursRes.data || []).map((h: any) => ({
        id: h.id,
        business_id: h.business_id,
        day_of_week: Number(h.day_of_week),
        is_open: Boolean(h.is_open),
        open_time: h.open_time,
        close_time: h.close_time,
        created_at: h.created_at,
        updated_at: h.updated_at,
      }))

      setData({
        business,
        services,
        staff,
        hours,
      })
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del negocio.')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadBusiness()
  }, [loadBusiness])

  return {
    businessData: data,
    isLoading,
    error,
    refetch: loadBusiness,
  }
}
