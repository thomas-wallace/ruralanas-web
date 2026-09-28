/**
 * De la forma de Dolibarr a la forma de la tienda.
 *
 * Dolibarr devuelve los números como texto ("297.00000000") y las fechas como
 * segundos desde 1970, también a veces como texto. Todo se convierte acá, en un
 * solo lugar.
 */

import { decodeEntities } from '@/lib/catalog/woo-text'
import type { Categoria, Producto, RawCategory, RawProduct } from './types'

/** Texto o número → número. Lo que no se pueda leer queda en 0. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function money(value: unknown): number {
  return Math.round(toNumber(value) * 100) / 100
}

/**
 * Las descripciones vienen del editor de Dolibarr, que escribe HTML con
 * entidades latinas (`&eacute;`) que el decodificador de WordPress no conoce.
 */
const LATIN: Record<string, string> = {
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü',
  iexcl: '¡', iquest: '¿', ordf: 'ª', ordm: 'º', deg: '°', laquo: '«', raquo: '»',
}

export function htmlToText(html: string | null | undefined): string {
  if (!html) return ''
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&([A-Za-z]+);/g, (match, name: string) => LATIN[name] ?? match)
  return decodeEntities(text)
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Segundos, milisegundos o "YYYY-MM-DD HH:MM:SS" → ISO. */
export function toIsoDate(...candidates: unknown[]): string | null {
  for (const value of candidates) {
    if (value === null || value === undefined || value === '') continue
    if (typeof value === 'number' || /^\d+$/.test(String(value))) {
      const n = Number(value)
      if (n <= 0) continue
      return new Date(n < 1e12 ? n * 1000 : n).toISOString()
    }
    const parsed = new Date(String(value).replace(' ', 'T'))
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return null
}

export function toProducto(raw: RawProduct, imagenes: string[], stockOverride?: number): Producto {
  const stock = stockOverride ?? toNumber(raw.stock_reel)
  return {
    id: toNumber(raw.id),
    sku: raw.ref,
    nombre: raw.label,
    descripcion: htmlToText(raw.description),
    precio: money(raw.price_ttc),
    precio_sin_iva: money(raw.price),
    iva: toNumber(raw.tva_tx),
    stock,
    disponible: stock > 0,
    imagenes,
    actualizado: toIsoDate(raw.date_modification, raw.tms, raw.date_creation),
  }
}

export function toCategoria(raw: RawCategory): Categoria {
  const padre = toNumber(raw.fk_parent)
  return {
    id: toNumber(raw.id),
    nombre: raw.label,
    descripcion: htmlToText(raw.description),
    padre: padre > 0 ? padre : null,
  }
}
