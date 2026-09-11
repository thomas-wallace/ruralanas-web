/**
 * Limpieza del texto que llega de WordPress.
 *
 * Vive aparte porque lo necesitan dos capas: el catálogo, al leer productos, y
 * el carrito, al mostrar la línea que devolvió WooCommerce. La misma pieza
 * tiene que llamarse igual en los dos lados.
 */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
}

/** WordPress devuelve entidades HTML incluso en campos de texto plano. */
export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&(\w+);/g, (match, name: string) => ENTITIES[name] ?? match)
}

export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, '\n')).replace(/\n{2,}/g, '\n').trim()
}

/** Palabras que no se capitalizan dentro del título. */
const MINOR_WORDS = new Set(['y', 'de', 'del', 'con', 'la', 'el', 'los', 'las', 'en', 'a', 'para'])

/**
 * Los nombres están cargados EN MAYÚSCULAS en WooCommerce. Con la tipografía
 * de marca eso se lee como un grito. Se convierte a capitalización de título
 * sólo cuando el nombre no tiene ninguna minúscula, para no tocar los que ya
 * vienen bien escritos.
 */
export function humanizeName(raw: string): string {
  const name = decodeEntities(raw).trim()
  if (/[a-záéíóúñü]/.test(name)) return name

  return name
    .toLocaleLowerCase('es')
    .split(/(\s+|\/)/)
    .map((chunk, index) => {
      if (/^\s+$/.test(chunk) || chunk === '/') return chunk
      if (index > 0 && MINOR_WORDS.has(chunk)) return chunk
      return chunk.charAt(0).toLocaleUpperCase('es') + chunk.slice(1)
    })
    .join('')
}
