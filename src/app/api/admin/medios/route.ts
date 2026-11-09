/**
 * Subida de fotos y videos desde el admin.
 *
 * El tipo se decide por los primeros bytes del archivo, no por su nombre ni
 * por lo que declare el navegador: así un archivo renombrado no entra. El
 * nombre con el que se guarda lo genera el servidor.
 */

import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin/session'
import { saveMedia, type MediaExtension } from '@/lib/content-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IMAGE = 15 * 1024 * 1024
const MAX_VIDEO = 200 * 1024 * 1024

function sniff(bytes: Buffer): MediaExtension | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (bytes.toString('ascii', 4, 8) === 'ftyp') return 'mp4'
  if (bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'webm'
  return null
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('file')
  } catch {
    return NextResponse.json({ error: 'No llegó ningún archivo.' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No llegó ningún archivo.' }, { status: 400 })
  }

  const data = Buffer.from(await file.arrayBuffer())
  const extension = sniff(data)
  if (!extension) {
    return NextResponse.json(
      { error: `«${file.name}» no es JPG, PNG, WebP, MP4 ni WebM.` },
      { status: 415 },
    )
  }

  const video = extension === 'mp4' || extension === 'webm'
  if (data.length > (video ? MAX_VIDEO : MAX_IMAGE)) {
    return NextResponse.json(
      { error: `«${file.name}» pesa demasiado: hasta ${video ? '200' : '15'} MB.` },
      { status: 413 },
    )
  }

  try {
    const src = await saveMedia(data, extension, file.name)
    return NextResponse.json({ src, kind: video ? 'video' : 'image' })
  } catch (error) {
    console.error('[admin/medios] POST', error)
    return NextResponse.json(
      { error: `No se pudo guardar «${file.name}». ${(error as Error).message}` },
      { status: 502 },
    )
  }
}
