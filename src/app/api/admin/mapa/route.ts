/**
 * Mapa de Nosotros → En el mundo, desde el admin.
 *
 * `GET`  la lista a mano, los ocultos, los locales y los países con ventas.
 * `PUT`  reemplaza la lista, los ocultos y los locales.
 * `POST` `{ page }` recorre una página de los pedidos pagados anteriores y
 *        anota sus países. El admin la llama de la 1 hasta la última.
 *
 * Los países de las ventas nuevas no pasan por acá: los anota WordPress solo.
 */

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin/session'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'
import {
  getReachDocument,
  getSales,
  importPastSales,
  parseReachDocument,
  SALES_TAG,
  salesAvailable,
  saveReachDocument,
} from '@/lib/world/reach-store'

export const dynamic = 'force-dynamic'

/** La sección de Nosotros donde está el mapa. */
const SECTION = 'en-el-mundo'

function unauthorized() {
  return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
}

function refreshPages() {
  revalidateTag(SALES_TAG)
  for (const locale of locales) revalidatePath(routes.about(locale, SECTION))
}

async function state() {
  const [document, sales] = await Promise.all([
    getReachDocument({ fresh: true }),
    getSales({ fresh: true }),
  ])
  return { document, sales, salesAvailable: salesAvailable() }
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  try {
    return NextResponse.json(await state())
  } catch (error) {
    console.error('[admin/mapa] GET', error)
    return NextResponse.json({ error: 'No se pudo leer el mapa.' }, { status: 502 })
  }
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  let body: { document?: unknown }
  try {
    body = (await request.json()) as { document?: unknown }
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const parsed = parseReachDocument(body.document)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    await saveReachDocument(parsed.document)
  } catch (error) {
    console.error('[admin/mapa] PUT', error)
    return NextResponse.json({ error: `No se pudo guardar. ${(error as Error).message}` }, { status: 502 })
  }

  refreshPages()
  return NextResponse.json(await state())
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  if (!salesAvailable()) {
    return NextResponse.json(
      { error: 'Las ventas sólo se leen con el contenido guardado en WordPress (CONTENT_STORE=wordpress).' },
      { status: 409 },
    )
  }

  const { page } = ((await request.json().catch(() => ({}))) ?? {}) as { page?: unknown }
  const current = typeof page === 'number' && Number.isInteger(page) && page >= 1 ? page : 1

  try {
    const result = await importPastSales(current)
    const done = result.page >= result.pages
    if (done) refreshPages()
    return NextResponse.json({ ...result, done, ...(done ? await state() : {}) })
  } catch (error) {
    console.error('[admin/mapa] POST', error)
    return NextResponse.json({ error: `No se pudieron leer los pedidos. ${(error as Error).message}` }, { status: 502 })
  }
}
