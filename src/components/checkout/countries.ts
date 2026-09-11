/**
 * Países a los que se despacha.
 *
 * Los cuatro mercados objetivo primero, después el resto de destinos con
 * courier. Los nombres no se escriben a mano: los da `Intl.DisplayNames` en el
 * idioma de la página, así no hay una lista que traducir y mantener.
 *
 * La lista definitiva sale del módulo 06 (envíos y aduana) y de lo que la
 * pasarela acepte cobrar en cada mercado.
 */

export const PRIORITY_COUNTRIES = ['UY', 'US', 'AR', 'ES'] as const

export const OTHER_COUNTRIES = [
  'AU', 'AT', 'BE', 'BR', 'CA', 'CL', 'CO', 'DK', 'FI', 'FR', 'DE', 'IE', 'IT',
  'JP', 'MX', 'NL', 'NZ', 'NO', 'PY', 'PE', 'PT', 'SE', 'CH', 'GB',
] as const

export interface CountryOption {
  code: string
  name: string
}

export function countryOptions(locale: string): { priority: CountryOption[]; rest: CountryOption[] } {
  let display: Intl.DisplayNames | null = null
  try {
    display = new Intl.DisplayNames([locale], { type: 'region' })
  } catch {
    /* Entorno sin ICU completo: queda el código, que sigue siendo usable. */
  }

  const name = (code: string) => display?.of(code) ?? code
  const byName = (a: CountryOption, b: CountryOption) => a.name.localeCompare(b.name, locale)

  return {
    priority: PRIORITY_COUNTRIES.map((code) => ({ code, name: name(code) })),
    rest: OTHER_COUNTRIES.map((code) => ({ code, name: name(code) })).sort(byName),
  }
}
