/**
 * Foto para una noticia (destacada o dentro del texto). Va a la biblioteca de
 * medios de WordPress y devuelve su id y su dirección. Sólo fotos: JPG, PNG o
 * WebP, decidido por los primeros bytes del archivo.
 */

import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin/session'
import { newsAdminAvailable } from '@/lib/blog/admin'
import { uploadToLibrary } from '@/lib/content-store'
import { isVideo, sniffMedia } from '@/lib/content-store/sniff'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IMAGE = 15 * 1024 * 1024

export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
  if (!newsAdminAvailable()) return NextResponse.json({ error: 'Falta conectar con WordPress.' }, { status: 503 })

  const file = (await request.formData().catch(() => null))?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No llegó ningún archivo.' }, { status: 400 })

  const data = Buffer.from(await file.arrayBuffer())
  const extension = sniffMedia(data)
  if (!extension || isVideo(extension)) {
    return NextResponse.json({ error: `«${file.name}» no es una foto JPG, PNG ni WebP.` }, { status: 415 })
  }
  if (data.length > MAX_IMAGE) {
    return NextResponse.json({ error: `«${file.name}» pesa demasiado: hasta 15 MB.` }, { status: 413 })
  }

  try {
    return NextResponse.json(await uploadToLibrary(data, extension, file.name))
  } catch (error) {
    console.error('[admin/noticias/imagen] POST', error)
    return NextResponse.json({ error: `No se pudo subir «${file.name}». ${(error as Error).message}` }, { status: 502 })
  }
}
