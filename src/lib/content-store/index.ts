import 'server-only'

/**
 * Almacén del contenido que se edita desde el admin: la línea de tiempo de
 * Nosotros, las campañas, el mapa de países y sus fotos y videos.
 *
 *   CONTENT_STORE=file       → archivos en el disco del servidor (por defecto;
 *                              sirve en desarrollo y en un servidor propio)
 *   CONTENT_STORE=wordpress  → en el WordPress de ruralanas.com, por su API
 *                              (plugin `wordpress/ruralanas-contenido`). Es el
 *                              que corresponde en Vercel, que no tiene disco.
 *
 * Nadie más importa `file.ts` ni `wordpress.ts`: todo pasa por acá. La única
 * excepción es `wordpressRequest`, para leer otros datos del mismo plugin.
 */

import { revalidateTag } from 'next/cache'

import { fileStore } from './file'
import type { ContentStore, MediaExtension, ReadOptions } from './types'
import { documentTag, wordpressConfigured, wordpressStore } from './wordpress'

export const contentStoreKind = process.env.CONTENT_STORE === 'wordpress' ? 'wordpress' : 'file'

const store: ContentStore = contentStoreKind === 'wordpress' ? wordpressStore : fileStore

const NAME = /^[a-z0-9-]{1,60}$/

function checkName(name: string): void {
  if (!NAME.test(name)) throw new Error(`Nombre de documento inválido: ${name}`)
}

/** `null` si el documento todavía no se guardó nunca. */
export async function readDocument<T>(name: string, options?: ReadOptions): Promise<T | null> {
  checkName(name)
  return store.read<T>(name, options)
}

export async function writeDocument(name: string, data: unknown): Promise<void> {
  checkName(name)
  if (contentStoreKind === 'wordpress' && !wordpressConfigured()) {
    throw new Error('El admin guarda en WordPress y faltan CONTENT_WP_USER o CONTENT_WP_APP_PASSWORD.')
  }
  await store.write(name, data)
  // Las páginas que leyeron este documento con caché lo vuelven a pedir.
  revalidateTag(documentTag(name))
}

/** Guarda una foto o un video y devuelve su URL pública. */
export function saveMedia(data: Buffer, extension: MediaExtension, originalName: string): Promise<string> {
  return store.saveMedia(data, extension, originalName)
}

/**
 * Prefijos de URL de donde puede venir una foto o un video guardado: la
 * biblioteca de ruralanas.com y, en la copia de prueba, la de su WordPress.
 * Los valida quien guarda (campañas) para no aceptar fotos de cualquier sitio.
 */
export function uploadOrigins(): string[] {
  const origins = ['https://ruralanas.com/wp-content/uploads/']
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (process.env.WP_PROXY_ORIGIN && site) origins.push(`${site}/wp-content/uploads/`)
  return origins
}

export { findMedia } from './file'
export { wordpressConfigured, wordpressRequest } from './wordpress'
export { MEDIA_TYPES, type MediaExtension } from './types'
