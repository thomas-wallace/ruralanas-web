/**
 * Una noticia desde el admin.
 *
 * `PUT`    la actualiza (también publicarla o volverla a borrador).
 * `DELETE` la manda a la papelera de WordPress, de donde se recupera.
 */

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin/session'
import { BLOG_TAG } from '@/lib/blog'
import { newsAdminAvailable, parsePostInput, savePost, trashPost } from '@/lib/blog/admin'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

async function postId(params: Params['params']): Promise<number | null> {
  const id = Number((await params).id)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function PUT(request: Request, { params }: Params) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
  if (!newsAdminAvailable()) return NextResponse.json({ error: 'Falta conectar con WordPress.' }, { status: 503 })
  const id = await postId(params)
  if (!id) return NextResponse.json({ error: 'Noticia inválida.' }, { status: 400 })

  const parsed = parsePostInput(await request.json().catch(() => null))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const post = await savePost(id, parsed.input)
    revalidateTag(BLOG_TAG)
    return NextResponse.json({ post })
  } catch (error) {
    console.error('[admin/noticias] PUT', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 502 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
  if (!newsAdminAvailable()) return NextResponse.json({ error: 'Falta conectar con WordPress.' }, { status: 503 })
  const id = await postId(params)
  if (!id) return NextResponse.json({ error: 'Noticia inválida.' }, { status: 400 })

  try {
    await trashPost(id)
    revalidateTag(BLOG_TAG)
    return NextResponse.json({ trashed: true })
  } catch (error) {
    console.error('[admin/noticias] DELETE', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 502 })
  }
}
