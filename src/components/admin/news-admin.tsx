'use client'

/**
 * Noticias: listado y editor.
 *
 * Se escriben acá y se guardan en WordPress, de donde las lee la web. El texto
 * se edita con una barra mínima —título, subtítulo, negrita, cursiva, listas,
 * cita, enlaces y fotos— y el diseño lo pone el sitio. Lo que se pega llega como
 * texto sin formato: así no entran los estilos de Word ni de otra página.
 *
 * Las notas viejas armadas con Elementor muestran su texto pero no se pueden
 * cambiar desde acá (ver `src/lib/blog/admin.ts`).
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { buttonClass } from '@/components/ui/button'
import type { AdminCategory, AdminPost } from '@/lib/blog/admin'

import { adminFetch } from './admin-fetch'
import { adminField, adminLabel, adminLink, adminNotice } from './admin-ui'

interface Draft {
  id: number | null
  title: string
  excerpt: string
  content: string
  date: string
  categories: number[]
  featured: { id: number; url: string } | null
  status: AdminPost['status']
  builder: boolean
  slug: string
}

const EMPTY: Draft = {
  id: null,
  title: '',
  excerpt: '',
  content: '',
  date: '',
  categories: [],
  featured: null,
  status: 'draft',
  builder: false,
  slug: '',
}

const toDraft = (post: AdminPost): Draft => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  date: post.date,
  categories: post.categories,
  featured: post.featured,
  status: post.status,
  builder: post.builder,
  slug: post.slug,
})

function formatDate(value: string): string {
  const [day, time] = value.split('T')
  const [year, month, date] = (day ?? '').split('-')
  return year && month && date ? `${date}/${month}/${year}${time ? ` ${time.slice(0, 5)}` : ''}` : value
}

const STATUS_LABEL: Record<AdminPost['status'], string> = {
  publish: 'Publicada',
  future: 'Programada',
  draft: 'Borrador',
  pending: 'Pendiente',
  private: 'Privada',
}

async function uploadImage(file: File): Promise<{ id: number; url: string }> {
  const body = new FormData()
  body.append('file', file)
  const response = await adminFetch('/api/admin/noticias/imagen', { method: 'POST', body })
  const result = (await response.json().catch(() => ({}))) as { id?: number; url?: string; error?: string }
  if (!response.ok || !result.id || !result.url) throw new Error(result.error ?? 'No se pudo subir la foto.')
  return { id: result.id, url: result.url }
}

// ── Editor de texto ──────────────────────────────────────────────────────────

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Sin perder la selección del texto al tocar el botón.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="min-w-9 cursor-pointer border border-earth/20 bg-paper px-2.5 py-1.5 font-sans text-[12px] text-earth hover:border-earth"
    >
      {children}
    </button>
  )
}

function RichEditor({
  initial,
  onChange,
  onError,
}: {
  initial: string
  onChange: (html: string) => void
  onError: (message: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // El contenido se carga una vez; después el navegador lo edita en el lugar.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => ref.current && onChange(ref.current.innerHTML)

  const run = (command: string, value?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, value)
    emit()
  }

  const link = () => {
    const url = window.prompt('Dirección del enlace (https://…, mailto:… o tel:…)')?.trim()
    if (!url) return
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
      onError('El enlace tiene que empezar con https://, mailto: o tel:.')
      return
    }
    run('createLink', url)
  }

  const insertPhoto = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      const alt = window.prompt('Descripción breve de la foto (para quien no la ve):')?.trim() ?? ''
      const escape = (text: string) => text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
      run('insertHTML', `<figure><img src="${escape(url)}" alt="${escape(alt)}"></figure><p><br></p>`)
    } catch (error) {
      onError((error as Error).message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="border border-earth/25 bg-paper">
      <div className="sticky top-[72px] z-10 flex flex-wrap gap-1.5 border-b border-earth/15 bg-shell p-2">
        <ToolButton label="Párrafo" onClick={() => run('formatBlock', 'p')}>Texto</ToolButton>
        <ToolButton label="Título" onClick={() => run('formatBlock', 'h2')}>Título</ToolButton>
        <ToolButton label="Subtítulo" onClick={() => run('formatBlock', 'h3')}>Subtítulo</ToolButton>
        <ToolButton label="Negrita" onClick={() => run('bold')}>
          <strong>N</strong>
        </ToolButton>
        <ToolButton label="Cursiva" onClick={() => run('italic')}>
          <em>C</em>
        </ToolButton>
        <ToolButton label="Lista" onClick={() => run('insertUnorderedList')}>• Lista</ToolButton>
        <ToolButton label="Lista numerada" onClick={() => run('insertOrderedList')}>1. Lista</ToolButton>
        <ToolButton label="Cita" onClick={() => run('formatBlock', 'blockquote')}>“Cita”</ToolButton>
        <ToolButton label="Enlace" onClick={link}>Enlace</ToolButton>
        <ToolButton label="Quitar enlace" onClick={() => run('unlink')}>Sin enlace</ToolButton>
        <ToolButton label="Foto" onClick={() => fileInput.current?.click()}>
          {uploading ? 'Subiendo…' : '+ Foto'}
        </ToolButton>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => void insertPhoto(event.target.files?.[0])}
        />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Texto de la noticia"
        onInput={emit}
        onBlur={emit}
        onPaste={(event) => {
          // Sólo texto: los estilos de lo copiado no entran.
          event.preventDefault()
          document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
          emit()
        }}
        className="post-body min-h-[360px] px-6 py-5 outline-none focus:bg-white/40"
      />
    </div>
  )
}

// ── Editor de una noticia ────────────────────────────────────────────────────

function PostEditor({
  initial,
  categories,
  postUrl,
  onClose,
  onSaved,
  onTrashed,
}: {
  initial: Draft
  categories: AdminCategory[]
  postUrl: (slug: string) => string
  onClose: () => void
  onSaved: (post: AdminPost) => void
  onTrashed: (id: number) => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
    setNotice(null)
  }

  const published = draft.status === 'publish' || draft.status === 'future'

  async function save(status: 'draft' | 'publish') {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await adminFetch(draft.id ? `/api/admin/noticias/${draft.id}` : '/api/admin/noticias', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          excerpt: draft.excerpt,
          // Las notas de Elementor no mandan texto: no se puede cambiar desde acá.
          ...(draft.builder ? {} : { content: draft.content }),
          status,
          date: draft.date || undefined,
          categories: draft.categories,
          featuredMedia: draft.featured?.id ?? 0,
        }),
      })
      const body = (await response.json().catch(() => ({}))) as { post?: AdminPost; error?: string }
      if (!response.ok || !body.post) {
        setError(body.error ?? 'No se pudo guardar.')
        return
      }
      setDraft(toDraft(body.post))
      setDirty(false)
      onSaved(body.post)
      setNotice(
        body.post.status === 'publish'
          ? 'Publicada. Ya se ve en Noticias.'
          : body.post.status === 'future'
            ? `Programada para el ${formatDate(body.post.date)}.`
            : 'Guardada como borrador. No se ve en el sitio.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function trash() {
    if (!draft.id) return
    if (!window.confirm(`¿Mandar «${draft.title}» a la papelera? Deja de verse en el sitio. Se puede recuperar desde la papelera de WordPress durante 30 días.`)) return
    setBusy(true)
    try {
      const response = await adminFetch(`/api/admin/noticias/${draft.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? 'No se pudo mandar a la papelera.')
        return
      }
      setDirty(false)
      onTrashed(draft.id)
    } finally {
      setBusy(false)
    }
  }

  async function changeFeatured(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      set({ featured: await uploadImage(file) })
    } catch (uploadError) {
      setError((uploadError as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const close = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar y se van a perder. ¿Salir igual?')) return
    onClose()
  }

  return (
    <div className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={close} className={adminLink}>
          ← Todas las noticias
        </button>
        <span className="font-sans text-[11px] tracking-[0.12em] text-slate uppercase">
          {draft.id ? STATUS_LABEL[draft.status] : 'Nueva'}
          {draft.status === 'future' && ` · ${formatDate(draft.date)}`}
          {draft.status === 'publish' && draft.slug && (
            <>
              {' · '}
              <a href={postUrl(draft.slug)} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                Ver en el sitio
              </a>
            </>
          )}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Título</span>
          <input
            value={draft.title}
            maxLength={200}
            onChange={(event) => set({ title: event.target.value })}
            className={`${adminField} font-display text-[22px]`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={adminLabel}>Foto principal</span>
          <div className="flex flex-wrap items-center gap-4">
            {draft.featured ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.featured.url} alt="" className="h-28 w-44 border border-earth/15 object-cover" />
            ) : (
              <div className="flex h-28 w-44 items-center justify-center border border-dashed border-earth/30 text-[13px] text-slate">
                Sin foto
              </div>
            )}
            <label className={buttonClass('secondary', 'sm', 'cursor-pointer')}>
              {uploading ? 'Subiendo…' : draft.featured ? 'Cambiar foto' : 'Subir foto'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                disabled={uploading}
                onChange={(event) => void changeFeatured(event.target.files?.[0])}
              />
            </label>
            {draft.featured && (
              <button type="button" onClick={() => set({ featured: null })} className={adminLink}>
                Quitar
              </button>
            )}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Bajada · se ve en el listado de noticias</span>
          <textarea
            value={draft.excerpt}
            maxLength={600}
            rows={2}
            onChange={(event) => set({ excerpt: event.target.value })}
            className={`${adminField} resize-y`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={adminLabel}>Texto</span>
          {draft.builder ? (
            <>
              <p className={adminNotice}>
                Esta nota se armó con Elementor y su texto sólo se cambia desde WordPress. Desde acá se pueden
                cambiar el título, la foto, la bajada, las categorías y la fecha.
              </p>
              <div
                className="post-body max-h-[420px] overflow-auto border border-earth/15 px-6 py-5 opacity-80"
                // HTML saneado en el servidor (`sanitizeEditorHtml`).
                dangerouslySetInnerHTML={{ __html: draft.content }}
              />
            </>
          ) : (
            <RichEditor
              // Se carga una sola vez: guardar no lo vuelve a montar.
              key={initial.id ?? 'nueva'}
              initial={draft.content}
              onChange={(content) => set({ content })}
              onError={setError}
            />
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className={`${adminLabel} mb-1.5`}>Categorías</legend>
            {categories.length === 0 && <span className="text-[14px] text-slate">No hay categorías.</span>}
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  checked={draft.categories.includes(category.id)}
                  onChange={(event) =>
                    set({
                      categories: event.target.checked
                        ? [...draft.categories, category.id]
                        : draft.categories.filter((id) => id !== category.id),
                    })
                  }
                />
                {category.name}
              </label>
            ))}
          </fieldset>
          <label className="flex flex-col gap-1.5">
            <span className={adminLabel}>Fecha de publicación</span>
            <input
              type="datetime-local"
              value={draft.date}
              onChange={(event) => set({ date: event.target.value })}
              className={adminField}
            />
            <span className="text-[13px] text-slate">
              Vacía: la de hoy al publicar. Una fecha futura la deja programada.
            </span>
          </label>
        </div>
      </div>

      <div className="sticky bottom-0 mt-10 flex flex-wrap items-center gap-4 border-t border-earth/15 bg-paper/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => void save('publish')}
          disabled={busy || !draft.title.trim()}
          className={buttonClass('primary', 'md')}
        >
          {busy ? 'Guardando…' : published ? 'Guardar cambios' : 'Publicar'}
        </button>
        <button
          type="button"
          onClick={() => void save('draft')}
          disabled={busy || !draft.title.trim()}
          className={buttonClass('secondary', 'md')}
        >
          {published ? 'Pasar a borrador' : 'Guardar borrador'}
        </button>
        {draft.id && (
          <button type="button" onClick={() => void trash()} disabled={busy} className={adminLink}>
            Mandar a la papelera
          </button>
        )}
        {dirty && !busy && <span className="text-[14px] text-slate">Hay cambios sin guardar.</span>}
        {notice && (
          <span role="status" className="text-[14px] text-olive">
            {notice}
          </span>
        )}
        {error && (
          <span role="alert" className="text-[14px] text-olive">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Listado ──────────────────────────────────────────────────────────────────

export function NewsAdmin({ blogUrl, postBase }: { blogUrl: string; postBase: string }) {
  const [posts, setPosts] = useState<AdminPost[] | null>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [available, setAvailable] = useState(true)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await adminFetch('/api/admin/noticias')
    const body = (await response.json().catch(() => ({}))) as {
      available?: boolean
      posts?: AdminPost[]
      categories?: AdminCategory[]
      error?: string
    }
    if (!response.ok || !body.posts) {
      setError(body.error ?? 'No se pudieron leer las noticias.')
      return
    }
    setAvailable(body.available !== false)
    setPosts(body.posts)
    setCategories(body.categories ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const postUrl = (slug: string) => `${postBase}/${slug}`

  if (editing) {
    return (
      <PostEditor
        initial={editing}
        categories={categories}
        postUrl={postUrl}
        onClose={() => setEditing(null)}
        onSaved={(post) =>
          setPosts((current) =>
            current?.some((item) => item.id === post.id)
              ? current.map((item) => (item.id === post.id ? post : item))
              : [post, ...(current ?? [])],
          )
        }
        onTrashed={(id) => {
          setPosts((current) => current?.filter((item) => item.id !== id) ?? null)
          setEditing(null)
          setNotice('La noticia se mandó a la papelera.')
        }}
      />
    )
  }

  if (!posts) {
    return error ? (
      <p className={`${adminNotice} my-12`}>{error}</p>
    ) : (
      <p className="py-20 text-center font-sans text-[12px] tracking-[0.12em] text-slate uppercase">Cargando…</p>
    )
  }

  if (!available) {
    return (
      <p className={`${adminNotice} my-12`}>
        Para cargar noticias desde acá, la tienda tiene que estar conectada con WordPress: faltan{' '}
        <code>CONTENT_WP_USER</code> y <code>CONTENT_WP_APP_PASSWORD</code> (ver
        wordpress/ruralanas-contenido/README.md).
      </p>
    )
  }

  return (
    <div className="py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 font-display text-[26px] text-earth">{posts.length} noticias</h2>
          <p className="mt-1 mb-0 text-[14px] text-slate">
            Las publicadas se ven en el sitio, de la más nueva a la más vieja.{' '}
            <a href={blogUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Ver Noticias
            </a>
          </p>
        </div>
        <button type="button" onClick={() => setEditing(EMPTY)} className={buttonClass('primary', 'md')}>
          + Nueva noticia
        </button>
      </div>

      {notice && (
        <p role="status" className="mb-6 text-[14px] text-olive">
          {notice}
        </p>
      )}

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {posts.map((post) => (
          <li key={post.id} className="flex flex-wrap items-center gap-4 border border-earth/15 bg-paper p-3">
            <div className="h-16 w-24 shrink-0 overflow-hidden bg-ash">
              {post.featured && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.featured.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-[200px] flex-1">
              <div className="text-[16px] text-earth">{post.title || 'Sin título'}</div>
              <div className="mt-1 font-sans text-[11px] tracking-[0.08em] text-slate uppercase">
                {STATUS_LABEL[post.status]} · {formatDate(post.date)}
                {post.builder && ' · Elementor'}
              </div>
            </div>
            <span className="flex gap-5">
              {post.status === 'publish' && (
                <a href={postUrl(post.slug)} target="_blank" rel="noreferrer" className={adminLink}>
                  Ver
                </a>
              )}
              <button type="button" onClick={() => setEditing(toDraft(post))} className={adminLink}>
                Editar
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
