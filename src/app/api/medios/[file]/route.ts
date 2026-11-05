/**
 * Sirve las fotos y videos subidos desde el admin (campañas).
 *
 * Los nombres los genera el servidor al subir (un UUID), así que nunca cambia
 * el contenido de una URL: se cachean un año como inmutables. Responde pedidos
 * por rango (`Range`), que el video necesita para adelantar y que Safari exige
 * para reproducirlo.
 */

import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

import { findMedia } from '@/lib/content-store'

export const runtime = 'nodejs'

const HEADERS = {
  'cache-control': 'public, max-age=31536000, immutable',
  'accept-ranges': 'bytes',
  'x-content-type-options': 'nosniff',
}

function stream(file: string, options?: { start: number; end: number }): ReadableStream {
  return Readable.toWeb(createReadStream(file, options)) as ReadableStream
}

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const media = await findMedia((await params).file)
  if (!media) return new Response('No encontrado', { status: 404 })

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '')
  if (!range) {
    return new Response(stream(media.path), {
      headers: { ...HEADERS, 'content-type': media.type, 'content-length': String(media.size) },
    })
  }

  // `bytes=-500` son los últimos 500; `bytes=500-` desde el 500 hasta el final.
  const [, from, to] = range
  const start = from ? Number(from) : Math.max(0, media.size - Number(to))
  const end = from && to ? Math.min(Number(to), media.size - 1) : media.size - 1

  if (start > end || start >= media.size) {
    return new Response(null, {
      status: 416,
      headers: { ...HEADERS, 'content-range': `bytes */${media.size}` },
    })
  }

  return new Response(stream(media.path, { start, end }), {
    status: 206,
    headers: {
      ...HEADERS,
      'content-type': media.type,
      'content-length': String(end - start + 1),
      'content-range': `bytes ${start}-${end}/${media.size}`,
    },
  })
}
