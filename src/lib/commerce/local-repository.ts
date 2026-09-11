import 'server-only'

/**
 * Motor transaccional de prototipo.
 *
 * Existe para que el carrito y el checkout se puedan construir, revisar y
 * corregir **antes** de que WooCommerce esté conectado. Calcula sobre el mismo
 * catálogo que ve el sitio, respeta la disponibilidad real de cada pieza y
 * recorre exactamente los pasos 3 a 8 de `01-web/checkout.md`.
 *
 * Lo que no hace, y no puede disimular: **no cobra**. Todo pedido que sale de
 * acá viaja con `simulated: true` y la página de gracias lo dice con todas las
 * letras. Un checkout de mentira que se ve como uno de verdad es peor que no
 * tener checkout.
 *
 * Se apaga poniendo `COMMERCE_SOURCE=woo`.
 */

import { catalog } from '@/lib/catalog'
import type { Product } from '@/lib/catalog/types'
import { CommerceError } from './errors'
import type { CommerceContext, CommerceRepository, CommerceResult } from './repository'
import type {
  Cart,
  CartLine,
  CheckoutRequest,
  CheckoutResult,
  OrderSummary,
  PaymentMethod,
  ShippingQuery,
  ShippingRate,
} from './types'

interface StoredLine {
  sku: string
  slug: string
  quantity: number
  /** Valor de la variante elegida, cuando la pieza tiene color. */
  value?: string
  label?: string
}

/** Dos colores de la misma pieza son dos líneas distintas del carrito. */
function lineKey(sku: string, value?: string): string {
  return value ? `${sku}::${value}` : sku
}

interface StoredCart {
  v: 1
  lines: StoredLine[]
  ship?: ShippingQuery
  rate?: string
}

const EMPTY: StoredCart = { v: 1, lines: [] }

function decode(token: string | null): StoredCart {
  if (!token) return EMPTY
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as StoredCart
    if (parsed?.v !== 1 || !Array.isArray(parsed.lines)) return EMPTY
    return parsed
  } catch {
    return EMPTY
  }
}

function encode(cart: StoredCart): string {
  return Buffer.from(JSON.stringify(cart), 'utf8').toString('base64url')
}

/**
 * Tarifas de muestra. Las reales salen del módulo 06 y de la configuración de
 * Woo; acá sólo tienen que ser verosímiles para poder mirar el diseño con un
 * número al lado.
 */
const RATES: { id: string; name: string; description: string; price: number; countries?: string[] }[] = [
  { id: 'local:uy', name: 'Envío nacional', description: '2 a 4 días hábiles', price: 8, countries: ['UY'] },
  { id: 'local:region', name: 'Courier regional', description: '5 a 9 días hábiles', price: 24, countries: ['AR', 'BR', 'CL', 'PY'] },
  { id: 'local:world', name: 'Courier internacional', description: '7 a 14 días hábiles', price: 39 },
]

function ratesFor(country: string | undefined, selected: string | undefined): ShippingRate[] {
  if (!country) return []
  const code = country.toUpperCase()
  const available = RATES.filter((rate) => !rate.countries || rate.countries.includes(code))
  const pool = available.length > 0 ? available : RATES.filter((rate) => !rate.countries)

  return pool.map((rate, index) => ({
    id: rate.id,
    name: rate.name,
    description: rate.description,
    price: rate.price,
    currency: 'USD' as const,
    selected: selected ? rate.id === selected : index === 0,
  }))
}

/** Unidades que el catálogo permite comprometer hoy para esta pieza. */
function maxUnitsOf(product: Product): number {
  switch (product.availability.state) {
    case 'sold_out':
      return 0
    case 'made_to_order':
      return 1
    default:
      return Math.max(1, product.availability.units)
  }
}

async function build(
  stored: StoredCart,
  context: CommerceContext,
): Promise<{ cart: Cart; stored: StoredCart }> {
  const lines: CartLine[] = []
  const kept: StoredLine[] = []
  const notices: string[] = []

  for (const line of stored.lines) {
    const product = await catalog.getProduct(line.slug, context.locale)
    if (!product) {
      notices.push('Una pieza dejó de estar en el catálogo y se quitó del carrito.')
      continue
    }

    const max = maxUnitsOf(product)
    if (max === 0) {
      notices.push(`${product.name} se agotó y se quitó del carrito.`)
      continue
    }

    const quantity = Math.min(line.quantity, max)
    if (quantity < line.quantity) {
      notices.push(`Quedaba menos stock de ${product.name}: se ajustó la cantidad.`)
    }

    kept.push({ ...line, quantity })
    lines.push({
      key: lineKey(line.sku, line.value),
      sku: line.sku,
      slug: line.slug,
      name: line.label ? `${product.name} · ${line.label}` : product.name,
      image: product.image.src,
      quantity,
      maxUnits: max,
      unitPrice: product.price,
      lineTotal: { amount: product.price.amount * quantity, currency: product.price.currency },
    })
  }

  const nextStored: StoredCart = { ...stored, lines: kept }
  const shippingRates = ratesFor(nextStored.ship?.country, nextStored.rate)
  const chosen = shippingRates.find((rate) => rate.selected)

  const subtotal = lines.reduce((total, line) => total + line.lineTotal.amount, 0)
  const shipping = lines.length > 0 ? (chosen?.price ?? 0) : 0

  return {
    stored: nextStored,
    cart: {
      lines,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      totals: {
        currency: lines[0]?.unitPrice.currency ?? 'USD',
        subtotal,
        shipping,
        // La exportación desde Uruguay va sin IVA; el impuesto real lo calcula
        // Woo cuando esté conectado.
        tax: 0,
        discount: 0,
        total: subtotal + shipping,
        taxIncluded: false,
      },
      shippingRates,
      needsShipping: lines.length > 0,
      country: nextStored.ship?.country,
      notices,
    },
  }
}

async function respond(
  stored: StoredCart,
  context: CommerceContext,
): Promise<CommerceResult<Cart>> {
  const built = await build(stored, context)
  return { data: built.cart, token: encode(built.stored) }
}

/** Pedidos del prototipo. Viven en memoria y se pierden al reiniciar: sirven
 *  para ver la página de gracias, no para llevar la contabilidad. */
const orders = new Map<string, OrderSummary>()
const idempotency = new Map<string, CheckoutResult>()

export const localCommerceRepository: CommerceRepository = {
  kind: 'local',
  needsCustomerAtCheckout: true,

  async getCart(context) {
    return respond(decode(context.token), context)
  },

  async addItem(context, { sku, slug, quantity, variation }) {
    const stored = decode(context.token)
    const product = await catalog.getProduct(slug, context.locale)
    if (!product) {
      throw new CommerceError('not_found', 'Esa pieza no está en el catálogo.')
    }

    const max = maxUnitsOf(product)
    if (max === 0) {
      throw new CommerceError('out_of_stock', 'Esta pieza está agotada.')
    }

    const value = variation?.[0]?.value
    const key = lineKey(sku, value)
    const existing = stored.lines.find((line) => lineKey(line.sku, line.value) === key)
    const wanted = (existing?.quantity ?? 0) + quantity
    if (wanted > max) {
      // El texto que ve el cliente lo pone el diccionario por código; acá se
      // deja el motivo exacto para el registro del servidor.
      throw new CommerceError(
        'out_of_stock',
        'No queda más stock de esta pieza.',
        product.availability.state === 'made_to_order'
          ? `${sku} se teje a pedido: una unidad por pedido.`
          : `${sku} admite ${max} unidad(es) y se pidieron ${wanted}.`,
      )
    }

    const lines = existing
      ? stored.lines.map((line) =>
          lineKey(line.sku, line.value) === key ? { ...line, quantity: wanted } : line,
        )
      : [...stored.lines, { sku, slug, quantity, value, label: value }]

    return respond({ ...stored, lines }, context)
  },

  async updateItem(context, { key, quantity }) {
    const stored = decode(context.token)
    const lines =
      quantity <= 0
        ? stored.lines.filter((line) => lineKey(line.sku, line.value) !== key)
        : stored.lines.map((line) =>
            lineKey(line.sku, line.value) === key ? { ...line, quantity } : line,
          )
    return respond({ ...stored, lines }, context)
  },

  async removeItem(context, { key }) {
    const stored = decode(context.token)
    return respond(
      { ...stored, lines: stored.lines.filter((line) => lineKey(line.sku, line.value) !== key) },
      context,
    )
  },

  async updateCustomer(context, address: ShippingQuery) {
    const stored = decode(context.token)
    // Cambiar de país invalida la tarifa elegida: no se puede cobrar un envío
    // nacional a Alemania porque quedó seleccionado antes.
    const rate = stored.ship?.country === address.country ? stored.rate : undefined
    return respond({ ...stored, ship: address, rate }, context)
  },

  async selectShippingRate(context, { rateId }) {
    const stored = decode(context.token)
    return respond({ ...stored, rate: rateId }, context)
  },

  async listPaymentMethods(context) {
    const methods: PaymentMethod[] = [
      {
        id: 'simulated',
        title: 'Pago simulado (modo prototipo)',
        description: 'No se cobra nada. Sirve para revisar el flujo de compra completo.',
      },
    ]
    return { data: methods, token: context.token }
  },

  async checkout(context, request: CheckoutRequest) {
    const cached = idempotency.get(request.idempotencyKey)
    if (cached) return { data: cached, token: context.token }

    const { data: cart } = await respond(decode(context.token), context)
    if (cart.lines.length === 0) {
      throw new CommerceError('invalid_request', 'El carrito está vacío.')
    }

    const orderId = `SIM-${Date.now().toString(36).toUpperCase()}`
    const summary: OrderSummary = {
      orderId,
      status: 'simulated',
      paid: false,
      total: { amount: cart.totals.total, currency: cart.totals.currency },
      email: request.customer.email,
      simulated: true,
    }
    orders.set(orderId, summary)

    const result: CheckoutResult = {
      orderId,
      orderKey: orderId,
      status: 'simulated',
      total: summary.total,
      simulated: true,
    }
    idempotency.set(request.idempotencyKey, result)

    // El carrito se vacía, igual que haría Woo al confirmar el pedido.
    return { data: result, token: encode(EMPTY) }
  },

  async getOrder(context, { orderId }) {
    const summary = orders.get(orderId)
    if (!summary) {
      throw new CommerceError('not_found', 'No encontramos ese pedido.')
    }
    return { data: summary, token: context.token }
  },
}
