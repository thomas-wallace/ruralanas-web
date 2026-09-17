import 'server-only'

import sanitizeHtml from 'sanitize-html'

/**
 * Limpieza del HTML de los posts.
 *
 * WordPress entrega el contenido envuelto en la maquetación de Elementor:
 * decenas de `div` con clases, estilos en línea y títulos usados como texto.
 * Acá se queda sólo la estructura editorial —párrafos, títulos, listas,
 * enlaces, imágenes y videos de YouTube— y el diseño lo pone el sitio.
 */

const YOUTUBE = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\//

export function sanitizePostHtml(html: string, siteOrigin: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: [
      'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote',
      'figure', 'figcaption', 'img', 'br', 'hr', 'iframe',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      iframe: ['src', 'title', 'allow', 'allowfullscreen', 'loading'],
    },
    allowedSchemes: ['https', 'mailto', 'tel'],
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'],
    // Elementor usa títulos pequeños como párrafo destacado y `h1` dentro del
    // cuerpo: se normalizan para que la jerarquía de la página siga siendo una.
    transformTags: {
      h1: 'h2',
      h5: 'p',
      h6: 'p',
      b: 'strong',
      i: 'em',
      a: (tagName, attribs) => {
        const href = attribs.href ?? ''
        const external = /^https?:/.test(href) && !href.startsWith(siteOrigin)
        const attributes: Record<string, string> = { href }
        if (external) Object.assign(attributes, { target: '_blank', rel: 'noopener noreferrer' })
        return { tagName, attribs: attributes }
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: 'lazy', decoding: 'async' },
      }),
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === 'iframe') return !YOUTUBE.test(frame.attribs.src ?? '')
      // Párrafos y títulos vacíos que deja el maquetador. Uno que sólo tiene
      // una imagen no está vacío.
      if (['p', 'h2', 'h3', 'h4', 'li'].includes(frame.tag)) {
        return !frame.text.trim() && frame.mediaChildren.length === 0
      }
      return false
    },
  })

  return clean.replace(/(\s*<br \/>\s*){2,}/g, '<br />').trim()
}

/** Nombre base de una imagen de WordPress, sin tamaño ni hash de miniatura. */
function imageStem(src: string): string {
  const file = src.split('/').pop() ?? ''
  return file
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/-\d+x\d+$/, '')
    .replace(/-[a-z0-9]{40,}$/, '')
    .toLowerCase()
}

/**
 * Muchos posts repiten la imagen destacada como primera imagen del cuerpo. La
 * página ya la muestra arriba, así que la del cuerpo se quita.
 */
export function dropLeadingImage(html: string, featuredSrc: string | undefined): string {
  if (!featuredSrc) return html
  const match = /^\s*(<p>\s*)?<img[^>]*src="([^"]+)"[^>]*\/?>(\s*<\/p>)?/.exec(html)
  if (!match?.[2] || imageStem(match[2]) !== imageStem(featuredSrc)) return html
  return html.slice(match[0].length).trim()
}
