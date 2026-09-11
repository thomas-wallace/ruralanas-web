/**
 * Carrito — capa BFF.
 *
 *   navegador → esta ruta (servidor) → motor transaccional
 *
 * Que el navegador no hable nunca con WooCommerce tiene tres consecuencias
 * buenas: no hay que habilitar CORS en WordPress, el dominio de la tienda no
 * se filtra, y el `Cart-Token` queda en una cookie `httpOnly`.
 *
 * `GET`  devuelve el carrito.
 * `POST` recibe una operación etiquetada; todas devuelven el carrito completo,
 * porque cualquier cambio puede mover totales, envío y avisos a la vez.
 */

import { commerce } from '@/lib/commerce'
import { CommerceError } from '@/lib/commerce/errors'
import { contextFrom, respondWith, respondWithError } from '@/lib/commerce/session'
import type { ShippingQuery } from '@/lib/commerce/types'

export const dynamic = 'force-dynamic'

type Operation =
  | {
      op: 'add'
      sku: string
      slug: string
      quantity?: number
      commerceId?: string
      variation?: { attribute: string; value: string }[]
    }
  | { op: 'update'; key: string; quantity: number }
  | { op: 'remove'; key: string }
  | { op: 'customer'; address: ShippingQuery }
  | { op: 'shipping'; rateId: string }

function str(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CommerceError('invalid_request', `Falta el dato: ${field}.`)
  }
  return value.trim()
}

export async function GET(request: Request) {
  try {
    const { data, token, cookies } = await commerce.getCart(contextFrom(request))
    return respondWith(data, token, cookies)
  } catch (error) {
    return respondWithError(error)
  }
}

export async function POST(request: Request) {
  const context = contextFrom(request)

  try {
    const body = (await request.json()) as Partial<Operation>

    switch (body.op) {
      case 'add': {
        const quantity = Math.max(1, Math.trunc(Number(body.quantity ?? 1)))
        const { data, token, cookies } = await commerce.addItem(context, {
          sku: str(body.sku, 'sku'),
          slug: str(body.slug, 'slug'),
          quantity,
          commerceId: typeof body.commerceId === 'string' ? body.commerceId : undefined,
          variation: Array.isArray(body.variation) ? body.variation : undefined,
        })
        return respondWith(data, token, cookies)
      }

      case 'update': {
        const quantity = Math.max(0, Math.trunc(Number(body.quantity)))
        const { data, token, cookies } = await commerce.updateItem(context, {
          key: str(body.key, 'key'),
          quantity,
        })
        return respondWith(data, token, cookies)
      }

      case 'remove': {
        const { data, token, cookies } = await commerce.removeItem(context, { key: str(body.key, 'key') })
        return respondWith(data, token, cookies)
      }

      case 'customer': {
        const address = body.address ?? ({} as ShippingQuery)
        const { data, token, cookies } = await commerce.updateCustomer(context, {
          country: str(address.country, 'país').toUpperCase(),
          city: typeof address.city === 'string' ? address.city : '',
          postcode: typeof address.postcode === 'string' ? address.postcode : '',
          state: typeof address.state === 'string' ? address.state : '',
        })
        return respondWith(data, token, cookies)
      }

      case 'shipping': {
        const { data, token, cookies } = await commerce.selectShippingRate(context, {
          rateId: str(body.rateId, 'rateId'),
        })
        return respondWith(data, token, cookies)
      }

      default:
        throw new CommerceError('invalid_request', 'Operación de carrito desconocida.')
    }
  } catch (error) {
    return respondWithError(error)
  }
}
