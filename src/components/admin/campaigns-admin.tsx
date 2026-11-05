'use client'

/**
 * Admin de campañas.
 *
 * Dos vistas: la lista de campañas (orden, estado, nueva) y el editor de una.
 * Como en la línea de tiempo, todo cambio es local hasta "Guardar", que manda
 * la lista entera. Las fotos y videos se suben al momento —el archivo queda en
 * el servidor aunque después no se guarde la campaña—; lo que se guarda al
 * final es qué archivos usa cada campaña y en qué orden.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { buttonClass } from '@/components/ui/button'
import type { Campaign, CampaignMedia, Translated } from '@/lib/campaigns'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'
import { slugify } from '@/lib/slug'

import { AdminGate } from './admin-gate'
import { adminField, adminLabel, adminLink, adminNotice } from './admin-ui'

const emptyTranslated = (): Translated =>
  Object.fromEntries(locales.map((l) => [l, ''])) as Translated

function newCampaign(): Campaign {
  return {
    id: crypto.randomUUID(),
    slug: '',
    published: false,
    season: '',
    title: emptyTranslated(),
    intro: emptyTranslated(),
    cover: '',
    media: [],
  }
}

/** Pasa una URL de YouTube/Vimeo a algo que se reconozca en la miniatura. */
function videoLabel(src: string): string {
  if (/youtu/.test(src)) return 'YouTube'
  if (/vimeo/.test(src)) return 'Vimeo'
  return 'Video subido'
}

function Thumb({ item }: { item: CampaignMedia }) {
  if (item.kind === 'image') {
    // Miniatura del admin: sin next/image, no vale la pena optimizarla.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt="" className="h-full w-full object-cover" />
  }
  if (item.src.startsWith('/api/medios/')) {
    return <video src={item.src} muted preload="metadata" className="h-full w-full object-cover" />
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-earth/80 font-sans text-[11px] tracking-[0.1em] text-paper uppercase">
      ▶ {videoLabel(item.src)}
    </span>
  )
}

function LanguageTabs({ value, onChange }: { value: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div role="tablist" aria-label="Idioma" className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          role="tab"
          aria-selected={value === locale}
          onClick={() => onChange(locale)}
          className={`cursor-pointer rounded-sm border px-3 py-2 font-sans text-[11px] tracking-[0.1em] uppercase transition-colors ${
            value === locale ? 'border-earth bg-earth text-paper' : 'border-earth/25 text-earth hover:border-earth'
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  )
}

function CampaignEditor({
  campaign,
  onChange,
  onClose,
}: {
  campaign: Campaign
  onChange: (next: Campaign) => void
  onClose: () => void
}) {
  const [language, setLanguage] = useState<Locale>('es')
  const [uploading, setUploading] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const set = <K extends keyof Campaign>(key: K, value: Campaign[K]) => onChange({ ...campaign, [key]: value })
  const setText = (key: 'title' | 'intro', value: string) =>
    set(key, { ...campaign[key], [language]: value })

  const setMedia = (media: CampaignMedia[]) => {
    // La portada no puede apuntar a una foto que ya no está en la campaña…
    const cover = media.some((item) => item.src === campaign.cover) ? campaign.cover : ''
    // …y si no hay portada, la primera foto pasa a serlo.
    const firstImage = media.find((item) => item.kind === 'image')?.src ?? ''
    onChange({ ...campaign, media, cover: cover || firstImage })
  }

  const addMedia = (item: Omit<CampaignMedia, 'id' | 'caption'>) =>
    setMedia([
      ...campaign.media,
      { ...item, id: crypto.randomUUID(), caption: emptyTranslated() } as CampaignMedia,
    ])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploadError(null)
    const added: CampaignMedia[] = []
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1)
      try {
        const body = new FormData()
        body.append('file', file)
        const response = await fetch('/api/admin/medios', { method: 'POST', body })
        const result = (await response.json().catch(() => ({}))) as {
          src?: string
          kind?: 'image' | 'video'
          error?: string
        }
        if (!response.ok || !result.src || !result.kind) {
          setUploadError(result.error ?? `No se pudo subir «${file.name}».`)
          continue
        }
        added.push({ id: crypto.randomUUID(), kind: result.kind, src: result.src, caption: emptyTranslated() })
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (added.length) setMedia([...campaign.media, ...added])
    if (fileInput.current) fileInput.current.value = ''
  }

  function addUrl() {
    const value = url.trim()
    if (!value) return
    const video = /youtu\.?be|vimeo\.com|\.(mp4|webm)$/i.test(value)
    addMedia({ kind: video ? 'video' : 'image', src: value })
    setUrl('')
  }

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset
    if (target < 0 || target >= campaign.media.length) return
    const next = [...campaign.media]
    const [moved] = next.splice(index, 1)
    if (moved) next.splice(target, 0, moved)
    setMedia(next)
  }

  return (
    <div className="py-10">
      <button type="button" onClick={onClose} className={adminLink}>
        ← Todas las campañas
      </button>

      <div className="mt-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 font-display text-[28px] text-earth">{campaign.title.es || 'Campaña nueva'}</h2>
        <LanguageTabs value={language} onChange={setLanguage} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Título · {localeNames[language]}</span>
          <input
            value={campaign.title[language]}
            maxLength={120}
            placeholder={language === 'es' ? 'Otoño en el campo' : campaign.title.es}
            onChange={(event) => setText('title', event.target.value)}
            className={adminField}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Temporada o fecha</span>
          <input
            value={campaign.season}
            maxLength={60}
            placeholder="Otoño-Invierno 2026"
            onChange={(event) => set('season', event.target.value)}
            className={adminField}
          />
        </label>
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className={adminLabel}>Presentación · {localeNames[language]}</span>
          <textarea
            value={campaign.intro[language]}
            maxLength={1200}
            rows={3}
            placeholder={language === 'es' ? '' : campaign.intro.es}
            onChange={(event) => setText('intro', event.target.value)}
            className={`${adminField} resize-y`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={adminLabel}>Dirección</span>
          <input
            value={campaign.slug}
            maxLength={60}
            placeholder={slugify(campaign.title.es) || 'otono-en-el-campo'}
            onChange={(event) => set('slug', slugify(event.target.value))}
            className={adminField}
          />
          <span className="text-[13px] text-slate">
            /campanas/{campaign.slug || slugify(campaign.title.es) || '…'} — si queda vacía, sale del título.
          </span>
        </label>
        <label className="flex items-center gap-3 self-center">
          <input
            type="checkbox"
            checked={campaign.published}
            onChange={(event) => set('published', event.target.checked)}
            className="h-5 w-5 accent-[var(--color-earth)]"
          />
          <span className="text-[15px] text-earth">Publicada (se ve en el sitio)</span>
        </label>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="m-0 font-display text-[22px] text-earth">Fotos y videos</h3>
          <span className="text-[13px] text-slate">
            Se muestran en este orden. La portada es la que lleva el sello «Portada».
          </span>
        </div>

        {campaign.media.length === 0 && (
          <p className={adminNotice}>Todavía no hay fotos ni videos. Subí archivos o pegá una URL abajo.</p>
        )}

        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {campaign.media.map((item, index) => (
            <li key={item.id} className="flex flex-col border border-earth/15 bg-paper">
              <div className="relative aspect-4/5 overflow-hidden bg-ash">
                <Thumb item={item} />
                {item.src === campaign.cover && (
                  <span className="absolute top-2 left-2 bg-earth px-2 py-1 font-sans text-[10px] tracking-[0.14em] text-paper uppercase">
                    Portada
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 p-3">
                <input
                  value={item.caption[language]}
                  maxLength={240}
                  placeholder={`Pie · ${localeNames[language]}${language !== 'es' && item.caption.es ? ` (${item.caption.es})` : ''}`}
                  onChange={(event) =>
                    setMedia(
                      campaign.media.map((m, i) =>
                        i === index ? { ...m, caption: { ...m.caption, [language]: event.target.value } } : m,
                      ),
                    )
                  }
                  className={`${adminField} py-2 text-[14px]`}
                />
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={adminLink}>
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === campaign.media.length - 1}
                    className={adminLink}
                  >
                    →
                  </button>
                  {item.kind === 'image' && item.src !== campaign.cover && (
                    <button type="button" onClick={() => set('cover', item.src)} className={adminLink}>
                      Usar de portada
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMedia(campaign.media.filter((_, i) => i !== index))}
                    className={adminLink}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-4 border border-dashed border-earth/25 p-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className={adminLabel}>Subir archivos</span>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              onChange={(event) => void upload(event.target.files)}
              className="text-[14px] text-earth file:mr-3 file:cursor-pointer file:border file:border-earth/25 file:bg-transparent file:px-3 file:py-2 file:font-sans file:text-[11px] file:tracking-[0.1em] file:text-earth file:uppercase"
            />
            <span className="text-[13px] text-slate">
              JPG, PNG o WebP hasta 15 MB; MP4 o WebM hasta 200 MB.
              {uploading > 0 && ` Subiendo ${uploading}…`}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className={adminLabel}>O pegar una URL</span>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addUrl()
                  }
                }}
                placeholder="https://youtu.be/… · https://ruralanas.com/wp-content/uploads/…"
                className={`${adminField} py-2 text-[14px]`}
              />
              <button type="button" onClick={addUrl} className={buttonClass('secondary', 'sm')}>
                Agregar
              </button>
            </div>
            <span className="text-[13px] text-slate">
              Videos de YouTube o Vimeo, o fotos de la biblioteca de medios de ruralanas.com.
            </span>
          </div>
          {uploadError && (
            <p role="alert" className="m-0 text-[14px] text-olive md:col-span-2">
              {uploadError}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function Manager({ signOut, campaignsUrl }: { signOut: () => Promise<void>; campaignsUrl: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/campanas')
    const body = (await response.json().catch(() => ({}))) as { campaigns?: Campaign[]; error?: string }
    if (!response.ok || !body.campaigns) {
      setError(body.error ?? 'No se pudieron leer las campañas.')
      return
    }
    setCampaigns(body.campaigns)
    setDirty(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const change = (next: Campaign[]) => {
    setCampaigns(next)
    setDirty(true)
    setNotice(null)
  }

  async function save() {
    if (!campaigns) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/campanas', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ campaigns }),
      })
      const body = (await response.json().catch(() => ({}))) as { campaigns?: Campaign[]; error?: string }
      if (!response.ok || !body.campaigns) {
        setError(body.error ?? 'No se pudo guardar.')
        return
      }
      setCampaigns(body.campaigns)
      setDirty(false)
      setNotice('Guardado. El sitio ya muestra los cambios.')
    } finally {
      setBusy(false)
    }
  }

  if (!campaigns) {
    return error ? (
      <p className={`${adminNotice} my-12`}>{error}</p>
    ) : (
      <p className="py-20 text-center font-sans text-[12px] tracking-[0.12em] text-slate uppercase">Cargando…</p>
    )
  }

  const current = campaigns.find((campaign) => campaign.id === editing)

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset
    if (target < 0 || target >= campaigns.length) return
    const next = [...campaigns]
    const [moved] = next.splice(index, 1)
    if (moved) next.splice(target, 0, moved)
    change(next)
  }

  return (
    <>
      {current ? (
        <CampaignEditor
          campaign={current}
          onChange={(next) => change(campaigns.map((c) => (c.id === next.id ? next : c)))}
          onClose={() => setEditing(null)}
        />
      ) : (
        <div className="py-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="m-0 font-display text-[26px] text-earth">Campañas</h2>
              <p className="mt-1 mb-0 text-[14px] text-slate">
                La primera de la lista es la que abre la página.{' '}
                <a href={campaignsUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  Ver la página
                </a>
              </p>
            </div>
            <button type="button" onClick={() => void signOut()} className={adminLink}>
              Salir
            </button>
          </div>

          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {campaigns.map((campaign, index) => (
              <li key={campaign.id} className="flex flex-wrap items-center gap-4 border border-earth/15 bg-paper p-3">
                <div className="h-20 w-16 shrink-0 overflow-hidden bg-ash">
                  {campaign.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={campaign.cover} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[20px] text-earth">{campaign.title.es || 'Sin título'}</div>
                  <div className="mt-1 font-sans text-[11px] tracking-[0.1em] text-slate uppercase">
                    <span className={campaign.published ? 'text-olive' : ''}>
                      {campaign.published ? 'Publicada' : 'Borrador'}
                    </span>
                    {campaign.season && ` · ${campaign.season}`} · {campaign.media.length} fotos y videos
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button type="button" onClick={() => setEditing(campaign.id)} className={adminLink}>
                    Editar
                  </button>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={adminLink}>
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === campaigns.length - 1}
                    className={adminLink}
                  >
                    Bajar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Borrar la campaña «${campaign.title.es || 'sin título'}»?`)) {
                        change(campaigns.filter((c) => c.id !== campaign.id))
                      }
                    }}
                    className={adminLink}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              const created = newCampaign()
              // Arriba: la más nueva abre la página.
              change([created, ...campaigns])
              setEditing(created.id)
            }}
            className={buttonClass('secondary', 'md', 'mt-4 w-full')}
          >
            + Nueva campaña
          </button>
        </div>
      )}

      <div className="sticky bottom-0 mb-10 flex flex-wrap items-center gap-4 border-t border-earth/15 bg-paper/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || !dirty}
          className={buttonClass('primary', 'md')}
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
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
    </>
  )
}

export function CampaignsAdmin({ campaignsUrl }: { campaignsUrl: string }) {
  return (
    <AdminGate title="Campañas">
      {(signOut) => <Manager signOut={signOut} campaignsUrl={campaignsUrl} />}
    </AdminGate>
  )
}
