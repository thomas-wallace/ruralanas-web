import 'server-only'

/**
 * Cliente de bajo nivel de la API REST de Dolibarr, en modo SÓLO LECTURA.
 *
 * Tres reglas que no se negocian:
 *
 *   · Sólo hace GET. No hay forma de escribir en Dolibarr desde acá, y el
 *     usuario de API además sólo tiene lectura sobre Productos, Stock y
 *     Categorías: son dos candados, no uno.
 *   · El token vive en DOLIBARR_API_KEY, viaja sólo en la cabecera DOLAPIKEY
 *     y nunca en una URL. `server-only` impide que este archivo termine en el
 *     bundle del navegador.
 *   · Todo lo que se registra pasa por `redact()`, por si algún día Dolibarr
 *     devuelve el token dentro de un mensaje de error.
 */

import { DolibarrError } from './errors'

const TIMEOUT_MS = 20_000

function config(): { base: string; token: string } {
  const url = process.env.DOLIBARR_URL?.trim()
  const token = process.env.DOLIBARR_API_KEY?.trim()
  if (!url || !token) {
    throw new DolibarrError(
      'unconfigured',
      `Falta ${!url ? 'DOLIBARR_URL' : 'DOLIBARR_API_KEY'} en el entorno`,
    )
  }
  // Se acepta la URL de la instalación o la de la API, con o sin barra final.
  const root = url.replace(/\/+$/, '').replace(/\/api\/index\.php$/, '')
  return { base: `${root}/api/index.php`, token }
}

/** Borra el token de cualquier texto antes de registrarlo. */
export function redact(text: string): string {
  const token = process.env.DOLIBARR_API_KEY?.trim()
  return token ? text.split(token).join('[token]') : text
}

export function logDolibarrError(error: DolibarrError): void {
  console.error(`[dolibarr:${error.code}]`, redact(error.detail ?? error.message))
}

type Params = Record<string, string | number>

/** Mensaje de error que viene en el cuerpo: `{ error: { code, message } }`. */
async function errorMessageOf(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } }
    return body.error?.message ?? ''
  } catch {
    return ''
  }
}

/**
 * Un GET a la API de Dolibarr. Sin caché: la caché vive un nivel más arriba,
 * sobre el dato ya transformado.
 */
export async function dolibarrGet<T>(path: string, params: Params = {}): Promise<T> {
  const { base, token } = config()

  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  ).toString()
  // Lo que se registra: ruta y consulta, nunca la base ni las cabeceras.
  const label = `GET ${path}${query ? `?${query}` : ''}`

  let response: Response
  try {
    response = await fetch(`${base}${path}${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { DOLAPIKEY: token, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    throw new DolibarrError('unavailable', `${label}: ${reason}`)
  }

  if (!response.ok) {
    const message = await errorMessageOf(response)
    const detail = `${label} → ${response.status} ${message}`.trim()
    switch (response.status) {
      case 401:
        throw new DolibarrError('unauthorized', detail)
      case 403:
        throw new DolibarrError('forbidden', detail)
      case 404:
        throw new DolibarrError('not_found', detail)
      default:
        throw new DolibarrError('upstream', detail)
    }
  }

  try {
    return (await response.json()) as T
  } catch {
    // Típico de un hosting que devuelve una página HTML de error con 200.
    throw new DolibarrError('upstream', `${label} → respuesta no JSON`)
  }
}
