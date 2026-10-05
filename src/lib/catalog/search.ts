/**
 * Búsqueda de texto del catálogo, compartida por los repositorios.
 *
 * El catálogo es chico (decenas de piezas) y se filtra en memoria: no hace
 * falta un índice, pero sí que sea tolerante con cómo escribe la gente.
 */

/** Minúsculas y sin tildes: "flame" encuentra "Flamé" y "lana" encuentra "LANA". */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Cada palabra buscada tiene que aparecer en algún campo, en cualquier orden:
 * "ruana gris" encuentra "Ruana Clásica" en color gris.
 */
export function matchesSearch(search: string, fields: Array<string | null | undefined>): boolean {
  const terms = normalizeForSearch(search).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = normalizeForSearch(fields.filter(Boolean).join(' '))
  return terms.every((term) => haystack.includes(term))
}
