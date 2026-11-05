'use client'

/**
 * Puerta del admin: comprueba la sesión y, si no hay, pide la contraseña.
 * Cuando hay sesión, dibuja la sección y le pasa cómo salir.
 *
 * Es la misma sesión que usa el admin de reseñas (`/api/admin/session`).
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { buttonClass } from '@/components/ui/button'

import { adminField, adminLabel, adminNotice } from './admin-ui'

export function AdminGate({
  title,
  children,
}: {
  title: string
  children: (signOut: () => Promise<void>) => ReactNode
}) {
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking')
  const [enabled, setEnabled] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/admin/session')
      .then((response) => response.json() as Promise<{ enabled: boolean; authenticated: boolean }>)
      .then((session) => {
        setEnabled(session.enabled)
        setState(session.authenticated ? 'open' : 'locked')
      })
      .catch(() => setState('locked'))
  }, [])

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
        return
      }
      setPassword('')
      setState('open')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setState('locked')
  }

  if (state === 'checking') {
    return (
      <p className="py-20 text-center font-sans text-[12px] tracking-[0.12em] text-slate uppercase">
        Cargando…
      </p>
    )
  }

  if (state === 'open') return <>{children(signOut)}</>

  return (
    <form onSubmit={signIn} className="mx-auto max-w-[380px] py-20">
      <h2 className="m-0 mb-6 font-display text-[26px] text-earth">{title}</h2>

      {!enabled ? (
        <p className={adminNotice}>
          El admin todavía no está configurado. Hay que poner <code>ADMIN_PASSWORD</code> en el
          entorno, con al menos doce caracteres, y reiniciar.
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
