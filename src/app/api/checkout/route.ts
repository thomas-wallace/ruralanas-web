/**
 * Checkout — capa BFF.
 *
 * `GET`  lista los medios de pago que el motor tiene habilitados.
 * `POST` crea el pedido y devuelve, si corresponde, a dónde manda la pasarela.
 *
 * Dos cosas que `01-web/checkout.md` exige y que se resuelven acá:
 *
 *   · **Idempotencia.** La Store API no la trae. Un doble envío del formulario
 *     crearía dos pedidos con las mismas piezas únicas, y una de las dos ventas
 *     no se puede cumplir. La clave del intento se recuerda unos minutos y el
 *     segundo envío recibe el pedido que ya existe.
 *   · **La página de gracias no es la fuente de verdad del cobro.** Esta ruta
 *     devuelve el pedido creado, no un pago confirmado.
 */

import { commerce } from '@/lib/commerce'
import { CommerceError } from '@/lib/commerce/errors'
import { contextFrom, respondWith, respondWithError } from '@/lib/commerce/session'
import type { CheckoutResult, CustomerAddress } from '@/lib/commerce/types'

export const dynamic = 'force-dynamic'

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000
const attempts = new Map<string, { result: CheckoutResult; expiresAt: number }>()

function rememberedAttempt(key: string): CheckoutResult | null {
  const hit = attempts.get(key)
  if (!hit) return null
  if (hit.expiresAt < Date.now()) {
    attempts.delete(key)
    return null
  }
  return hit.result
}

const REQUIRED: (keyof CustomerAddress)[] = [
  'firstName',
  'lastName',
  'email',
  'address1',
  'city',
  'postcode',
  'country',
]

function readCustomer(value: unknown): CustomerAddress {
  const raw = (value ?? {}) as Record<string, unknown>
  const customer: Record<string, string> = {}

  for (const [field, entry] of Object.entries(raw)) {
    if (typeof entry === 'string') customer[field] = entry.trim()
  }

  const missing = REQUIRED.filter((field) => !customer[field])
  if (missing.length > 0) {
    throw new CommerceError('invalid_request', 'Faltan datos de envío.', `campos: ${missing.join(', ')}`)
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email ?? '')) {
    throw new CommerceError('invalid_request', 'El email no parece válido.')
  }

  return { ...customer, country: (customer.country ?? '').toUpperCase() } as unknown as CustomerAddress
}

export async function GET(request: Request) {
  try {
    const { data, token, cookies } = await commerce.listPaymentMethods(contextFrom(request))
    return respondWith(data, token, cookies)
  } catch (error) {
    return respondWithError(error)
  }
}

export async function POST(request: Request) {
  const context = contextFrom(request)

  try {
    const body = (await request.json()) as {
      customer?: unknown
      paymentMethod?: unknown
      idempotencyKey?: unknown
      note?: unknown
    }

    const idempotencyKey =
      typeof body.idempotencyKey === 'string' && body.idempotencyKey.length >= 8
        ? body.idempotencyKey
        : null
    if (!idempotencyKey) {
      throw new CommerceError('invalid_request', 'Falta la clave de idempotencia del intento.')
    }

    const already = rememberedAttempt(idempotencyKey)
    if (already) return respondWith(already, null)

    // Con el checkout alojado en Woo, los datos del cliente y el medio de pago
    // los pide la pasarela: acá sólo se abre la puerta con el carrito armado.
    if (commerce.needsCustomerAtCheckout && (typeof body.paymentMethod !== 'string' || !body.paymentMethod)) {
      throw new CommerceError('invalid_request', 'Elegí un medio de pago.')
    }

    const { data, token, cookies } = await commerce.checkout(context, {
      customer: commerce.needsCustomerAtCheckout
        ? readCustomer(body.customer)
        : ({} as ReturnType<typeof readCustomer>),
      paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod : '',
      idempotencyKey,
      note: typeof body.note === 'string' ? body.note : undefined,
    })

    // Un salto al checkout alojado no crea pedido: recordarlo bloquearía el
    // segundo intento legítimo de alguien que volvió atrás.
    if (data.orderId) {
      attempts.set(idempotencyKey, { result: data, expiresAt: Date.now() + IDEMPOTENCY_TTL_MS })
    }
    return respondWith(data, token, cookies)
  } catch (error) {
    return respondWithError(error)
  }
}
