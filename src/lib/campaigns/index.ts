import 'server-only'

/**
 * Campañas: contenido editorial de moda —fotos y videos— que se carga desde el
 * admin (`/admin/campanas`) y se publica en `/campanas`.
 *
 * Se guardan todas juntas en un documento del almacén de contenido. Una campaña
 * nueva nace como borrador y sólo se ve en el sitio cuando se publica.
 *
 * De dónde puede venir cada foto o video (se valida al guardar):
 *   · subido desde el admin → `/api/medios/…`
 *   · la biblioteca de medios de ruralanas.com → `https://ruralanas.com/wp-content/uploads/…`
 *   · un video de YouTube o Vimeo, por su URL
 * Nada más: `next/image` sólo optimiza orígenes declarados, y un enlace a
 * cualquier sitio sería una foto que mañana puede desaparecer.
 */

import { randomUUID } from 'node:crypto'

import { readDocument, writeDocument } from '@/lib/content-store'
import { locales, type Locale } from '@/lib/i18n/config'
import { slugify } from '@/lib/slug'

export type Translated = Record<Locale, string>

export interface CampaignImage {
  id: string
  kind: 'image'
  src: string
  /** Pie de foto. También es el texto alternativo. */
  caption: Translated
}

export interface CampaignVideo {
  id: string
  kind: 'video'
  src: string
  caption: Translated
}

export type CampaignMedia = CampaignImage | CampaignVideo

export interface Campaign {
  id: string
  /** Parte de la URL. Igual en todos los idiomas, como en la tienda. */
  slug: string
  published: boolean
  /** Temporada o fecha, texto libre: "Otoño-Invierno 2026". */
  season: string
  title: Translated
  intro: Translated
  /** Foto de portada: la del listado y la del encabezado de la campaña. */
  cover: string
  media: CampaignMedia[]
}

/** Lo que ve el visitante: ya en su idioma, con el español de respaldo. */
export interface LocalizedCampaign {
  slug: string
  season: string
  title: string
  intro: string
  cover: string
  media: { id: string; kind: 'image' | 'video'; src: string; caption: string }[]
}

const DOCUMENT = 'campanas'
const UPLOADS = 'https://ruralanas.com/wp-content/uploads'

const t = (es: string): Translated =>
  Object.fromEntries(locales.map((l) => [l, l === 'es' ? es : ''])) as Translated

/**
 * Punto de partida mientras no se haya guardado nada: un **borrador** armado con
 * la sesión de fotos con modelos que está en la biblioteca de WordPress sin
 * usar. No se publica solo: hay que ponerle nombre y publicarlo desde el admin.
 */
function seed(): Campaign[] {
  const photos = [
    'Viviana-_-ruana-turquesa-1.png',
    'DSC09362-editada.jpg',
    'Viviana-y-Sophie-_-2-ruanas-aqua-o-verde-y-aqua-1.png',
    'Viviana-_-ruana-turquesa-3.png',
    'DSC09409-ED.png',
    'DSC09469.jpg.png',
    'DSC09461.jpg.jpg',
    'DSC09260-ED.jpg',
    'DSC08955_1.jpg.jpg',
    'DSC09476.jpg.jpg',
    'Viviana-_-ruana-aquam-2.png',
    'DSC09372-editada.jpg',
  ]
  return [
    {
      id: 'semilla-sesion-editorial',
      slug: 'sesion-editorial',
      published: false,
      season: '',
      title: t('Sesión editorial'),
      intro: t(''),
      cover: `${UPLOADS}/${photos[0]}`,
      media: photos.map((file, index) => ({
        id: `semilla-${index + 1}`,
        kind: 'image',
        src: `${UPLOADS}/${file}`,
        caption: t(''),
      })),
    },
  ]
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  return (await readDocument<Campaign[]>(DOCUMENT)) ?? seed()
}

export async function saveAllCampaigns(campaigns: Campaign[]): Promise<void> {
  await writeDocument(DOCUMENT, campaigns)
}

function localize(campaign: Campaign, locale: Locale): LocalizedCampaign {
  const pick = (value: Translated) => value[locale] || value.es
  return {
    slug: campaign.slug,
    season: campaign.season,
    title: pick(campaign.title),
    intro: pick(campaign.intro),
    cover: campaign.cover,
    media: campaign.media.map((item) => ({
      id: item.id,
      kind: item.kind,
      src: item.src,
      caption: pick(item.caption),
    })),
  }
}

/** Campañas publicadas, en el orden del admin (la primera es la más nueva). */
export async function listCampaigns(locale: Locale): Promise<LocalizedCampaign[]> {
  return (await getAllCampaigns())
    .filter((campaign) => campaign.published)
    .map((campaign) => localize(campaign, locale))
}

export async function getCampaign(slug: string, locale: Locale): Promise<LocalizedCampaign | null> {
  const found = (await getAllCampaigns()).find(
    (campaign) => campaign.published && campaign.slug === slug,
  )
  return found ? localize(found, locale) : null
}

// ── Videos ───────────────────────────────────────────────────────────────────

export type VideoSource =
  | { type: 'youtube'; id: string }
  | { type: 'vimeo'; id: string }
  | { type: 'file'; src: string }

/** Cómo se reproduce un video según su URL. `null` si no es un origen admitido. */
export function videoSource(src: string): VideoSource | null {
  const youtube =
    /^https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(src)
  if (youtube?.[1]) return { type: 'youtube', id: youtube[1] }

  const vimeo = /^https:\/\/(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d{6,12})/.exec(src)
  if (vimeo?.[1]) return { type: 'vimeo', id: vimeo[1] }

  if (/^\/api\/medios\/[a-f0-9-]{36}\.(mp4|webm)$/.test(src)) return { type: 'file', src }
  if (src.startsWith(`${UPLOADS}/`) && /\.(mp4|webm)$/i.test(src)) return { type: 'file', src }
  return null
}

function imageAllowed(src: string): boolean {
  return (
    /^\/api\/medios\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(src) ||
    (src.startsWith(`${UPLOADS}/`) && /\.(jpe?g|png|webp)$/i.test(src))
  )
}

// ── Validación de lo que llega del admin ─────────────────────────────────────

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function translated(value: unknown, max: number): Translated {
  const raw = (value ?? {}) as Record<string, unknown>
  return Object.fromEntries(locales.map((l) => [l, clean(raw[l], max)])) as Translated
}

const id = (value: unknown) =>
  typeof value === 'string' && /^[\w-]{1,60}$/.test(value) ? value : randomUUID()

/** Normaliza y valida la lista entera de campañas que manda el admin. */
export function parseCampaigns(input: unknown): { campaigns: Campaign[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'Se esperaba una lista de campañas.' }
  if (input.length > 100) return { error: 'Como máximo 100 campañas.' }

  const campaigns: Campaign[] = []
  const slugs = new Set<string>()

  for (const raw of input) {
    const item = (raw ?? {}) as Record<string, unknown>
    const title = translated(item.title, 120)
    const name = title.es || 'sin título'
    const slug = slugify(clean(item.slug, 60) || title.es)

    if (!title.es) return { error: 'Cada campaña necesita un título en español.' }
    if (!slug) return { error: `«${name}» necesita una dirección (slug) válida.` }
    if (slugs.has(slug)) return { error: `Hay dos campañas con la dirección «${slug}».` }
    slugs.add(slug)

    const rawMedia = Array.isArray(item.media) ? item.media.slice(0, 120) : []
    const media: CampaignMedia[] = []
    for (const entry of rawMedia) {
      const m = (entry ?? {}) as Record<string, unknown>
      const src = clean(m.src, 500)
      const kind = m.kind === 'video' ? 'video' : 'image'
      if (kind === 'image' && !imageAllowed(src)) {
        return { error: `«${name}»: una foto no viene de un origen admitido (${src || 'vacía'}).` }
      }
      if (kind === 'video' && !videoSource(src)) {
        return { error: `«${name}»: un video no es de YouTube, Vimeo ni un archivo subido (${src || 'vacío'}).` }
      }
      media.push({ id: id(m.id), kind, src, caption: translated(m.caption, 240) })
    }

    const cover = clean(item.cover, 500)
    const published = item.published === true
    if (cover && !imageAllowed(cover)) return { error: `«${name}»: la portada no viene de un origen admitido.` }
    if (published && !cover) return { error: `«${name}»: para publicarla hace falta una portada.` }

    campaigns.push({
      id: id(item.id),
      slug,
      published,
      season: clean(item.season, 60),
      title,
      intro: translated(item.intro, 1200),
      cover,
      media,
    })
  }

  return { campaigns }
}
