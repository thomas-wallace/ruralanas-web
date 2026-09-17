import { notFound } from 'next/navigation'

/**
 * Cualquier URL que no coincide con una página. Sin esta ruta, Next muestra su
 * 404 genérico en vez del del sitio, con header, footer e idioma.
 */
export default function CatchAll() {
  notFound()
}
