import 'server-only'

/**
 * Almacén en el WordPress de ruralanas.com (`CONTENT_STORE=wordpress`).
 *
 * Los documentos los guarda el plugin `wordpress/ruralanas-contenido`, en la
 * base de WordPress, y las fotos y videos van a su biblioteca de medios. Así el
 * contenido del admin entra en el mismo backup que los pedidos, y la tienda
 * puede correr en un servidor sin disco propio.
 *
 * La tienda entra con un usuario de rol "Ruralanas · Contenido de la tienda" y
 * una contraseña de aplicación (Usuarios → Perfil → Contraseñas de aplicación):
 * ese rol sólo puede tocar estos documentos y subir archivos. Nunca con un
 * administrador.
 *
 *   CONTENT_WP_USER          usuario de ese rol
 *   CONTENT_WP_APP_PASSWORD  su contraseña de aplicación
 *
 * La dirección es la misma API que ya usa el blog (`WP_API_URL`), sin `/wp/v2`.
 */

import { MEDIA_TYPES, type ContentStore, type MediaExtension, type ReadOptions } from './types'

/** Etiqueta de caché de un documento. Guardarlo la invalida. */
export const documentTag = (name: string) => `content:${name}`

/** Las páginas públicas vuelven a mirar WordPress cada tanto aunque nadie guarde. */
const REVALIDATE_SECONDS = 300

function restRoot(): string | null {
  const api = process.env.WP_API_URL?.trim()
  return api ? api.replace(/\/wp\/v2\/?$/, '') : null
}

export function wordpressConfigured(): boolean {
  return Boolean(
    restRoot() && process.env.CONTENT_WP_USER?.trim() && process.env.CONTENT_WP_APP_PASSWORD?.trim(),
  )
}

function authorization(): string {
  const user = process.env.CONTENT_WP_USER?.trim() ?? ''
  // WordPress muestra la contraseña de aplicación con espacios; los acepta igual.
  const password = process.env.CONTENT_WP_APP_PASSWORD?.trim() ?? ''
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
}

/** Mensaje de un error de WordPress, para mostrar en el admin. */
export async function failure(response: Response, what: string): Promise<Error> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null
  const detail = body?.message ? `: ${body.message}` : ''
  return new Error(`WordPress respondió ${response.status} al ${what}${detail}`)
}

/**
 * Pedido autenticado a la API de WordPress. Lo usan este almacén y quien lea
 * otros datos del mismo plugin (los países con ventas, en `lib/world`).
 */
export async function wordpressRequest(
  pathname: string,
  init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {},
): Promise<Response> {
  const root = restRoot()
  if (!root || !wordpressConfigured()) {
    throw new Error('Falta CONTENT_WP_USER o CONTENT_WP_APP_PASSWORD (o WP_API_URL).')
  }
  return fetch(`${root}${pathname}`, {
    ...init,
    headers: { authorization: authorization(), accept: 'application/json', ...init.headers },
  })
}

/** Nombre legible en la biblioteca de medios: el original, sin caracteres raros. */
function libraryName(originalName: string, extension: MediaExtension): string {
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${base || 'campana'}.${extension}`
}

/**
 * Sube un archivo a la biblioteca de medios. Devuelve también su id, que hace
 * falta para usarlo como imagen destacada de una noticia.
 */
export async function uploadToLibrary(
  data: Buffer,
  extension: MediaExtension,
  originalName: string,
): Promise<{ id: number; url: string }> {
  const response = await wordpressRequest('/wp/v2/media', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': MEDIA_TYPES[extension],
      'content-disposition': `attachment; filename="${libraryName(originalName, extension)}"`,
    },
    body: new Uint8Array(data),
  })
  if (!response.ok) throw await failure(response, 'subir el archivo')
  const body = (await response.json()) as { id?: number; source_url?: string }
  if (!body.id || !body.source_url) throw new Error('WordPress no devolvió la dirección del archivo.')
  return { id: body.id, url: body.source_url }
}

export const wordpressStore: ContentStore = {
  async read<T>(name: string, options: ReadOptions = {}): Promise<T | null> {
    // Sin configurar: como si nunca se hubiera guardado. El sitio muestra el
    // contenido del código, y el admin avisa al intentar guardar.
    if (!wordpressConfigured()) {
      console.warn(`[content-store] WordPress sin configurar: «${name}» sale del código.`)
      return null
    }
    const response = await wordpressRequest(
      `/ruralanas/v1/documentos/${name}`,
      options.fresh
        ? { cache: 'no-store' }
        : { next: { revalidate: REVALIDATE_SECONDS, tags: ['content', documentTag(name)] } },
    )
    if (!response.ok) throw await failure(response, `leer «${name}»`)
    const body = (await response.json()) as { data?: T | null }
    return body.data ?? null
  },

  async write(name: string, data: unknown): Promise<void> {
    const response = await wordpressRequest(`/ruralanas/v1/documentos/${name}`, {
      method: 'PUT',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    if (!response.ok) throw await failure(response, `guardar «${name}»`)
  },

  async saveMedia(data: Buffer, extension: MediaExtension, originalName: string): Promise<string> {
    return (await uploadToLibrary(data, extension, originalName)).url
  },
}
