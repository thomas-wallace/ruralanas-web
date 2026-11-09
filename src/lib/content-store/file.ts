import 'server-only'

/**
 * Almacén en el disco del servidor (`CONTENT_STORE=file`, el de desarrollo).
 *
 * Carpeta `CONTENT_DATA_DIR`, por defecto `.data/content`, igual que las
 * imágenes de Dolibarr en `.data/`. **El disco tiene que persistir entre
 * despliegues**: en una plataforma sin disco propio (Vercel) no sirve, y para
 * eso está `wordpress.ts`.
 *
 * Cada documento es un JSON entero y se reemplaza entero. La escritura es
 * atómica (archivo temporal + renombrar): una lectura nunca ve un archivo a
 * medio escribir.
 */

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { MEDIA_TYPES, type ContentStore, type MediaExtension } from './types'

function root(): string {
  return path.resolve(
    process.env.CONTENT_DATA_DIR?.trim() || path.join(process.cwd(), '.data', 'content'),
  )
}

async function writeAtomic(file: string, data: Buffer | string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${randomUUID()}.tmp`
  await writeFile(temporary, data)
  await rename(temporary, file)
}

const MEDIA_FILE = /^[a-f0-9-]{36}\.(jpg|png|webp|mp4|webm)$/

export const fileStore: ContentStore = {
  async read<T>(name: string): Promise<T | null> {
    try {
      return JSON.parse(await readFile(path.join(root(), `${name}.json`), 'utf8')) as T
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  },

  async write(name: string, data: unknown): Promise<void> {
    await writeAtomic(path.join(root(), `${name}.json`), `${JSON.stringify(data, null, 2)}\n`)
  },

  async saveMedia(data: Buffer, extension: MediaExtension): Promise<string> {
    const file = `${randomUUID()}.${extension}`
    await writeAtomic(path.join(root(), 'media', file), data)
    return `/api/medios/${file}`
  },
}

/**
 * Ubicación, tipo y tamaño de un archivo guardado, o `null` si el nombre no es
 * uno que haya generado `saveMedia` o el archivo no existe. `/api/medios/…` lo
 * lee por partes: el video necesita pedidos por rango.
 */
export async function findMedia(
  file: string,
): Promise<{ path: string; type: string; size: number } | null> {
  if (!MEDIA_FILE.test(file)) return null
  const full = path.join(root(), 'media', file)
  try {
    const info = await stat(full)
    const extension = file.split('.').pop() as MediaExtension
    return { path: full, type: MEDIA_TYPES[extension], size: info.size }
  } catch {
    return null
  }
}
