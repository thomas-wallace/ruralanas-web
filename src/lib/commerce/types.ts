/**
 * Modelo de dominio del carrito y del checkout.
 *
 * Es el contrato entre la web y el motor transaccional. Hoy ese motor puede
 * ser WooCommerce headless (Store API) o el repositorio local del prototipo;
 * ningún componente sabe cuál de los dos está activo.
 *
 * Regla que condiciona todo el modelo: con piezas únicas, `maxUnits` suele
 * valer 1. El carrito tiene que decirlo en vez de dejar sumar unidades que
 * después el checkout va a rechazar.
 */

import type { CurrencyCode, Money } from '@/lib/catalog/types'

export interface CartLine {
  /** Clave estable de la línea. En WooCommerce es el `item_key`. */
  key: string
  sku: string
  slug: string
  name: string
  image: string
  quantity: number
  /** Unidades que el motor acepta para esta línea. */
  maxUnits: number
  unitPrice: Money
  lineTotal: Money
}

export interface CartTotals {
  currency: CurrencyCode
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  /**
   * `true` cuando los importes ya llevan el impuesto adentro, que es como
   * WooCommerce está configurado hoy: la ficha dice USD 48 y el cliente paga
   * USD 48. En ese caso el impuesto **no se suma** en el resumen — se aclara
   * que va incluido. Sumarlo aparte haría que las líneas no cierren con el
   * total, que es exactamente lo que hace desconfiar en un checkout.
   */
  taxIncluded: boolean
}

export interface ShippingRate {
  id: string
  name: string
  description?: string
  price: number
  currency: CurrencyCode
  selected: boolean
}

/** ISO 3166-1 alfa-2 en `country`. El resto es texto libre del cliente. */
export interface CustomerAddress {
  firstName: string
  lastName: string
  email: string
  phone?: string
  address1: string
  address2?: string
  city: string
  state?: string
  postcode: string
  country: string
}

/** Lo mínimo para pedir tarifas de envío sin haber llenado el formulario. */
export type ShippingQuery = Pick<CustomerAddress, 'country' | 'city' | 'postcode' | 'state'>

export interface Cart {
  lines: CartLine[]
  itemCount: number
  totals: CartTotals
  shippingRates: ShippingRate[]
  needsShipping: boolean
  /** País declarado, para no perder el dato al volver al carrito. */
  country?: string
  /** Avisos del motor: stock que cambió, línea eliminada, cupón inválido. */
  notices: string[]
}

export interface PaymentMethod {
  id: string
  title: string
  description?: string
}

export interface CheckoutRequest {
  customer: CustomerAddress
  paymentMethod: string
  /** Un doble clic no puede crear dos pedidos. */
  idempotencyKey: string
  note?: string
}

export interface CheckoutResult {
  orderId: string
  orderKey: string
  status: string
  total: Money
  /** Las pasarelas que cobran en su propio sitio devuelven a dónde ir. */
  redirectUrl?: string
  /** `true` sólo en modo prototipo: no hubo cobro real. */
  simulated: boolean
}

export interface OrderSummary {
  orderId: string
  status: string
  /** Nunca se deduce del regreso del navegador: lo dice el motor. */
  paid: boolean
  total: Money
  email?: string
  simulated: boolean
}
