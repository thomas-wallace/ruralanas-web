'use client'

/**
 * Formulario de ingreso al admin. Es lo único del admin que se ve sin sesión.
 *
 * Al entrar se navega de verdad (no con el router del cliente): así el pedido
 * pasa otra vez por el middleware y por la verificación del servidor.
 */

import { useState, type FormEvent } from 'react'

import { buttonClass } from '@/components/ui/button'

import { adminField, adminLabel, adminNotice } from './admin-ui'

export function AdminLogin({ enabled, target }: { enabled: boolean; target: string }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function signIn(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? 'No se pudo entrar.')
        setBusy(false)
        return
      }
      setPassword('')
      window.location.replace(target)
    } catch {
      setError('No hay conexión con el servidor.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={signIn} className="w-full max-w-[380px] border border-earth/15 bg-paper p-8">
      <div className="font-sans text-[11px] tracking-[0.2em] text-olive uppercase">Admin</div>
      <h1 className="mt-3 mb-6 font-display text-[32px] font-medium leading-none text-earth">Ingresar</h1>

      {!enabled ? (
        <p className={adminNotice}>
          El admin todavía no está configurado. Hay que poner <code>ADMIN_PASSWORD</code> en el entorno, con
          al menos doce caracteres, y reiniciar.
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className={adminLabel}>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              className={adminField}
              required
            />
          </label>

          {error && (
            <p role="alert" className="mt-4 mb-0 text-[13px] text-olive">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={buttonClass('primary', 'md', 'mt-5 w-full')}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </>
      )}
    </form>
  )
}
