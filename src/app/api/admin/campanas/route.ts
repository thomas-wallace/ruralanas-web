/**
 * Campañas desde el admin.
 *
 * `GET` devuelve todas, borradores incluidos.
 * `PUT` reemplaza la lista entera (crear, editar, borrar, ordenar y publicar
 *       son la misma operación) y regenera las páginas que las muestran.
 */

import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin/session'
import { getAllCampaigns, parseCampaigns, saveAllCampaigns } from '@/lib/campaigns'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  return NextResponse.json({ campaigns: await getAllCampaigns({ fresh: true }) })
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  let body: { campaigns?: unknown }
  try {
    body = (await request.json()) as { campaigns?: unknown }
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const parsed = parseCampaigns(body.campaigns)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    await saveAllCampaigns(parsed.campaigns)
  } catch (error) {
    console.error('[admin/campanas] PUT', error)
    return NextResponse.json({ error: 'No se pudo guardar en el servidor.' }, { status: 500 })
  }

  // El enlace "Campañas" del menú depende de que haya alguna publicada: se
  // regenera todo el sitio, no sólo las páginas de campañas.
  revalidatePath('/[locale]', 'layout')
  return NextResponse.json({ campaigns: parsed.campaigns })
}
