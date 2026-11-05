import type { MetadataRoute } from 'next'

import { absoluteUrl, site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Las fotos de campañas se sirven desde /api/medios: tienen que poder
      // indexarse aunque el resto de /api no.
      allow: ['/', '/api/medios/'],
      // Transaccional y privado: no aporta nada a un buscador.
      disallow: ['/api/', '/*/admin/', '/*/carrito', '/*/checkout', '/*/gracias'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: site.url,
  }
}
