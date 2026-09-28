import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { invalidateDolibarrCache } from '@/lib/dolibarr'

/**
 * Invalidación de caché para el servicio de integración.
 *
 * Cuando el stock cambia en Dolibarr, el sync empuja el dato y llama acá para
 * que la web deje de mostrar la versión vieja. Sin esto, la única garantía
 * sería la ventana de revalidación de 15 minutos, y vender algo que ya no
 * existe es exactamente el problema que este proyecto tiene que resolver.
 *
 *   POST /api/revalidate
 *   x-revalidate-token: <REVALIDATE_TOKEN>
 *   { "tags": ["catalog", "product:ruana-clasica"] }
 */
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'REVALIDATE_TOKEN no configurado' }, { status: 503 })
  }

  if (request.headers.get('x-revalidate-token') !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let tags: unknown
  try {
    ;({ tags } = (await request.json()) as { tags?: unknown })
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    return NextResponse.json({ error: 'Se espera { tags: string[] }' }, { status: 400 })
  }

  for (const tag of tags as string[]) revalidateTag(tag)
  // La caché en memoria de Dolibarr no conoce etiquetas: `catalog` vacía la de
  // productos y la de fotos, que así se vuelven a revisar contra el disco.
  if ((tags as string[]).includes('catalog')) {
    invalidateDolibarrCache('producto')
    invalidateDolibarrCache('images:')
  }

  return NextResponse.json({ revalidated: tags, at: Date.now() })
}
