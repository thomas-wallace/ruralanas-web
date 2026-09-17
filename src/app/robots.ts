import type { MetadataRoute } from 'next'

import { absoluteUrl, site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Transaccional y privado: no aporta nada a un buscador.
      disallow: ['/api/', '/*/admin/', '/*/carrito', '/*/checkout', '/*/gracias'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: site.url,
  }
}
