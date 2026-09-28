import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { IMAGE_TYPES, mediaRoot } from '@/lib/dolibarr/images'

/**
 * Sirve las fotos de producto que ya se bajaron de Dolibarr.
 *
 *   GET /api/imagenes/productos/RL-0042/manta-a1b2c3d4e5.jpg
 *
 * Nunca llama al ERP: sólo lee del disco. El nombre lleva un hash del archivo
 * original, así que una URL siempre es la misma foto y se puede cachear un año.
 */
const SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,200}$/

export async function GET(_request: Request, { params }: { params: Promise<{ ref: string; file: string }> }) {
  const { ref, file } = await params
  const type = IMAGE_TYPES[path.extname(file).slice(1).toLowerCase()]

  if (!SEGMENT.test(ref) || !SEGMENT.test(file) || !type) {
    return new NextResponse(null, { status: 404 })
  }

  const root = mediaRoot()
  const target = path.resolve(root, ref, file)
  if (!target.startsWith(root + path.sep)) return new NextResponse(null, { status: 404 })

  try {
    const bytes = await readFile(target)
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': type,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
