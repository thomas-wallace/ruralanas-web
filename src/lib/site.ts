/**
 * Datos del sitio que se usan en más de un lugar: URL pública, contacto y
 * redes. Salen de variables de entorno cuando cambian entre ambientes, y de
 * acá cuando son de la empresa.
 */

export const site = {
  name: 'Ruralanas',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ruralanas.com').replace(/\/$/, ''),
  foundingDate: '2003',
  phone: '+59842476969',
  whatsapp: 'https://wa.me/59842476969',
  instagram: 'https://instagram.com/ruralanas',
  locality: 'Punta del Este',
  country: 'UY',
} as const

/** URL absoluta a partir de una ruta del sitio. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${site.url}/`).toString()
}

/**
 * Si los buscadores pueden indexar este despliegue. Sólo el dominio real: una
 * copia en `*.vercel.app`, un preview o la copia de prueba local competirían
 * con ruralanas.com como contenido duplicado. Los previews de Vercel
 * (`VERCEL_ENV=preview`) nunca se indexan, aunque apunten al dominio.
 */
export const siteIndexable =
  /(^|\.)ruralanas\.com$/.test(new URL(site.url).hostname) && process.env.VERCEL_ENV !== 'preview'
