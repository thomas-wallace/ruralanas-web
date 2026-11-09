'use client'

/**
 * Editor del mapa de Nosotros → En el mundo.
 *
 * En el mapa están los países cargados a mano y los que tienen ventas, que
 * WordPress anota solo con cada pedido pagado. Desde acá se agrega un país a
 * mano, se oculta uno (también uno con ventas: si sólo se lo sacara de la lista,
 * el próximo pedido lo volvería a poner) y se editan los locales propios.
 *
 * Como el resto del admin, los cambios son locales hasta "Guardar".
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import { buttonClass } from '@/components/ui/button'
import type { ReachDocument, SalesByCountry } from '@/lib/world/reach-store'

import { AdminGate } from './admin-gate'
import { adminField, adminLabel, adminLink, adminNotice } from './admin-ui'

interface State {
  document: ReachDocument
  sales: SalesByCountry
  salesAvailable: boolean
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' })
  } catch {
    return null
  }
})()

function countryName(code: string): string {
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

const byName = (a: string, b: string) => countryName(a).localeCompare(countryName(b), 'es')

function formatDay(day: string): string {
  const [year, month, date] = day.split('-')
  return year && month && date ? `${date}/${month}/${year}` : day
}

function Editor({
  signOut,
  mapUrl,
  drawable,
}: {
  signOut: () => Promise<void>
  mapUrl: string
  drawable: string[]
}) {
  const [state, setState] = useState<State | null>(null)
  const [adding, setAdding] = useState('')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/mapa')
    const body = (await response.json().catch(() => ({}))) as Partial<State> & { error?: string }
    if (!response.ok || !body.document) {
      setError(body.error ?? 'No se pudo leer el mapa.')
      return
    }
    setState(body as State)
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

  const document = state?.document
  const sales = state?.sales ?? {}

  // Lo mismo que dibuja el mapa: lista a mano + ventas − ocultos, más los locales.
  const shown = useMemo(() => {
    if (!document) return []
    const hidden = new Set(document.hidden)
    const stores = new Set(document.stores.map((store) => store.code))
    const codes = new Set([...document.manual, ...Object.keys(sales)])
    return [...new Set([...stores, ...[...codes].filter((code) => !hidden.has(code))])].sort(byName)
  }, [document, sales])

  const addable = useMemo(
    () => drawable.filter((code) => !shown.includes(code)).sort(byName),
    [drawable, shown],
  )

  const change = (next: ReachDocument) => {
    if (!state) return
    setState({ ...state, document: next })
    setDirty(true)
    setNotice(null)
  }

  if (!state || !document) {
    return error ? (
      <p className={`${adminNotice} my-12`}>{error}</p>
    ) : (
      <p className="py-20 text-center font-sans text-[12px] tracking-[0.12em] text-slate uppercase">
        Cargando…
      </p>
    )
  }

  const add = () => {
    if (!adding) return
    change({
      ...document,
      // Si estaba oculto, vuelve; si no tiene ventas, queda en la lista a mano.
      hidden: document.hidden.filter((code) => code !== adding),
      manual: sales[adding] || document.manual.includes(adding) ? document.manual : [...document.manual, adding],
    })
    setAdding('')
  }

  const hide = (code: string) =>
    change(
      sales[code]
        ? { ...document, hidden: [...document.hidden, code] }
        : { ...document, manual: document.manual.filter((item) => item !== code) },
    )

  const unhide = (code: string) =>
    change({ ...document, hidden: document.hidden.filter((item) => item !== code) })

  const updateStore = (index: number, patch: Partial<ReachDocument['stores'][number]>) =>
    change({
      ...document,
      stores: document.stores.map((store, i) => (i === index ? { ...store, ...patch } : store)),
    })

  async function save() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/mapa', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document }),
      })
      const body = (await response.json().catch(() => ({}))) as Partial<State> & { error?: string }
      if (!response.ok || !body.document) {
        setError(body.error ?? 'No se pudo guardar.')
        return
      }
      setState(body as State)
      setDirty(false)
      setNotice('Guardado. El mapa de Nosotros ya muestra los cambios.')
    } finally {
      setBusy(false)
    }
  }

  /** Recorre los pedidos pagados anteriores, de a una página, y anota sus países. */
  async function importPast() {
    if (dirty && !window.confirm('Hay cambios sin guardar y se van a perder. ¿Seguir?')) return
    setBusy(true)
    setError(null)
    setNotice(null)
    const before = Object.keys(sales).length
    try {
      for (let page = 1; ; page++) {
        const response = await fetch('/api/admin/mapa', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ page }),
        })
        const body = (await response.json().catch(() => ({}))) as Partial<State> & {
          pages?: number
          orders?: number
          done?: boolean
          error?: string
        }
        if (!response.ok) {
          setError(body.error ?? 'No se pudieron leer los pedidos.')
          return
        }
        setProgress(`Leyendo pedidos… página ${page} de ${Math.max(body.pages ?? 1, 1)}`)
        if (body.done && body.document) {
          setState(body as State)
          setDirty(false)
          const found = Object.keys(body.sales ?? {}).length
          setNotice(
            `Listo: ${body.orders ?? 0} pedidos pagados revisados, ${found} países con ventas` +
              (found > before ? ` (${found - before} nuevos).` : '.'),
          )
          return
        }
      }
    } finally {
      setProgress(null)
      setBusy(false)
    }
  }

  return (
    <div className="py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 font-display text-[26px] text-earth">{shown.length} países en el mapa</h2>
          <p className="mt-1 mb-0 text-[14px] text-slate">
            Los cargados a mano más los que tienen ventas.{' '}
            <a href={mapUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Ver el mapa
            </a>
          </p>
        </div>
        <button type="button" onClick={() => void signOut()} className={adminLink}>
          Salir
        </button>
      </div>

      {!state.salesAvailable && (
        <p className={`${adminNotice} mb-8`}>
          En este entorno las ventas no se leen: el contenido se guarda en el disco y no en WordPress. El
          mapa muestra sólo la lista a mano.
        </p>
      )}

      {/* Países en el mapa */}
      <ul className="m-0 list-none divide-y divide-earth/10 border-y border-earth/15 p-0">
        {shown.map((code) => {
          const sale = sales[code]
          const store = document.stores.find((item) => item.code === code)
          const manual = document.manual.includes(code)
          const origin = [
            store && `Local propio en ${store.city}`,
            manual && 'Cargado a mano',
            sale &&
              `${manual || store ? 'con ventas' : 'Por ventas'} desde el ${formatDay(sale.since)}` +
                (sale.order ? ` (pedido #${sale.order})` : ''),
          ]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={code} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
              <span className="text-[15px] text-earth">
                {countryName(code)} <span className="font-sans text-[11px] text-slate">{code}</span>
              </span>
              <span className="flex items-center gap-5">
                <span className="text-[13px] text-slate">{origin}</span>
                {!store && (
                  <button type="button" onClick={() => hide(code)} className={adminLink}>
                    {sale ? 'Ocultar' : 'Quitar'}
                  </button>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[260px] flex-1 flex-col gap-1.5">
          <span className={adminLabel}>Agregar un país a mano</span>
          <select value={adding} onChange={(event) => setAdding(event.target.value)} className={adminField}>
            <option value="">Elegí un país…</option>
            {addable.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={add} disabled={!adding} className={buttonClass('secondary', 'md')}>
          Agregar
        </button>
      </div>

      {document.hidden.length > 0 && (
        <section className="mt-12">
          <h3 className="m-0 font-display text-[22px] text-earth">Ocultos</h3>
          <p className="mt-1 mb-4 text-[14px] text-slate">
            Tienen ventas o están en la lista, pero no se muestran en el mapa.
          </p>
          <ul className="m-0 list-none divide-y divide-earth/10 border-y border-earth/15 p-0">
            {[...document.hidden].sort(byName).map((code) => (
              <li key={code} className="flex items-center justify-between gap-6 py-3">
                <span className="text-[15px] text-slate">{countryName(code)}</span>
                <button type="button" onClick={() => unhide(code)} className={adminLink}>
                  Volver a mostrar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h3 className="m-0 font-display text-[22px] text-earth">Locales propios</h3>
        <p className="mt-1 mb-4 text-[14px] text-slate">
          Se marcan con un punto sobre la ciudad. Las coordenadas son las de la ciudad (por ejemplo, de
          Google Maps: clic derecho sobre el lugar).
        </p>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {document.stores.map((store, index) => (
            <li key={index} className="grid gap-3 border border-earth/15 p-4 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto]">
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>País</span>
                <select
                  value={store.code}
                  onChange={(event) => updateStore(index, { code: event.target.value })}
                  className={adminField}
                >
                  {[...drawable].sort(byName).map((code) => (
                    <option key={code} value={code}>
                      {countryName(code)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>Ciudad</span>
                <input
                  value={store.city}
                  maxLength={60}
                  onChange={(event) => updateStore(index, { city: event.target.value })}
                  className={adminField}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>Latitud</span>
                <input
                  type="number"
                  step="0.0001"
                  value={store.lat}
                  onChange={(event) => updateStore(index, { lat: Number(event.target.value) })}
                  className={adminField}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={adminLabel}>Longitud</span>
                <input
                  type="number"
                  step="0.0001"
                  value={store.lon}
                  onChange={(event) => updateStore(index, { lon: Number(event.target.value) })}
                  className={adminField}
                />
              </label>
              <button
                type="button"
                onClick={() => change({ ...document, stores: document.stores.filter((_, i) => i !== index) })}
                className={`${adminLink} self-end pb-3`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() =>
            change({ ...document, stores: [...document.stores, { code: 'UY', city: '', lat: -34.9, lon: -56.16 }] })
          }
          className={buttonClass('secondary', 'md', 'mt-3 w-full')}
        >
          + Agregar local
        </button>
      </section>

      {state.salesAvailable && (
        <section className="mt-12">
          <h3 className="m-0 font-display text-[22px] text-earth">Ventas anteriores</h3>
          <p className="mt-1 mb-4 max-w-[640px] text-[14px] text-slate">
            Cada pedido pagado suma su país solo. Los pedidos de antes de activar esto se pueden revisar una
            vez con este botón: no cambia nada de los pedidos, sólo anota sus países.
          </p>
          <button
            type="button"
            onClick={() => void importPast()}
            disabled={busy}
            className={buttonClass('secondary', 'md')}
          >
            Buscar países en pedidos anteriores
          </button>
          {progress && (
            <span role="status" className="ml-4 text-[14px] text-slate">
              {progress}
            </span>
          )}
        </section>
      )}

      <div className="sticky bottom-0 mt-10 flex flex-wrap items-center gap-4 border-t border-earth/15 bg-paper/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || !dirty}
          className={buttonClass('primary', 'md')}
        >
          {busy && !progress ? 'Guardando…' : 'Guardar cambios'}
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

export function WorldReachAdmin({ mapUrl, drawable }: { mapUrl: string; drawable: string[] }) {
  return (
    <AdminGate title="Mapa">
      {(signOut) => <Editor signOut={signOut} mapUrl={mapUrl} drawable={drawable} />}
    </AdminGate>
  )
}
