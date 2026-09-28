import 'server-only'

import { NextResponse } from 'next/server'
import type { CacheStatus } from './cache'
import { logDolibarrError } from './client'
import { isDolibarrError } from './errors'

/**
 * Respuesta exitosa. `s-maxage` deja que una caché intermedia (LiteSpeed, una
 * CDN) sostenga el mismo tiempo que la caché del servidor; `X-Cache` dice si
 * esta respuesta le costó una llamada al ERP.
 */
export function respondWithData(body: unknown, ttlSeconds: number, cache: CacheStatus): NextResponse {
  return NextResponse.json(body, {
    headers: {
      'Cache-Control': `public, max-age=0, s-maxage=${ttlSeconds}`,
      'X-Cache': cache,
    },
  })
}

/**
 * Mismo formato de error que el resto de la API: `{ error: { code, message } }`.
 * El detalle técnico se registra en el servidor —sin el token— y no viaja.
 */
export function respondWithDolibarrError(error: unknown): NextResponse {
  if (isDolibarrError(error)) {
    if (error.code !== 'not_found') logDolibarrError(error)
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  console.error('[dolibarr:unhandled]', error)
  return NextResponse.json(
    { error: { code: 'upstream', message: 'No pudimos leer el catálogo del ERP.' } },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}
