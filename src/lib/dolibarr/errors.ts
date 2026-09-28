/**
 * Errores de la conexión con Dolibarr, con una causa que se pueda leer.
 *
 * Los 401 y 403 de Dolibarr no son culpa de quien llama a la tienda: son una
 * credencial o un permiso mal configurados de nuestro lado. Por eso salen como
 * 502 con un código propio, no como 401, que le diría al navegador que tiene
 * que autenticarse.
 */

export type DolibarrErrorCode =
  /** Faltan DOLIBARR_URL o DOLIBARR_API_KEY. */
  | 'unconfigured'
  /** 401: token inválido o módulo API REST apagado. */
  | 'unauthorized'
  /** 403: al usuario de API le falta un permiso de lectura. */
  | 'forbidden'
  /** 404: el recurso no existe. */
  | 'not_found'
  /** Dolibarr no respondió (red, DNS, tiempo agotado). */
  | 'unavailable'
  /** Dolibarr respondió con otro error o con algo que no es JSON. */
  | 'upstream'

const STATUS: Record<DolibarrErrorCode, number> = {
  unconfigured: 503,
  unauthorized: 502,
  forbidden: 502,
  not_found: 404,
  unavailable: 503,
  upstream: 502,
}

const MESSAGES: Record<DolibarrErrorCode, string> = {
  unconfigured: 'La conexión con el ERP no está configurada.',
  unauthorized: 'El ERP rechazó la credencial de la tienda: token inválido o módulo API REST desactivado.',
  forbidden: 'El usuario de API del ERP no tiene permiso de lectura sobre este recurso.',
  not_found: 'No existe.',
  unavailable: 'El ERP no responde. Probá de nuevo en unos minutos.',
  upstream: 'El ERP devolvió un error inesperado.',
}

export class DolibarrError extends Error {
  readonly code: DolibarrErrorCode
  readonly status: number
  /** Detalle técnico. Se registra, no se muestra. Nunca contiene el token. */
  readonly detail?: string

  constructor(code: DolibarrErrorCode, detail?: string, message = MESSAGES[code]) {
    super(message)
    this.name = 'DolibarrError'
    this.code = code
    this.status = STATUS[code]
    this.detail = detail
  }
}

export function isDolibarrError(value: unknown): value is DolibarrError {
  return value instanceof DolibarrError
}
