import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { useBusinessContext } from './BusinessContext'
import { Store, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

interface CreateBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (businessId: string) => void
}

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshMemberships } = useAuth()
  const { setActiveBusinessId } = useBusinessContext()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-generate URL slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setErrorMessage('Debes estar autenticado para crear un negocio.')
      return
    }

    if (!name.trim()) {
      setErrorMessage('El nombre del negocio es obligatorio.')
      return
    }

    if (!slug.trim()) {
      setErrorMessage('El identificador web (slug) es obligatorio.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      // 1. Create Business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .insert({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          description: description.trim() || null,
          active: true,
        })
        .select()
        .single()

      if (bizError) {
        if (bizError.code === '23505' || bizError.message.includes('slug')) {
          throw new Error('Ese identificador web (slug) ya está en uso. Por favor elige otro.')
        }
        throw bizError
      }

      // 2. Associate current user as OWNER in business_members
      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: business.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) {
        console.warn('Error vinculando miembro:', memberError)
      }

      // 3. Create default business_settings (1 to 1)
      await supabase
        .from('business_settings')
        .insert({
          business_id: business.id,
          timezone: 'America/Argentina/Buenos_Aires',
          currency: 'ARS',
          booking_enabled: true,
        })

      // 4. Update local context & select active business
      await refreshMemberships()
      setActiveBusinessId(business.id)

      setSuccessMessage('¡Negocio creado exitosamente!')
      setTimeout(() => {
        onSuccess?.(business.id)
        onClose()
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el negocio'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Crear Nuevo Negocio</h3>
            <p className="text-xs text-slate-400">Multi-tenant TurnosYa SaaS</p>
          </div>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Nombre del Negocio <span className="text-rose-400">*</span>
          </label>
          <Input
            value={name}
            onChange={handleNameChange}
            placeholder="Ej. Centro de Estética Lumina / Barbería Roma"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Slug / Identificador Web <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase())}
              placeholder="mi-negocio"
              required
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            URL de reservas: turnosya.com/<strong>{slug || 'mi-negocio'}</strong>
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Teléfono o WhatsApp
          </label>
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+54 9 11 2345-6789"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Dirección
          </label>
          <Input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Av. Santa Fe 1234, CABA"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Descripción corta
          </label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej. Especialistas en cuidado capilar y spa urbano"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center shadow-brand-md"
          >
            Registrar Negocio
            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
