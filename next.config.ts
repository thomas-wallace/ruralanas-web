import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    // Formatos modernos primero: el catálogo es 100% foto y el LCP depende de esto.
    formats: ['image/avif', 'image/webp'],
    // Las fotos del catálogo se sirven desde la biblioteca de medios de
    // WordPress mientras el módulo 08 no las reemplace.
    remotePatterns: [{ protocol: 'https', hostname: 'ruralanas.com', pathname: '/wp-content/uploads/**' }],
  },
  eslint: {
    // El lint vive en CI, no bloquea el build local.
    ignoreDuringBuilds: true,
  },
}

export default config
