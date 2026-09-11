import type { CartOutcome } from './cart-provider'
import type { Dictionary } from '@/lib/i18n'

/**
 * Traduce el error del servidor al idioma de la página.
 *
 * El servidor manda un `code` estable y un texto en español. La interfaz
 * traduce por código; el texto del servidor queda como respaldo para lo que
 * el diccionario todavía no cubre. Nunca se muestra un código pelado.
 */
export function cartErrorMessage(dict: Dictionary, outcome: CartOutcome | null): string | null {
  if (!outcome || outcome.ok) return null
  const code = outcome.code
  if (code && code in dict.cart.errors) {
    return dict.cart.errors[code as keyof typeof dict.cart.errors]
  }
  return outcome.message ?? dict.cart.errors.upstream
}
