import 'server-only'

/**
 * Almacén del contenido que se edita desde el admin: la línea de tiempo de
 * Nosotros, las campañas y sus fotos y videos.
 *
 * Hoy son archivos en el disco del servidor (`CONTENT_DATA_DIR`, por defecto
 * `.data/content`), igual que las imágenes de Dolibarr en `.data/`. Es lo más
 * simple que funciona en el despliegue previsto —un servidor propio, en el
 * mismo origen que WooCommerce (D-017)— y no suma ningún servicio pago.
 *
 * Requisito: **el disco tiene que persistir entre despliegues** y respaldarse
 * con el resto del servidor. En una plataforma sin disco persistente (Vercel,
 * por ejemplo) esto no sirve: se escribe otra implementación de estas cuatro
 * funciones contra una base o un almacenamiento de objetos, y nada más cambia.
 *
 * Cada documento es un JSON entero y se reemplaza entero. Con un solo equipo
 * editando, alcanza; la escritura es atómica (archivo temporal + renombrar),
 * así que una lectura nunca ve un archivo a medio escribir.
 */

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

function root(): string {
  return path.resolve(
    process.env.CONTENT_DATA_DIR?.trim() || path.join(process.cwd(), '.data', 'content'),
  )
}

const NAME = /^[a-z0-9-]{1,60}$/

function documentPath(name: string): string {
  if (!NAME.test(name)) throw new Error(`Nombre de documento inválido: ${name}`)
  return path.join(root(), `${name}.json`)
}

async function writeAtomic(file: string, data: Buffer | string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${randomUUID()}.tmp`
  await writeFile(temporary, data)
  await rename(temporary, file)
}

/** `null` si el documento todavía no se guardó nunca. */
export async function readDocument<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(documentPath(name), 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function writeDocument(name: string, data: unknown): Promise<void> {
  await writeAtomic(documentPath(name), `${JSON.stringify(data, null, 2)}\n`)
}

// ── Medios ───────────────────────────────────────────────────────────────────

/**
 * Formatos aceptados. Sin SVG ni HTML: un archivo subido nunca puede ejecutar
 * código en el navegador de quien lo mira.
 */
export const MEDIA_TYPES = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
} as const

export type MediaExtension = keyof typeof MEDIA_TYPES

const MEDIA_FILE = /^[a-f0-9-]{36}\.(jpg|png|webp|mp4|webm)$/

function mediaPath(file: string): string | null {
  return MEDIA_FILE.test(file) ? path.join(root(), 'media', file) : null
}

/** Guarda un archivo con un nombre que genera el servidor. Devuelve ese nombre. */
export async function saveMedia(data: Buffer, extension: MediaExtension): Promise<string> {
  const file = `${randomUUID()}.${extension}`
  await writeAtomic(path.join(root(), 'media', file), data)
  return file
}

/**
 * Ubicación, tipo y tamaño de un archivo guardado, o `null` si el nombre no es
 * uno que haya generado `saveMedia` o el archivo no existe. La ruta que lo
 * sirve lo lee por partes: el video necesita pedidos por rango.
 */
export async function findMedia(
  file: string,
): Promise<{ path: string; type: string; size: number } | null> {
  const full = mediaPath(file)
  if (!full) return null
  try {
    const info = await stat(full)
    const extension = file.split('.').pop() as MediaExtension
    return { path: full, type: MEDIA_TYPES[extension], size: info.size }
  } catch {
    return null
  }
}

/** URL pública de un archivo guardado. */
export const mediaUrl = (file: string) => `/api/medios/${file}`
