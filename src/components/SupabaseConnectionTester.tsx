import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Database, CheckCircle2, AlertTriangle, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react'
import { checkSupabaseConnection, isSupabaseConfigured, SUPABASE_URL, SupabaseConnectionStatus } from '@/lib/supabase'

export const SupabaseConnectionTester: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<SupabaseConnectionStatus | null>(null)
  const configured = isSupabaseConfigured()

  const runConnectionCheck = async () => {
    setTesting(true)
    try {
      const res = await checkSupabaseConnection()
      setStatus(res)
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    // Run an initial check on mount
    runConnectionCheck()
  }, [])

  return (
    <Card variant="glass" className="border-brand-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-950/80 border border-brand-500/30 text-brand-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Conexión Supabase TurnosYa
                {status?.success ? (
                  <Badge variant="success" size="sm" dot>Conectado</Badge>
                ) : configured ? (
                  <Badge variant="warning" size="sm" dot>Verificando</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Pendiente Credenciales</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Inicialización del cliente Supabase mediante variables de entorno Vite.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runConnectionCheck}
            isLoading={testing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Verificar Conexión
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* Connection Result Banner */}
        {status && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
              status.success
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : configured
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                : 'bg-surface-850 border-white/10 text-slate-300'
            }`}
          >
            {status.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold text-slate-100">{status.message}</p>
              {status.latencyMs !== undefined && (
                <p className="text-[11px] text-slate-400">
                  Latencia de respuesta: <span className="text-brand-300 font-mono">{status.latencyMs}ms</span>
                </p>
              )}
              {status.errorDetails && (
                <p className="text-[11px] text-rose-300 font-mono bg-surface-950/60 p-2 rounded-lg mt-1">
                  {status.errorDetails}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Security & Config Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-surface-950/60 border border-white/5 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-400" />
              Variables de Entorno (.env.local)
            </span>
            <p className="text-slate-200 font-mono text-[11px] truncate">
              URL: {SUPABASE_URL || 'No configurada'}
            </p>
            <p className="text-[11px] text-slate-400">
              Clave: <span className="text-brand-300">Anon Public Key</span> (segura para frontend)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-950/60 border border-white/5 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Seguridad & Secretos
            </span>
            <p className="text-slate-300 text-[11px]">
              <span className="text-emerald-400 font-semibold">.env.local</span> protegido en <span className="font-mono">.gitignore</span>.
            </p>
            <p className="text-[11px] text-slate-400">
              Service Role Key excluida del bundle cliente.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span>Plantilla disponible en:</span>
          <code className="text-brand-300 bg-surface-800 px-1 py-0.5 rounded font-mono">.env.example</code>
        </span>
        <span className="text-slate-500">
          Supabase v2 (@supabase/supabase-js)
        </span>
      </CardFooter>
    </Card>
  )
}
