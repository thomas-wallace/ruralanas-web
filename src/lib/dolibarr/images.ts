import 'server-only'

/**
 * Fotos de producto: de Dolibarr al almacenamiento de la tienda, una sola vez.
 *
 * Dolibarr no sirve de CDN: está en un hosting compartido y cada descarga
 * viaja en base64 dentro de un JSON. Por eso cada foto se baja **una vez**, se
 * guarda en disco y se sirve desde `/api/imagenes/productos/...`, una URL
 * propia que el navegador puede cachear para siempre.
 *
 * El nombre guardado lleva un hash del nombre, tamaño y fecha del archivo en
 * Dolibarr. Si alguien reemplaza la foto en el ERP, cambia el hash, cambia la
 * URL, y ninguna caché intermedia sigue mostrando la vieja.
 *
 * Una hora después de la última revisión se vuelve a listar (una llamada por
 * producto) y sólo se descarga lo que no está en disco. Si Dolibarr falla, se
 * siguen sirviendo las fotos que ya estaban.
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { cached } from './cache'
import { dolibarrGet, logDolibarrError } from './client'
import { DolibarrError, isDolibarrError } from './errors'
import type { RawDocument, RawDownload } from './types'

const IMAGES_TTL_MS = 60 * 60 * 1000
const MAX_BYTES = 15 * 1024 * 1024
const MANIFEST = 'manifest.json'

export const IMAGES_PUBLIC_BASE = '/api/imagenes/productos'

export const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

/** Carpeta raíz del almacenamiento. Fuera de `public/`: Next sólo sirve lo que había al compilar. */
export function mediaRoot(): string {
  return path.resolve(process.env.DOLIBARR_MEDIA_DIR?.trim() || path.join(process.cwd(), '.data', 'dolibarr-media'))
}

/** Un segmento de ruta seguro: sin barras, sin `..`, sin espacios. */
export function safeSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '_')
}

function extensionOf(name: string): string {
  return path.extname(name).slice(1).toLowerCase()
}

/** Dolibarr genera miniaturas `_small` y `_mini`: no son fotos del producto. */
function isProductImage(doc: RawDocument): boolean {
  if (!(extensionOf(doc.name) in IMAGE_TYPES)) return false
  if (/_(small|mini)\.[a-z]+$/i.test(doc.name)) return false
  if (doc.relativename?.includes('thumbs/')) return false
  return true
}

function storedName(doc: RawDocument): string {
  const hash = createHash('sha256')
    .update(`${doc.name}|${doc.size ?? ''}|${doc.date ?? ''}`)
    .digest('hex')
    .slice(0, 10)
  const ext = extensionOf(doc.name)
  const stem = safeSegment(path.basename(doc.name, path.extname(doc.name))).slice(0, 80)
  return `${stem}-${hash}.${ext}`
}

/** Los primeros bytes tienen que ser de una imagen, diga lo que diga la extensión. */
function looksLikeImage(bytes: Buffer): boolean {
  if (bytes.length < 12) return false
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true // jpeg
  if (bytes.subarray(0, 4).toString('hex') === '89504e47') return true // png
  if (bytes.subarray(0, 4).toString('ascii') === 'GIF8') return true
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return true
  if (bytes.subarray(4, 8).toString('ascii') === 'ftyp') return true // avif
  return false
}

async function readManifest(dir: string): Promise<string[]> {
  try {
    const parsed = JSON.parse(await readFile(path.join(dir, MANIFEST), 'utf8')) as { files?: unknown }
    return Array.isArray(parsed.files) ? parsed.files.filter((f): f is string => typeof f === 'string') : []
  } catch {
    return []
  }
}

async function writeAtomic(file: string, data: Buffer | string): Promise<void> {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmp, data)
  await rename(tmp, file)
}

async function exists(dir: string, name: string): Promise<boolean> {
  try {
    return (await readdir(dir)).includes(name)
  } catch {
    return false
  }
}

async function download(ref: string, doc: RawDocument, target: string): Promise<void> {
  // La carpeta del producto en Dolibarr es la ref saneada; el listado la trae.
  const folder = doc.level1name || ref
  const file = await dolibarrGet<RawDownload>('/documents/download', {
    modulepart: 'product',
    original_file: `${folder}/${doc.name}`,
  })
  const bytes = Buffer.from(file.content ?? '', 'base64')
  if (bytes.length === 0 || bytes.length > MAX_BYTES || !looksLikeImage(bytes)) {
    throw new DolibarrError('upstream', `${folder}/${doc.name}: no es una imagen válida (${bytes.length} bytes)`)
  }
  await writeAtomic(target, bytes)
}

async function sync(id: number, ref: string): Promise<string[]> {
  const dir = path.join(mediaRoot(), safeSegment(ref))

  let docs: RawDocument[]
  try {
    const listed = await dolibarrGet<RawDocument[]>('/documents', { modulepart: 'product', id })
    docs = Array.isArray(listed) ? listed.filter(isProductImage) : []
  } catch (error) {
    // Sin documentos, Dolibarr responde 404: es "no tiene fotos", no un fallo.
    if (isDolibarrError(error) && error.code === 'not_found') docs = []
    else {
      if (isDolibarrError(error)) logDolibarrError(error)
      else console.error('[dolibarr:images]', error)
      return readManifest(dir)
    }
  }

  if (docs.length === 0) {
    // Sin fotos no queda nada en disco; si había, se retiraron en el ERP.
    await rm(dir, { recursive: true, force: true })
    return []
  }

  await mkdir(dir, { recursive: true })
  const files: string[] = []
  for (const doc of docs) {
    const name = storedName(doc)
    if (!(await exists(dir, name))) {
      try {
        await download(ref, doc, path.join(dir, name))
      } catch (error) {
        if (isDolibarrError(error)) logDolibarrError(error)
        else console.error('[dolibarr:images]', ref, error)
        continue
      }
    }
    files.push(name)
  }

  await writeAtomic(path.join(dir, MANIFEST), JSON.stringify({ ref, files, syncedAt: new Date().toISOString() }))

  // Lo que ya no está en Dolibarr se borra: una foto retirada no vuelve a aparecer.
  const keep = new Set([...files, MANIFEST])
  for (const entry of await readdir(dir)) {
    if (!keep.has(entry) && !entry.endsWith('.tmp')) await unlink(path.join(dir, entry)).catch(() => {})
  }

  return files
}

/** URLs propias de las fotos de un producto, en el orden de Dolibarr. */
export async function imagesFor(id: number, ref: string): Promise<string[]> {
  const { value } = await cached(`images:${id}`, IMAGES_TTL_MS, () => sync(id, ref))
  const folder = encodeURIComponent(safeSegment(ref))
  return value.map((file) => `${IMAGES_PUBLIC_BASE}/${folder}/${encodeURIComponent(file)}`)
}
