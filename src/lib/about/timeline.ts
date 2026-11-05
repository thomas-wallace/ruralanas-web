import 'server-only'

/**
 * Línea de tiempo de "Nuestra historia", editable desde el admin.
 *
 * Los hitos se guardan en el almacén de contenido (`content-store`), con su
 * texto en los tres idiomas. Mientras nadie la haya guardado nunca, se arma con
 * los hitos escritos en `src/content/about/{es,en,pt}.ts`: el primer guardado
 * desde el admin los copia y desde ahí manda lo guardado.
 *
 * Un hito sin traducir sale en español en los otros idiomas. Es preferible a
 * que falte un año en la historia.
 */

import { randomUUID } from 'node:crypto'

import { en } from '@/content/about/en'
import { es } from '@/content/about/es'
import { pt } from '@/content/about/pt'
import { readDocument, writeDocument } from '@/lib/content-store'
import { locales, type Locale } from '@/lib/i18n/config'
import type { AboutContent, ContentBlock } from './types'

export type Translated = Record<Locale, string>

export interface TimelineEntry {
  id: string
  /** Texto libre: "2019", "Fines de 2009", "2006 – 2007". Igual en todo idioma. */
  date: string
  title: Translated
  text: Translated
}

const DOCUMENT = 'nosotros-timeline'
const SOURCES: Record<Locale, AboutContent> = { es, en, pt }

type TimelineBlock = Extract<ContentBlock, { type: 'timeline' }>

function timelineOf(content: AboutContent): TimelineBlock | undefined {
  return content.hub.blocks.find((block): block is TimelineBlock => block.type === 'timeline')
}

/** Los hitos tal como están escritos en los archivos de contenido. */
function seed(): TimelineEntry[] {
  const base = timelineOf(es)?.items ?? []
  return base.map((item, index) => {
    const pick = (field: 'title' | 'text') =>
      Object.fromEntries(
        locales.map((locale) => [locale, timelineOf(SOURCES[locale])?.items[index]?.[field] ?? '']),
      ) as Translated
    return { id: `semilla-${index + 1}`, date: item.date, title: pick('title'), text: pick('text') }
  })
}

export async function getTimeline(): Promise<TimelineEntry[]> {
  return (await readDocument<TimelineEntry[]>(DOCUMENT)) ?? seed()
}

// ── Validación de lo que llega del admin ─────────────────────────────────────

const LIMITS = { entries: 80, date: 40, title: 120, text: 700 }

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/**
 * Normaliza y valida lo que manda el admin. Devuelve los hitos listos para
 * guardar, o el motivo por el que no se pueden guardar.
 */
export function parseTimeline(input: unknown): { entries: TimelineEntry[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'Se esperaba una lista de hitos.' }
  if (input.length > LIMITS.entries) return { error: `Como máximo ${LIMITS.entries} hitos.` }

  const entries: TimelineEntry[] = []
  for (const [index, raw] of input.entries()) {
    const item = (raw ?? {}) as Record<string, unknown>
    const title = (item.title ?? {}) as Record<string, unknown>
    const text = (item.text ?? {}) as Record<string, unknown>

    const entry: TimelineEntry = {
      id: typeof item.id === 'string' && /^[\w-]{1,60}$/.test(item.id) ? item.id : randomUUID(),
      date: clean(item.date, LIMITS.date),
      title: Object.fromEntries(locales.map((l) => [l, clean(title[l], LIMITS.title)])) as Translated,
      text: Object.fromEntries(locales.map((l) => [l, clean(text[l], LIMITS.text)])) as Translated,
    }

    if (!entry.date || !entry.title.es || !entry.text.es) {
      return { error: `El hito ${index + 1} necesita fecha, título y texto en español.` }
    }
    entries.push(entry)
  }
  return { entries }
}

export async function saveTimeline(entries: TimelineEntry[]): Promise<void> {
  await writeDocument(DOCUMENT, entries)
}

/** El bloque de la portada con los hitos guardados, en el idioma pedido. */
export function localizeTimeline(
  block: TimelineBlock,
  entries: TimelineEntry[],
  locale: Locale,
): TimelineBlock {
  return {
    ...block,
    items: entries.map((entry) => ({
      date: entry.date,
      title: entry.title[locale] || entry.title.es,
      text: entry.text[locale] || entry.text.es,
    })),
  }
}
