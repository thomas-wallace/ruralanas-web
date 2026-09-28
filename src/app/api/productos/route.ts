import { listProductos } from '@/lib/dolibarr'
import { respondWithData, respondWithDolibarrError } from '@/lib/dolibarr/respond'

/**
 * Todos los productos a la venta en Dolibarr, con stock y fotos propias.
 *
 *   GET /api/productos → { total, productos: Producto[] }
 *
 * Caché de 5 minutos. El stock fino de una pieza se mira en
 * `/api/productos/:ref`, que se cachea un minuto.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, cache } = await listProductos()
    return respondWithData({ total: data.length, productos: data }, 300, cache)
  } catch (error) {
    return respondWithDolibarrError(error)
  }
}
