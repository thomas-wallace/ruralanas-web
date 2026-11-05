'use client'

/**
 * Editor de la línea de tiempo de "Nuestra historia".
 *
 * Se edita la lista entera y se guarda de una vez: agregar, corregir, borrar y
 * mover hitos son cambios locales hasta "Guardar". La fecha es una sola para
 * los tres idiomas; título y texto se escriben por idioma, con el español como
 * obligatorio. Lo que falte en inglés o portugués sale en español en el sitio.
 */

import { useCallback, useEffect, useState } from 'react'

import { buttonClass } from '@/components/ui/button'
import type { TimelineEntry } from '@/lib/about/timeline'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'

import { AdminGate } from './admin-gate'
import { adminField, adminLabel, adminLink, adminNotice } from './admin-ui'

const emptyTranslated = () => Object.fromEntries(locales.map((l) => [l, ''])) as TimelineEntry['title']

function newEntry(): TimelineEntry {
  return { id: crypto.randomUUID(), date: '', title: emptyTranslated(), text: emptyTranslated() }
}

function missingTranslations(entry: TimelineEntry): Locale[] {
  return locales.filter((l) => l !== 'es' && (!entry.title[l] || !entry.text[l]))
}

function Editor({ signOut, aboutUrl }: { signOut: () => Promise<void>; aboutUrl: string }) {
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null)
  const [language, setLanguage] = useState<Locale>('es')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/nosotros')
    const body = (await response.json().catch(() => ({}))) as {
      entries?: TimelineEntry[]
      error?: string
    }
    if (!response.ok || !body.entries) {
      setError(body.error ?? 'No se pudo leer la línea de tiempo.')
      return
    }
    setEntries(body.entries)
    setDirty(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Avisar antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const change = (next: TimelineEntry[]) => {
    setEntries(next)
    setDirty(true)
    setNotice(null)
  }

  const update = (index: number, patch: (entry: TimelineEntry) => TimelineEntry) =>
    entries && change(entries.map((entry, i) => (i === index ? patch(entry) : entry)))

  const move = (index: number, offset: -1 | 1) => {
    if (!entries) return
    const target = index + offset
    if (target < 0 || target >= entries.length) return
    const next = [...entries]
    const [moved] = next.splice(index, 1)
    if (moved) next.splice(target, 0, moved)
    change(next)
  }

  const remove = (index: number) => {
    if (!entries) return
    const entry = entries[index]
    if (!entry) return
    if (!window.confirm(`¿Borrar el hito "${entry.date} · ${entry.title.es || 'sin título'}"?`)) return
    change(entries.filter((_, i) => i !== index))
  }

  async function save() {
    if (!entries) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/nosotros', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const body = (await response.json().catch(() => ({}))) as {
        entries?: TimelineEntry[]
        error?: string
      }
      if (!response.ok || !body.entries) {
        setError(body.error ?? 'No se pudo guardar.')
        return
      }
      setEntries(body.entries)
      setDirty(false)
      setNotice('Guardado. La página Nosotros ya muestra los cambios.')
    } finally {
      setBusy(false)
    }
  }

  if (!entries) {
    return error ? (
      <p className={`${adminNotice} my-12`}>{error}</p>
    ) : (
      <p className="py-20 text-center font-sans text-[12px] tracking-[0.12em] text-slate uppercase">
        Cargando…
      </p>
    )
  }

  return (
    <div className="py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 font-display text-[26px] text-earth">Nuestra historia</h2>
          <p className="mt-1 mb-0 text-[14px] text-slate">
            {entries.length} hitos · se muestran en este orden, del más antiguo al más reciente.{' '}
            <a href={aboutUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Ver la página
            </a>
          </p>
        </div>
        <button type="button" onClick={() => void signOut()} className={adminLink}>
          Salir
        </button>
      </div>

      {/* Idioma que se está editando. La fecha es común a los tres. */}
      <div role="tablist" aria-label="Idioma" className="mb-6 flex gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={language === locale}
            onClick={() => setLanguage(locale)}
            className={`cursor-pointer rounded-sm border px-3 py-2 font-sans text-[11px] tracking-[0.1em] uppercase transition-colors ${
              language === locale
                ? 'border-earth bg-earth text-paper'
                : 'border-earth/25 text-earth hover:border-earth'
            }`}
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>

      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {entries.map((entry, index) => {
          const missing = missingTranslations(entry)
          return (
            <li key={entry.id} className="border border-earth/15 bg-paper p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="font-sans text-[11px] tracking-[0.14em] text-olive uppercase">
                  Hito {index + 1}
                  {missing.length > 0 && (
                    <span className="ml-3 text-slate normal-case tracking-normal">
                      Falta traducir: {missing.map((l) => localeNames[l]).join(', ')}
                    </span>
                  )}
                </span>
                <span className="flex gap-4">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={adminLink}>
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === entries.length - 1}
                    className={adminLink}
                  >
                    Bajar
                  </button>
                  <button type="button" onClick={() => remove(index)} className={adminLink}>
                    Borrar
                  </button>
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <label className="flex flex-col gap-1.5">
                  <span className={adminLabel}>Fecha</span>
                  <input
                    value={entry.date}
                    maxLength={40}
                    placeholder="2025"
                    onChange={(event) => update(index, (e) => ({ ...e, date: event.target.value }))}
                    className={adminField}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={adminLabel}>Título · {localeNames[language]}</span>
                  <input
                    value={entry.title[language]}
                    maxLength={120}
                    placeholder={language === 'es' ? '' : entry.title.es}
                    onChange={(event) =>
                      update(index, (e) => ({ ...e, title: { ...e.title, [language]: event.target.value } }))
                    }
                    className={adminField}
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className={adminLabel}>Texto · {localeNames[language]}</span>
                  <textarea
                    value={entry.text[language]}
                    maxLength={700}
                    rows={3}
                    placeholder={language === 'es' ? '' : entry.text.es}
                    onChange={(event) =>
                      update(index, (e) => ({ ...e, text: { ...e.text, [language]: event.target.value } }))
                    }
                    className={`${adminField} resize-y`}
                  />
                </label>
              </div>
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={() => change([...entries, newEntry()])}
        className={buttonClass('secondary', 'md', 'mt-4 w-full')}
      >
        + Agregar hito
      </button>

      {/* Barra de guardado: queda a la vista mientras se baja por la lista. */}
      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-4 border-t border-earth/15 bg-paper/95 py-4 backdrop-blur">
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
    </div>
  )
}

export function TimelineAdmin({ aboutUrl }: { aboutUrl: string }) {
  return (
    <AdminGate title="Nosotros">{(signOut) => <Editor signOut={signOut} aboutUrl={aboutUrl} />}</AdminGate>
  )
}
