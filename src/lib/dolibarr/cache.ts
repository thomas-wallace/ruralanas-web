import 'server-only'

/**
 * Caché en memoria con vencimiento, para no pegarle a Dolibarr en cada visita.
 *
 * Vive en `globalThis` porque en desarrollo cada ruta puede cargar su propia
 * copia del módulo, y dos cachés separadas duplicarían las llamadas al ERP.
 *
 * Dos detalles que importan con un ERP en un hosting compartido:
 *
 *   · Si llegan diez pedidos juntos con la caché vacía, a Dolibarr le llega
 *     uno solo: los demás esperan la misma promesa.
 *   · Los errores no se guardan, salvo el 404, que se guarda igual que un dato.
 *     Si no, pedir una referencia inexistente sería una forma gratis de hacerle
 *     llamadas al ERP.
 */

interface Entry<T> {
  value: T
  expiresAt: number
}

interface Store {
  entries: Map<string, Entry<unknown>>
  inflight: Map<string, Promise<unknown>>
}

const KEY = Symbol.for('ruralanas.dolibarr.cache')
const globalWithStore = globalThis as typeof globalThis & { [KEY]?: Store }
const store: Store = (globalWithStore[KEY] ??= { entries: new Map(), inflight: new Map() })

export type CacheStatus = 'HIT' | 'MISS'

export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<{ value: T; status: CacheStatus }> {
  const entry = store.entries.get(key) as Entry<T> | undefined
  if (entry && entry.expiresAt > Date.now()) return { value: entry.value, status: 'HIT' }

  let pending = store.inflight.get(key) as Promise<T> | undefined
  if (!pending) {
    pending = load()
      .then((value) => {
        store.entries.set(key, { value, expiresAt: Date.now() + ttlMs })
        return value
      })
      .finally(() => store.inflight.delete(key))
    store.inflight.set(key, pending)
  }
  return { value: await pending, status: 'MISS' }
}

/** Vacía todo lo que empiece con el prefijo. Sin prefijo, vacía la caché entera. */
export function invalidate(prefix = ''): number {
  let removed = 0
  for (const key of store.entries.keys()) {
    if (key.startsWith(prefix)) {
      store.entries.delete(key)
      removed += 1
    }
  }
  return removed
}
