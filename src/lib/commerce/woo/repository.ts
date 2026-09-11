import 'server-only'

/**
 * WooCommerce headless como motor transaccional (D-010).
 *
 * Woo aporta carrito, checkout, pedidos y pagos, y nada más. El catálogo sigue
 * saliendo de Dolibarr: acá sólo entran SKU, cantidades y direcciones. Por eso
 * lo único que este archivo traduce del modelo de Woo al del sitio son
 * importes, límites de cantidad y tarifas de envío.
 *
 * Los importes de la Store API vienen como cadenas en unidades mínimas junto a
 * `currency_minor_unit`. Convertirlos con `Number()` a secas es el error
 * clásico: 24900 no son 24.900 dólares.
 */

import { CommerceError } from '../errors'
import type { CommerceContext, CommerceRepository, CommerceResult } from '../repository'
import type {
  Cart,
  CartLine,
  CartTotals,
  CheckoutRequest,
  CheckoutResult,
  OrderSummary,
  PaymentMethod,
  ShippingQuery,
  ShippingRate,
} from '../types'
import type { CurrencyCode } from '@/lib/catalog/types'
import { humanizeName } from '@/lib/catalog/woo-text'
import { harvestCredentials, wooRequest, wooWrite, type WooCredentials } from './client'
import { resolveSku } from './sku-map'

// ── Formas que devuelve la Store API ─────────────────────────────────────────

interface WooPrices {
  price: string
  regular_price: string
  currency_code: string
  currency_minor_unit: number
}

/** Con precios con impuesto incluido, `line_total` viene neto: hay que
 *  volver a sumarle el impuesto para mostrar lo que el cliente ve en la ficha. */
interface WooItem {
  key: string
  id: number
  quantity: number
  name: string
  sku: string
  permalink: string
  variation?: { attribute: string; value: string }[]
  images: { src: string; thumbnail?: string; alt?: string }[]
  prices: WooPrices
  totals: {
    line_total: string
    line_total_tax: string
    currency_code: string
    currency_minor_unit: number
  }
  quantity_limits?: { maximum?: number }
}

interface WooTotals {
  total_items: string
  total_items_tax: string
  total_shipping: string | null
  total_shipping_tax: string | null
  total_tax: string
  total_discount: string
  total_price: string
  currency_code: string
  currency_minor_unit: number
}

interface WooShippingRate {
  rate_id: string
  name: string
  description?: string
  delivery_time?: string
  price: string
  currency_code: string
  currency_minor_unit: number
  selected: boolean
}

interface WooCart {
  items: WooItem[]
  items_count: number
  needs_shipping: boolean
  totals: WooTotals
  shipping_rates?: { shipping_rates: WooShippingRate[] }[]
  shipping_address?: { country?: string }
  payment_methods?: string[]
  errors?: { message?: string }[]
}

interface WooOrder {
  id: number
  status: string
  order_key: string
  needs_payment?: boolean
  totals: WooTotals
  billing_address?: { email?: string }
  payment_result?: { payment_status?: string; redirect_url?: string }
}

// ── Traducciones ─────────────────────────────────────────────────────────────

const CURRENCIES: CurrencyCode[] = ['USD', 'UYU', 'ARS', 'EUR']

function currency(code: string): CurrencyCode {
  const found = CURRENCIES.find((item) => item === code.toUpperCase())
  return found ?? 'USD'
}

/** Unidades mínimas → importe real. */
function amount(value: string | null | undefined, minorUnit: number): number {
  if (!value) return 0
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return 0
  return parsed / 10 ** minorUnit
}

/** El slug del catálogo propio, que es como navegan las fichas del sitio. */
function slugFromPermalink(permalink: string): string {
  try {
    const segments = new URL(permalink).pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? ''
  } catch {
    return ''
  }
}

function toLine(item: WooItem): CartLine {
  const unit = amount(item.prices.price, item.prices.currency_minor_unit)
  // Woo devuelve el nombre del padre; el color elegido va aparte. En el
  // carrito hay que verlos juntos o dos líneas parecen la misma pieza.
  const variant = (item.variation ?? []).map((entry) => entry.value).join(' · ')
  const name = humanizeName(item.name)

  return {
    key: item.key,
    sku: item.sku,
    slug: slugFromPermalink(item.permalink),
    name: variant ? `${name} · ${variant}` : name,
    image: item.images[0]?.src ?? '',
    quantity: item.quantity,
    // Sin límite declarado se asume el stock que ya está en el carrito: con
    // piezas únicas, permitir "+1" a ciegas es prometer lo que no hay.
    maxUnits: item.quantity_limits?.maximum ?? item.quantity,
    unitPrice: { amount: unit, currency: currency(item.prices.currency_code) },
    lineTotal: {
      amount:
        amount(item.totals.line_total, item.totals.currency_minor_unit) +
        amount(item.totals.line_total_tax, item.totals.currency_minor_unit),
      currency: currency(item.totals.currency_code),
    },
  }
}

function toTotals(totals: WooTotals): CartTotals {
  const unit = totals.currency_minor_unit

  // Woo devuelve los subtotales netos y el impuesto aparte, aunque la tienda
  // muestre los precios con impuesto incluido. Si se copian tal cual, el
  // carrito dice 243 + 54 y un total de 297 que no coincide con las líneas.
  const itemsNet = amount(totals.total_items, unit)
  const itemsTax = amount(totals.total_items_tax, unit)
  const shippingNet = amount(totals.total_shipping, unit)
  const shippingTax = amount(totals.total_shipping_tax, unit)
  const tax = amount(totals.total_tax, unit)
  const total = amount(totals.total_price, unit)

  const subtotal = itemsNet + itemsTax
  const shipping = shippingNet + shippingTax

  // Si sumar los brutos ya da el total, el impuesto viaja dentro de ellos.
  const taxIncluded = tax > 0 && Math.abs(subtotal + shipping - total) < 0.01

  return {
    currency: currency(totals.currency_code),
    subtotal: taxIncluded ? subtotal : itemsNet,
    shipping: taxIncluded ? shipping : shippingNet,
    tax,
    discount: amount(totals.total_discount, unit),
    total,
    taxIncluded,
  }
}

function toRates(cart: WooCart): ShippingRate[] {
  return (cart.shipping_rates ?? []).flatMap((pack) =>
    pack.shipping_rates.map((rate) => ({
      id: rate.rate_id,
      name: rate.name,
      description: rate.delivery_time || rate.description || undefined,
      price: amount(rate.price, rate.currency_minor_unit),
      currency: currency(rate.currency_code),
      selected: rate.selected,
    })),
  )
}

/** Títulos legibles de los medios verificados el 19-08-2026 (checkout.md). */
const METHOD_TITLES: Record<string, string> = {
  bacs: 'Transferencia bancaria',
  ppcp: 'PayPal',
  'ppcp-gateway': 'PayPal',
  cod: 'Pago contra entrega',
  cheque: 'Cheque',
}

function toCart(cart: WooCart): Cart {
  return {
    lines: (cart.items ?? []).map(toLine),
    itemCount: cart.items_count ?? 0,
    totals: toTotals(cart.totals),
    shippingRates: toRates(cart),
    needsShipping: cart.needs_shipping ?? true,
    country: cart.shipping_address?.country || undefined,
    notices: (cart.errors ?? []).map((error) => error.message ?? '').filter(Boolean),
  }
}

// ── Repositorio ──────────────────────────────────────────────────────────────

function credentialsFrom(context: CommerceContext): WooCredentials {
  return { cartToken: context.token, nonce: null, cookie: context.cookie }
}

function wrap<T>(data: T, credentials: WooCredentials): CommerceResult<T> {
  return { data, token: credentials.cartToken, cookies: credentials.setCookie }
}

async function readCart(credentials: WooCredentials): Promise<CommerceResult<Cart>> {
  const { data, credentials: next } = await wooRequest<WooCart>({ path: '/cart', credentials })
  return wrap(toCart(data), next)
}

export const wooCommerceRepository: CommerceRepository = {
  kind: 'woo',
  needsCustomerAtCheckout: true,

  async getCart(context) {
    return readCart(credentialsFrom(context))
  },

  async addItem(context, { sku, quantity, commerceId, variation }) {
    // Sin token todavía no hay sesión: el primer GET la crea y de paso trae
    // el nonce que la escritura necesita.
    const credentials = await harvestCredentials(credentialsFrom(context))

    // Con el catálogo leído de Woo el identificador ya viene resuelto y no
    // hace falta el mapa. Con el catálogo del ERP llega sólo el SKU.
    const ref = commerceId
      ? { id: Number(commerceId), variation: variation ?? [] }
      : await resolveSku(sku, credentials)

    if (!Number.isFinite(ref.id) || ref.id <= 0) {
      throw new CommerceError(
        'unknown_sku',
        'Esta pieza todavía no está disponible para comprar online.',
        `commerceId inválido para ${sku}: ${commerceId}`,
      )
    }

    const { data, credentials: next } = await wooWrite<WooCart>(
      '/cart/add-item',
      'POST',
      { id: ref.id, quantity, variation: ref.variation },
      credentials,
    )
    return wrap(toCart(data), next)
  },

  async updateItem(context, { key, quantity }) {
    const { data, credentials: next } = await wooWrite<WooCart>(
      '/cart/update-item',
      'POST',
      { key, quantity },
      credentialsFrom(context),
    )
    return wrap(toCart(data), next)
  },

  async removeItem(context, { key }) {
    const { data, credentials: next } = await wooWrite<WooCart>(
      '/cart/remove-item',
      'POST',
      { key },
      credentialsFrom(context),
    )
    return wrap(toCart(data), next)
  },

  async updateCustomer(context, address: ShippingQuery) {
    const shipping = {
      country: address.country,
      city: address.city,
      postcode: address.postcode,
      state: address.state ?? '',
    }
    const { data, credentials: next } = await wooWrite<WooCart>(
      '/cart/update-customer',
      'POST',
      { shipping_address: shipping, billing_address: shipping },
      credentialsFrom(context),
    )
    return wrap(toCart(data), next)
  },

  async selectShippingRate(context, { rateId }) {
    const { data, credentials: next } = await wooWrite<WooCart>(
      '/cart/select-shipping-rate',
      'POST',
      { package_id: 0, rate_id: rateId },
      credentialsFrom(context),
    )
    return wrap(toCart(data), next)
  },

  async listPaymentMethods(context) {
    const { data, credentials: next } = await wooRequest<WooCart>({
      path: '/cart',
      credentials: credentialsFrom(context),
    })
    const methods: PaymentMethod[] = (data.payment_methods ?? []).map((id) => ({
      id,
      title: METHOD_TITLES[id] ?? id,
    }))
    return wrap(methods, next)
  },

  async checkout(context, request: CheckoutRequest) {
    const address = {
      first_name: request.customer.firstName,
      last_name: request.customer.lastName,
      address_1: request.customer.address1,
      address_2: request.customer.address2 ?? '',
      city: request.customer.city,
      state: request.customer.state ?? '',
      postcode: request.customer.postcode,
      country: request.customer.country,
      email: request.customer.email,
      phone: request.customer.phone ?? '',
    }

    const { data, credentials: next } = await wooWrite<WooOrder>(
      '/checkout',
      'POST',
      {
        billing_address: address,
        shipping_address: address,
        customer_note: request.note ?? '',
        payment_method: request.paymentMethod,
        payment_data: [],
      },
      credentialsFrom(context),
    )

    if (!data?.id) {
      throw new CommerceError('upstream', 'El pedido no se pudo crear.', JSON.stringify(data))
    }

    return wrap(
      {
        orderId: String(data.id),
        orderKey: data.order_key,
        status: data.status,
        total: {
          amount: amount(data.totals.total_price, data.totals.currency_minor_unit),
          currency: currency(data.totals.currency_code),
        },
        redirectUrl: data.payment_result?.redirect_url || undefined,
        simulated: false,
      } satisfies CheckoutResult,
      next,
    )
  },

  async getOrder(context, { orderId, orderKey }) {
    const { data, credentials: next } = await wooRequest<WooOrder>({
      path: `/order/${encodeURIComponent(orderId)}?key=${encodeURIComponent(orderKey)}`,
      credentials: credentialsFrom(context),
    })

    // El cobro lo confirma el motor, nunca el regreso del navegador. Si el
    // cliente cerró la pestaña en la pasarela, esto dirá `paid: false` y el
    // webhook al servicio de integración lo corregirá cuando llegue.
    const paid = data.needs_payment === false || data.payment_result?.payment_status === 'success'

    return wrap(
      {
        orderId: String(data.id),
        status: data.status,
        paid,
        total: {
          amount: amount(data.totals.total_price, data.totals.currency_minor_unit),
          currency: currency(data.totals.currency_code),
        },
        email: data.billing_address?.email,
        simulated: false,
      } satisfies OrderSummary,
      next,
    )
  },
}


/**
 * Variante con **el checkout alojado en WooCommerce** (D-017).
 *
 * Todo el carrito se arma en el storefront contra la Store API; el botón de
 * finalizar compra entrega a la página `/checkout/` de Woo, que es la que
 * cobra. La razón es dura y verificada el 05-09-2026: la Store API sólo expone
 * los medios compatibles con Blocks —hoy `bacs` y `ppcp`—, así que un checkout
 * propio **no puede cobrar** con Stripe ni Mercado Pago, que son los que este
 * negocio necesita. Delegar no es comodidad, es la única vía que cobra.
 *
 * El traspaso funciona porque la sesión de carrito es la misma: las cookies
 * que devuelve Woo se trasladan al navegador, y `/checkout/` encuentra el
 * carrito ya armado. **Eso exige que el storefront y WooCommerce estén en el
 * mismo origen**; con dominios distintos el navegador descarta esas cookies y
 * el cliente llegaría al checkout con el carrito vacío.
 */
export const wooHostedRepository: CommerceRepository = {
  ...wooCommerceRepository,
  kind: 'woo-hosted',
  needsCustomerAtCheckout: false,

  /** No se elige medio de pago acá: eso pasa del otro lado. */
  async listPaymentMethods(context) {
    return { data: [], token: context.token }
  },

  async checkout(context) {
    const url = process.env.WOO_CHECKOUT_URL
    const site = process.env.NEXT_PUBLIC_SITE_URL
    if (url && site) {
      try {
        if (new URL(url).origin !== new URL(site).origin) {
          // No se corta el flujo —puede haber un proxy delante que sí unifique
          // el origen— pero queda dicho: si el cliente llega al checkout con
          // el carrito vacío, este es el motivo.
          console.warn(
            `[commerce:woo-hosted] El checkout (${new URL(url).origin}) no comparte origen con el sitio (${new URL(site).origin}). La cookie de sesión del carrito no va a viajar.`,
          )
        }
      } catch {
        /* URLs mal formadas: lo dirá el propio salto. */
      }
    }

    if (!url) {
      throw new CommerceError(
        'unavailable',
        'No podemos abrir el pago en este momento.',
        'WOO_CHECKOUT_URL vacía con COMMERCE_SOURCE=woo-hosted',
      )
    }

    // Se relee el carrito para devolver el total real que el cliente vio, y de
    // paso para arrastrar las cookies de sesión al navegador antes del salto.
    const { data: cart, token, cookies } = await readCart(credentialsFrom(context))
    if (cart.lines.length === 0) {
      throw new CommerceError('invalid_request', 'El carrito está vacío.')
    }

    return {
      data: {
        // Todavía no hay pedido: lo crea Woo cuando el cliente confirme.
        orderId: '',
        orderKey: '',
        status: 'redirect',
        total: { amount: cart.totals.total, currency: cart.totals.currency },
        redirectUrl: url,
        simulated: false,
      },
      token,
      cookies,
    }
  },

  async getOrder() {
    // La página de gracias vive en Woo en este modo. Si alguien llega igual a
    // la nuestra, es mejor decir que no sabemos que inventar un estado.
    throw new CommerceError(
      'not_found',
      'El estado del pedido lo confirma la tienda por email.',
      'getOrder no aplica con el checkout alojado en Woo',
    )
  },
}
