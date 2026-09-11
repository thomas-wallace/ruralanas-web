/**
 * Puerto del motor transaccional.
 *
 * Mismo criterio que `CatalogRepository`: toda la web habla con el carrito por
 * esta interfaz. Detrás puede estar WooCommerce vía Store API o el
 * repositorio local del prototipo, y cambiar de uno a otro no toca un solo
 * componente.
 *
 * `token` es la sesión anónima del carrito. En Woo es el `Cart-Token`; en
 * local es el estado serializado. Cada operación puede devolver uno nuevo, y
 * la ruta que la llamó es la que lo guarda en la cookie.
 */

import type {
  Cart,
  CheckoutRequest,
  CheckoutResult,
  CustomerAddress,
  OrderSummary,
  PaymentMethod,
  ShippingQuery,
} from './types'
import type { Locale } from '@/lib/i18n/config'

export interface CommerceContext {
  token: string | null
  locale: Locale
  /**
   * Cookies del navegador que pertenecen al motor. Con el storefront y Woo en
   * el mismo origen, son las que hacen que `/checkout/` vea el mismo carrito
   * que se armó acá. Ver `AddToCartInput` y D-017.
   */
  cookie?: string
}

/**
 * Qué se añade al carrito.
 *
 * `commerceId` viene cuando el catálogo sale del mismo sitio que cobra: es el
 * camino directo y no necesita traducción. Cuando el catálogo salga de
 * Dolibarr llegará sólo el `sku` y el motor lo traducirá con el mapa.
 * `variation` es obligatorio en productos con color: el padre no es comprable.
 */
export interface AddToCartInput {
  sku: string
  slug: string
  quantity: number
  commerceId?: string
  variation?: { attribute: string; value: string }[]
}

export interface CommerceResult<T> {
  data: T
  /** Token a persistir. `null` deja la cookie como estaba. */
  token: string | null
  /** Cabeceras `Set-Cookie` del motor que hay que trasladar al navegador. */
  cookies?: string[]
}

export interface CommerceRepository {
  /** Identifica la implementación activa en logs y en la UI de diagnóstico. */
  readonly kind: 'woo' | 'woo-hosted' | 'local'
  /**
   * `false` cuando el pago se completa fuera del storefront: entonces los
   * datos del cliente los pide la pasarela y exigirlos acá sería pedir dos
   * veces lo mismo.
   */
  readonly needsCustomerAtCheckout: boolean

  getCart(context: CommerceContext): Promise<CommerceResult<Cart>>
  addItem(context: CommerceContext, input: AddToCartInput): Promise<CommerceResult<Cart>>
  updateItem(
    context: CommerceContext,
    input: { key: string; quantity: number },
  ): Promise<CommerceResult<Cart>>
  removeItem(context: CommerceContext, input: { key: string }): Promise<CommerceResult<Cart>>
  /** Paso 4 de checkout.md: sin esto no hay tarifas de envío. */
  updateCustomer(
    context: CommerceContext,
    address: ShippingQuery,
  ): Promise<CommerceResult<Cart>>
  selectShippingRate(
    context: CommerceContext,
    input: { rateId: string },
  ): Promise<CommerceResult<Cart>>
  listPaymentMethods(context: CommerceContext): Promise<CommerceResult<PaymentMethod[]>>
  checkout(
    context: CommerceContext,
    request: CheckoutRequest,
  ): Promise<CommerceResult<CheckoutResult>>
  getOrder(
    context: CommerceContext,
    input: { orderId: string; orderKey: string },
  ): Promise<CommerceResult<OrderSummary>>
}

export type { CustomerAddress }
