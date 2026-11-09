'use client'

/**
 * `fetch` para las APIs del admin. Si la sesión venció mientras se trabajaba
 * (401), lleva a la pantalla de ingreso y vuelve después a esta misma página,
 * en vez de dejar un error que no dice qué hacer.
 */

export function goToLogin(): void {
  const { pathname, search } = window.location
  const locale = pathname.split('/')[1] || 'es'
  window.location.replace(`/${locale}/admin/ingresar?volver=${encodeURIComponent(pathname + search)}`)
}

export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init)
  if (response.status === 401) goToLogin()
  return response
}

/** Cierra la sesión y vuelve a la pantalla de ingreso. */
export async function signOut(): Promise<void> {
  await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined)
  goToLogin()
}
