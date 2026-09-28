import { listCategorias } from '@/lib/dolibarr'
import { respondWithData, respondWithDolibarrError } from '@/lib/dolibarr/respond'

/**
 * Categorías de producto de Dolibarr.
 *
 *   GET /api/categorias → { total, categorias: Categoria[] }
 *
 * Caché de 1 hora: cambian muy de vez en cuando.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, cache } = await listCategorias()
    return respondWithData({ total: data.length, categorias: data }, 3600, cache)
  } catch (error) {
    return respondWithDolibarrError(error)
  }
}
