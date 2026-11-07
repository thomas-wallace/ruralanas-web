import type { NextConfig } from 'next'

/** Sólo en la copia de prueba: dónde está el WordPress local (ver middleware). */
const wordpressProxy = process.env.WP_PROXY_ORIGIN

const config: NextConfig = {
  reactStrictMode: true,
  // La copia de prueba corre al mismo tiempo que el servidor de desarrollo:
  // cada uno compila en su carpeta para no pisarse la caché.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // WooCommerce usa barra final (`/checkout/`) y redirige si falta. Con el
  // proxy de la copia, Next no tiene que sacarla: se armaría un ciclo.
  skipTrailingSlashRedirect: Boolean(wordpressProxy),
  images: {
    // Formatos modernos primero: el catálogo es 100% foto y el LCP depende de esto.
    formats: ['image/avif', 'image/webp'],
    // Las fotos del catálogo se sirven desde la biblioteca de medios de
    // WordPress mientras el módulo 08 no las reemplace.
    remotePatterns: [
      { protocol: 'https', hostname: 'ruralanas.com', pathname: '/wp-content/uploads/**' },
      // La copia de prueba sirve las fotos desde su propio WordPress.
      ...(wordpressProxy
        ? [{ protocol: 'http' as const, hostname: 'localhost', pathname: '/wp-content/uploads/**' }]
        : []),
    ],
  },
  eslint: {
    // El lint vive en CI, no bloquea el build local.
    ignoreDuringBuilds: true,
  },
}

export default config
