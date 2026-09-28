import 'server-only'

/**
 * Lectura del catálogo desde Dolibarr: productos, stock, categorías y fotos.
 *
 * Es la puerta de entrada que usan las rutas `/api/productos` y
 * `/api/categorias`. Todo es de sólo lectura y todo pasa por caché:
 *
 *   listado de productos   5 minutos
 *   detalle de producto    1 minuto (es el que se mira para vender: stock fresco)
 *   categorías             1 hora
 *   listado de fotos       1 hora (y cada foto se baja una sola vez)
 */

import { cached, type CacheStatus } from './cache'
import { dolibarrGet } from './client'
import { DolibarrError, isDolibarrError } from './errors'
import { imagesFor } from './images'
import { toCategoria, toNumber, toProducto } from './transform'
import type { Categoria, Producto, RawCategory, RawProduct, RawProductStock } from './types'

const PAGE_SIZE = 100
/** Tope de seguridad: 100 páginas son 10.000 productos. */
const MAX_PAGES = 100
/** Descargas de fotos en paralelo contra el hosting del ERP. */
const IMAGE_CONCURRENCY = 4

const TTL = {
  productos: 5 * 60 * 1000,
  producto: 60 * 1000,
  categorias: 60 * 60 * 1000,
}

/**
 * Recorre todas las páginas desde la 0. Dolibarr marca el final de dos formas
 * según la versión y el recurso: un array vacío o un 404 ("No product found").
 * Las dos cortan el recorrido.
 */
async function fetchAllPages<T extends { id: string | number }>(
  path: string,
  params: Record<string, string | number>,
): Promise<T[]> {
  const all: T[] = []
  const seen = new Set<string>()

  for (let page = 0; page < MAX_PAGES; page += 1) {
    let batch: T[]
    try {
      batch = await dolibarrGet<T[]>(path, { ...params, limit: PAGE_SIZE, page })
    } catch (error) {
      if (isDolibarrError(error) && error.code === 'not_found') break
      throw error
    }
    if (!Array.isArray(batch)) throw new DolibarrError('upstream', `GET ${path} página ${page}: no es un array`)
    if (batch.length === 0) break

    // Si el servidor ignorara `page`, devolvería siempre lo mismo y el bucle no
    // terminaría nunca. Una página sin ningún id nuevo corta con error.
    const fresh = batch.filter((item) => !seen.has(String(item.id)))
    if (fresh.length === 0) {
      throw new DolibarrError('upstream', `GET ${path} página ${page}: repite la anterior; la paginación no funciona`)
    }
    for (const item of fresh) seen.add(String(item.id))
    all.push(...fresh)
  }

  return all
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index] as T)
    }
  })
  await Promise.all(workers)
  return results
}

export interface Cached<T> {
  data: T
  cache: CacheStatus
}

export async function listProductos(): Promise<Cached<Producto[]>> {
  const { value, status } = await cached('productos', TTL.productos, async () => {
    const raws = await fetchAllPages<RawProduct>('/products', {
      mode: 1,
      sortfield: 't.ref',
      sortorder: 'ASC',
      includestockdata: 1,
      sqlfilters: '(t.tosell:=:1)',
    })
    return mapLimit(raws, IMAGE_CONCURRENCY, async (raw) =>
      toProducto(raw, await imagesFor(toNumber(raw.id), raw.ref)),
    )
  })
  return { data: value, cache: status }
}

/** Stock total sumando depósitos. Sólo se usa si el producto no trae `stock_reel`. */
async function stockByWarehouse(id: number): Promise<number> {
  try {
    const stock = await dolibarrGet<RawProductStock>(`/products/${id}/stock`)
    return Object.values(stock.stock_warehouses ?? {}).reduce((sum, w) => sum + toNumber(w.real), 0)
  } catch (error) {
    // Sin movimientos de stock, Dolibarr responde 404: son cero unidades.
    if (isDolibarrError(error) && error.code === 'not_found') return 0
    throw error
  }
}

/**
 * Detalle por referencia. Devuelve `null` si no existe **o si no está a la
 * venta**: el detalle no puede mostrar lo que el listado esconde. El `null` se
 * cachea igual que un dato, para que pedir referencias inventadas no genere
 * llamadas al ERP.
 */
export async function getProducto(ref: string): Promise<Cached<Producto | null>> {
  const { value, status } = await cached(`producto:${ref}`, TTL.producto, async () => {
    let raw: RawProduct
    try {
      raw = await dolibarrGet<RawProduct>(`/products/ref/${encodeURIComponent(ref)}`, { includestockdata: 1 })
    } catch (error) {
      if (isDolibarrError(error) && error.code === 'not_found') return null
      throw error
    }
    if (toNumber(raw.status) !== 1 || toNumber(raw.type) !== 0) return null

    const id = toNumber(raw.id)
    const hasStock = raw.stock_reel !== null && raw.stock_reel !== undefined && raw.stock_reel !== ''
    const stock = hasStock ? undefined : await stockByWarehouse(id)
    return toProducto(raw, await imagesFor(id, raw.ref), stock)
  })
  return { data: value, cache: status }
}

export async function listCategorias(): Promise<Cached<Categoria[]>> {
  const { value, status } = await cached('categorias', TTL.categorias, async () => {
    const raws = await fetchAllPages<RawCategory>('/categories', {
      type: 'product',
      sortfield: 't.rowid',
      sortorder: 'ASC',
    })
    return raws.map(toCategoria)
  })
  return { data: value, cache: status }
}

export { invalidate as invalidateDolibarrCache } from './cache'
export { DolibarrError, isDolibarrError } from './errors'
export type { Categoria, Producto } from './types'
