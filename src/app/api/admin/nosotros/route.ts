/**
 * Línea de tiempo de Nosotros desde el admin.
 *
 * `GET` devuelve los hitos actuales (los guardados o, si nunca se guardó, los
 *       de los archivos de contenido).
 * `PUT` reemplaza la lista entera: así se agregan, editan, borran y reordenan
 *       los hitos en una sola operación. Después regenera la portada de
 *       Nosotros en los tres idiomas.
 */

import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { getTimeline, parseTimeline, saveTimeline } from '@/lib/about/timeline'
import { isAdmin } from '@/lib/admin/session'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  return NextResponse.json({ entries: await getTimeline() })
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  let body: { entries?: unknown }
  try {
    body = (await request.json()) as { entries?: unknown }
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const parsed = parseTimeline(body.entries)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    await saveTimeline(parsed.entries)
  } catch (error) {
    console.error('[admin/nosotros] PUT', error)
    return NextResponse.json({ error: 'No se pudo guardar en el servidor.' }, { status: 500 })
  }

  for (const locale of locales) revalidatePath(routes.about(locale))
  return NextResponse.json({ entries: parsed.entries })
}
