/**
 * Moneda en que se muestran los precios.
 *
 * Tres, y sólo tres: dólares, euros y libras. El Reino Unido ve libras, el
 * resto de Europa euros y el resto del mundo dólares. La moneda base del
 * negocio sigue siendo el dólar: Dolibarr, Woo y el cobro trabajan en USD, y
 * euros y libras son una conversión para mostrar.
 *
 * La conversión sale de la cotización del día (ver `rate.ts`) redondeada a la
 * unidad: una prenda artesanal con céntimos se lee como saldo. Mientras Woo
 * cobre sólo en dólares, el carrito lo dice.
 *
 * Este módulo no toca el servidor: lo usan el middleware y el navegador.
 */

import type { Money } from '@/lib/catalog/types'

export const displayCurrencies = ['USD', 'EUR', 'GBP'] as const
export type DisplayCurrency = (typeof displayCurrencies)[number]

/** Cotizaciones desde el dólar. `null` si la API no respondió. */
export type Rates = { EUR: number; GBP: number } | null

/** Cookie con la moneda elegida o detectada. La escribe el middleware la primera vez. */
export const CURRENCY_COOKIE = 'rl_currency'

/** Reino Unido y las dependencias de la Corona, que usan la libra. */
const POUND_COUNTRIES = new Set(['GB', 'IM', 'JE', 'GG'])

/**
 * El resto de Europa geográfica, no sólo la zona euro: a un cliente de Suiza o
 * Suecia el euro le resulta más cercano que el dólar. Rusia y Bielorrusia no
 * están: no se les vende.
 */
const EURO_COUNTRIES = new Set([
  'AD', 'AL', 'AT', 'BA', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FO', 'FR', 'GI', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC',
  'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'SE', 'SI', 'SK', 'SM',
  'UA', 'VA', 'XK',
])

export function currencyForCountry(country: string | null | undefined): DisplayCurrency {
  const code = country?.toUpperCase() ?? ''
  if (POUND_COUNTRIES.has(code)) return 'GBP'
  if (EURO_COUNTRIES.has(code)) return 'EUR'
  return 'USD'
}

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return typeof value === 'string' && (displayCurrencies as readonly string[]).includes(value)
}

/**
 * Pasa un precio a la moneda de la vidriera. Sin cotización, o si el precio no
 * está en dólares, queda como vino: mostrar dólares es siempre correcto,
 * porque es lo que se cobra.
 */
export function toDisplay(money: Money, currency: DisplayCurrency, rates: Rates): Money {
  if (currency === 'USD' || money.currency !== 'USD' || !rates) return money
  return { amount: Math.round(money.amount * rates[currency]), currency }
}
