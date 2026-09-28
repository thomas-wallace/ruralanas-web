import 'server-only'

import type { Rates } from './config'

/**
 * Cotizaciones USD → EUR y USD → GBP del Banco Central Europeo, vía
 * Frankfurter.
 *
 * Gratis, sin clave y con una actualización por día hábil, que es todo lo que
 * hace falta: el precio en euros o libras no tiene que moverse durante el día.
 * Verificado el 27-09-2026 contra `api.frankfurter.dev/v1`.
 *
 * Si la API no responde, devuelve `null` y el sitio muestra dólares. Es la
 * salida segura: nunca se inventa una cotización.
 */

const URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP'

export async function getRates(): Promise<Rates> {
  try {
    const response = await fetch(URL, { next: { revalidate: 60 * 60 * 12, tags: ['fx'] } })
    if (!response.ok) return null
    const data = (await response.json()) as { rates?: { EUR?: number; GBP?: number } }
    const { EUR, GBP } = data.rates ?? {}
    if (typeof EUR !== 'number' || typeof GBP !== 'number' || EUR <= 0 || GBP <= 0) return null
    return { EUR, GBP }
  } catch {
    return null
  }
}
