/**
 * Errores de comercio con una causa que el cliente pueda entender.
 *
 * El caso que obliga a esto está en checkout.md: si la sincronización con Woo
 * falla, el visitante puede intentar comprar algo que en el motor no existe.
 * Eso tiene que llegar a la pantalla como una frase, no como un 500.
 */

export type CommerceErrorCode =
  /** El motor transaccional no está configurado o no responde. */
  | 'unavailable'
  /** El SKU del catálogo no tiene equivalente en el motor. */
  | 'unknown_sku'
  /** No quedan unidades, o se piden más de las que hay. */
  | 'out_of_stock'
  /** Falta un dato o viene mal formado. */
  | 'invalid_request'
  /** El motor respondió, pero con un error propio. */
  | 'upstream'
  | 'not_found'

const STATUS: Record<CommerceErrorCode, number> = {
  unavailable: 503,
  unknown_sku: 409,
  out_of_stock: 409,
  invalid_request: 400,
  upstream: 502,
  not_found: 404,
}

export class CommerceError extends Error {
  readonly code: CommerceErrorCode
  readonly status: number
  /** Texto crudo del motor. Se registra, no se muestra. */
  readonly detail?: string

  constructor(code: CommerceErrorCode, message: string, detail?: string) {
    super(message)
    this.name = 'CommerceError'
    this.code = code
    this.status = STATUS[code]
    this.detail = detail
  }
}

export function isCommerceError(value: unknown): value is CommerceError {
  return value instanceof CommerceError
}
