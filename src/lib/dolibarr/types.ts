/**
 * Tipos de la conexión con Dolibarr.
 *
 * `Raw*` es lo que devuelve el ERP, sólo con los campos que se leen: todo llega
 * como texto aunque sea un número. `Producto` y `Categoria` son lo único que sale
 * por la API de la tienda. Cualquier campo que no esté acá —`cost_price`, `pmp`,
 * proveedores, notas privadas— no sale, porque la transformación construye el
 * objeto nuevo en vez de filtrar el crudo.
 */

type Numeric = string | number | null | undefined

export interface RawProduct {
  id: string | number
  ref: string
  label: string
  /** 0 producto, 1 servicio. */
  type?: Numeric
  /** "A la venta": es el `tosell` de la tabla. */
  status?: Numeric
  description?: string | null
  price?: Numeric
  price_ttc?: Numeric
  tva_tx?: Numeric
  stock_reel?: Numeric
  date_modification?: Numeric
  tms?: Numeric
  date_creation?: Numeric
}

export interface RawWarehouseStock {
  real?: Numeric
}

export interface RawProductStock {
  stock_warehouses?: Record<string, RawWarehouseStock>
}

export interface RawCategory {
  id: string | number
  label: string
  description?: string | null
  fk_parent?: Numeric
}

/** Archivo tal como lo lista `GET /documents`. */
export interface RawDocument {
  name: string
  level1name?: string
  relativename?: string
  date?: Numeric
  size?: Numeric
}

export interface RawDownload {
  filename?: string
  'content-type'?: string
  content: string
  encoding?: string
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion: string
  /** Precio con IVA, en la moneda del ERP. */
  precio: number
  precio_sin_iva: number
  /** Tasa de IVA en porcentaje: 22 = 22%. */
  iva: number
  stock: number
  disponible: boolean
  /** URLs propias de la tienda. Nunca apuntan a Dolibarr. */
  imagenes: string[]
  /** ISO 8601, o null si Dolibarr no trae la fecha. */
  actualizado: string | null
}

export interface Categoria {
  id: number
  nombre: string
  descripcion: string
  /** Id de la categoría madre, o null si es raíz. */
  padre: number | null
}
