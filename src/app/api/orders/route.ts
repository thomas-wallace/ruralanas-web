/**
 * Estado de un pedido, para la página de gracias.
 *
 * Se consulta con `id` y `key`: el `order_key` es lo que autoriza a ver un
 * pedido sin cuenta de usuario. Lo que devuelve es lo que el motor sabe en ese
 * instante, que puede ser "creado y sin pagar" — el caso normal cuando el
 * cliente vuelve de la pasarela antes que la confirmación. El cobro definitivo
 * lo confirma el webhook contra el servicio de integración, no esta ruta.
 */

import { commerce } from '@/lib/commerce'
import { CommerceError } from '@/lib/commerce/errors'
import { contextFrom, respondWith, respondWithError } from '@/lib/commerce/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('id')
    const orderKey = url.searchParams.get('key')

    if (!orderId || !orderKey) {
      throw new CommerceError('invalid_request', 'Falta el identificador del pedido.')
    }

    const { data, token, cookies } = await commerce.getOrder(contextFrom(request), { orderId, orderKey })
    return respondWith(data, token, cookies)
  } catch (error) {
    return respondWithError(error)
  }
}
