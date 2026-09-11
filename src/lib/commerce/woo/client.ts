import 'server-only'

/**
 * Cliente de bajo nivel de la Store API de WooCommerce.
 *
 * Corre siempre en el servidor. El navegador nunca habla con WordPress: por eso
 * este storefront **no necesita CORS habilitado** en el sitio de Woo, ni expone
 * su dominio, ni deja el `Cart-Token` al alcance de un script de terceros.
 *
 * Dos mecanismos, verificados en la instalación el 19-08-2026 y anotados en
 * `01-web/checkout.md`:
 *
 *   · `Cart-Token` sostiene la sesión anónima. Llega como cabecera de respuesta
 *     y hay que devolverlo en cada llamada siguiente.
 *   · `Nonce` es obligatorio para escribir y **caduca**. Se relee de cada
 *     respuesta y, ante un error de nonce, se reintenta una sola vez con uno
 *     fresco. Un reintento, no un bucle: si el segundo falla, el problema es
 *     otro y tiene que verse.
 */

import { CommerceError } from '../errors'

const NONCE_ERRORS = new Set([
  'woocommerce_rest_missing_nonce',
  'woocommerce_rest_invalid_nonce',
  'woocommerce_rest_cart_token_invalid',
  'rest_cookie_invalid_nonce',
])

export interface WooCredentials {
  cartToken: string | null
  nonce: string | null
  /**
   * Cookies del navegador que hay que reenviar a Woo, y las que Woo devuelve.
   * Con storefront y Woo en el mismo origen, esta es la vía por la que el
   * carrito armado acá sigue vivo al entrar a `/checkout/`.
   */
  cookie?: string
  setCookie?: string[]
}

export interface WooResponse<T> {
  data: T
  credentials: WooCredentials
}

interface WooErrorBody {
  code?: string
  message?: string
  data?: { status?: number; details?: Record<string, { message?: string }> }
}

export function storeApiBase(): string {
  const url = process.env.WOO_STORE_API_URL
  if (!url) {
    throw new CommerceError(
      'unavailable',
      'El motor de compra no está configurado.',
      'WOO_STORE_API_URL vacía con COMMERCE_SOURCE=woo',
    )
  }
  return url.replace(/\/$/, '')
}

/** `getSetCookie` existe en el fetch de Node pero no en la librería DOM. */
function setCookiesOf(headers: Headers): string[] {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] }
  if (typeof withGetter.getSetCookie === 'function') return withGetter.getSetCookie()
  const single = headers.get('set-cookie')
  return single ? [single] : []
}

function readCredentials(response: Response, previous: WooCredentials): WooCredentials {
  const fresh = setCookiesOf(response.headers)
  return {
    cartToken: response.headers.get('cart-token') ?? previous.cartToken,
    nonce: response.headers.get('nonce') ?? previous.nonce,
    cookie: previous.cookie,
    setCookie: fresh.length > 0 ? [...(previous.setCookie ?? []), ...fresh] : previous.setCookie,
  }
}

/**
 * Traduce el error de Woo a algo que se pueda mostrar. `details` aparece
 * cuando el checkout rechaza campos concretos del formulario.
 */
function toCommerceError(status: number, body: WooErrorBody): CommerceError {
  const code = body.code ?? ''
  const detail = `${status} ${code}: ${body.message ?? ''}`

  if (code === 'woocommerce_rest_product_partially_out_of_stock' ||
      code === 'woocommerce_rest_product_out_of_stock' ||
      code === 'woocommerce_rest_invalid_stock_availability') {
    return new CommerceError('out_of_stock', 'La pieza ya no está disponible.', detail)
  }
  if (code === 'woocommerce_rest_cart_invalid_product' || status === 404) {
    return new CommerceError('not_found', 'La pieza no existe en el motor de compra.', detail)
  }
  if (status === 400) {
    return new CommerceError('invalid_request', body.message ?? 'Datos inválidos.', detail)
  }
  return new CommerceError('upstream', 'El motor de compra devolvió un error.', detail)
}

interface RequestOptions {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  credentials: WooCredentials
  /** Uso interno del reintento. */
  attempt?: number
}

/**
 * Una llamada a la Store API. Devuelve el cuerpo tipado y las credenciales
 * actualizadas, que el llamador tiene que arrastrar a la siguiente llamada.
 */
export async function wooRequest<T>({
  path,
  method = 'GET',
  body,
  credentials,
  attempt = 0,
}: RequestOptions): Promise<WooResponse<T>> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (credentials.cartToken) headers['cart-token'] = credentials.cartToken
  if (credentials.nonce) headers['nonce'] = credentials.nonce
  if (credentials.cookie) headers['cookie'] = credentials.cookie
  if (body !== undefined) headers['content-type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${storeApiBase()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // El carrito es personal y cambia en cada llamada: nunca se cachea.
      cache: 'no-store',
    })
  } catch (cause) {
    throw new CommerceError(
      'unavailable',
      'No se pudo contactar el motor de compra.',
      cause instanceof Error ? cause.message : String(cause),
    )
  }

  const next = readCredentials(response, credentials)

  if (response.ok) {
    const data = (response.status === 204 ? null : await response.json()) as T
    return { data, credentials: next }
  }

  let errorBody: WooErrorBody = {}
  try {
    errorBody = (await response.json()) as WooErrorBody
  } catch {
    /* Cuerpo no-JSON: queda el status. */
  }

  // Nonce caducado: se relee de /cart y se reintenta una vez, en silencio.
  if (attempt === 0 && errorBody.code && NONCE_ERRORS.has(errorBody.code)) {
    const refreshed = await harvestCredentials(next)
    return wooRequest<T>({ path, method, body, credentials: refreshed, attempt: 1 })
  }

  throw toCommerceError(response.status, errorBody)
}

/**
 * `GET /cart` sólo para quedarse con `Cart-Token` y `Nonce` frescos. Es el
 * paso previo obligatorio de cualquier escritura cuando todavía no hay nonce.
 */
export async function harvestCredentials(
  credentials: WooCredentials,
): Promise<WooCredentials> {
  const { credentials: next } = await wooRequest<unknown>({
    path: '/cart',
    credentials,
    attempt: 1,
  })
  return next
}

/** Escritura: garantiza nonce antes de salir. */
export async function wooWrite<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  credentials: WooCredentials,
): Promise<WooResponse<T>> {
  const ready = credentials.nonce ? credentials : await harvestCredentials(credentials)
  return wooRequest<T>({ path, method, body, credentials: ready })
}
