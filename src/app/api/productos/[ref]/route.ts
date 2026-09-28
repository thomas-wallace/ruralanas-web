import { NextResponse } from 'next/server'
import { getProducto } from '@/lib/dolibarr'
import { respondWithData, respondWithDolibarrError } from '@/lib/dolibarr/respond'

/**
 * Detalle de un producto por su referencia de Dolibarr (el SKU), con el stock
 * actualizado.
 *
 *   GET /api/productos/RL-0042 → Producto
 *
 * Caché de 1 minuto. Un producto que existe pero no está a la venta responde
 * 404, igual que uno que no existe: el detalle no muestra lo que el listado
 * esconde.
 */
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref: rawRef } = await params
  let ref: string
  try {
    ref = decodeURIComponent(rawRef).trim()
  } catch {
    ref = ''
  }

  if (!ref || ref.length > 128 || /[\u0000-\u001f]/.test(ref)) {
    return NextResponse.json(
      { error: { code: 'invalid_request', message: 'Referencia inválida.' } },
      { status: 400 },
    )
  }

  try {
    const { data, cache } = await getProducto(ref)
    if (!data) {
      return NextResponse.json(
        { error: { code: 'not_found', message: `No hay ningún producto a la venta con la referencia «${ref}».` } },
        { status: 404, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60', 'X-Cache': cache } },
      )
    }
    return respondWithData(data, 60, cache)
  } catch (error) {
    return respondWithDolibarrError(error)
  }
}
