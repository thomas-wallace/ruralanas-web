'use client'

/**
 * Carrito del cliente.
 *
 * El estado real vive en el servidor: acá sólo hay una copia de lo último que
 * respondió `/api/cart`. Es a propósito. Un carrito calculado en el navegador
 * puede mostrar un total que el checkout después no acepta, y con piezas
 * únicas puede prometer una unidad que otro cliente acaba de llevarse.
 *
 * La lista de deseos sí se queda en el navegador: no compromete stock, no
 * necesita servidor y funciona sin cuenta. Reemplaza al plugin YITH.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { Cart, CartLine } from '@/lib/commerce/types'
import type { Locale } from '@/lib/i18n/config'

export type CartErrorCode =
  | 'unavailable'
  | 'unknown_sku'
  | 'out_of_stock'
  | 'invalid_request'
  | 'upstream'
  | 'not_found'
  | 'network'

export interface CartOutcome {
  ok: boolean
  code?: CartErrorCode
  /** Texto del servidor. Se usa sólo si el diccionario no cubre el código. */
  message?: string
}

interface ShippingQuery {
  country: string
  city?: string
  postcode?: string
  state?: string
}

/** Qué motor hay del otro lado. Cambia a dónde lleva "finalizar compra". */
export type CommerceMode = 'local' | 'woo' | 'woo-hosted'

interface CartContextValue {
  mode: CommerceMode
  cart: Cart | null
  lines: CartLine[]
  count: number
  /** `true` una vez leída la primera respuesta: evita parpadeo de contadores. */
  ready: boolean
  /** Hay una operación en vuelo. Bloquea los botones que crearían duplicados. */
  busy: boolean
  lastError: CartOutcome | null

  add: (input: {
    sku: string
    slug: string
    quantity?: number
    /** Identificador en el motor, cuando el catálogo ya lo trae resuelto. */
    commerceId?: string
    /** Variante elegida. Obligatoria en las piezas que tienen color. */
    variation?: { attribute: string; value: string }[]
  }) => Promise<CartOutcome>
  setQuantity: (key: string, quantity: number) => Promise<CartOutcome>
  remove: (key: string) => Promise<CartOutcome>
  setShippingQuery: (address: ShippingQuery) => Promise<CartOutcome>
  selectRate: (rateId: string) => Promise<CartOutcome>
  refresh: () => Promise<void>
  /** Tras un checkout exitoso: el motor ya vació el carrito. */
  applyCart: (cart: Cart) => void

  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void

  wishlist: string[]
  toggleWish: (slug: string) => void
  isWished: (slug: string) => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

const WISH_KEY = 'ruralanas.wishlist.v1'

const EMPTY_CART: Cart = {
  lines: [],
  itemCount: 0,
  totals: { currency: 'USD', subtotal: 0, shipping: 0, tax: 0, discount: 0, total: 0, taxIncluded: false },
  shippingRates: [],
  needsShipping: false,
  notices: [],
}

interface ApiError {
  error?: { code?: CartErrorCode; message?: string }
}

export function CartProvider({
  locale,
  mode,
  children,
}: {
  locale: Locale
  mode: CommerceMode
  children: ReactNode
}) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lastError, setLastError] = useState<CartOutcome | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])

  /** Serializa las operaciones: dos cambios simultáneos sobre el mismo carrito
   *  del servidor devuelven estados contradictorios y gana el que llega último. */
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const call = useCallback(
    async (init?: RequestInit): Promise<CartOutcome> => {
      setBusy(true)
      setLastError(null)
      try {
        const response = await fetch(`/api/cart?locale=${locale}`, {
          ...init,
          headers: init?.body ? { 'content-type': 'application/json' } : undefined,
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as ApiError
          const outcome: CartOutcome = {
            ok: false,
            code: body.error?.code ?? 'upstream',
            message: body.error?.message,
          }
          setLastError(outcome)
          return outcome
        }

        setCart((await response.json()) as Cart)
        return { ok: true }
      } catch {
        const outcome: CartOutcome = { ok: false, code: 'network' }
        setLastError(outcome)
        return outcome
      } finally {
        setBusy(false)
        setReady(true)
      }
    },
    [locale],
  )

  /** Encola para que las operaciones no se pisen entre sí. */
  const enqueue = useCallback(
    (task: () => Promise<CartOutcome>): Promise<CartOutcome> => {
      const next = queue.current.then(task, task)
      queue.current = next.catch(() => undefined)
      return next
    },
    [],
  )

  const post = useCallback(
    (body: unknown) => enqueue(() => call({ method: 'POST', body: JSON.stringify(body) })),
    [call, enqueue],
  )

  useEffect(() => {
    void enqueue(() => call())
    try {
      const raw = window.localStorage.getItem(WISH_KEY)
      if (raw) setWishlist(JSON.parse(raw) as string[])
    } catch {
      /* Modo privado o storage lleno: la wishlist simplemente empieza vacía. */
    }
  }, [call, enqueue])

  const toggleWish = useCallback((slug: string) => {
    setWishlist((current) => {
      const next = current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
      try {
        window.localStorage.setItem(WISH_KEY, JSON.stringify(next))
      } catch {
        /* Se pierde al cerrar; no vale romper la interacción por esto. */
      }
      return next
    })
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const current = cart ?? EMPTY_CART
    return {
      mode,
      cart,
      lines: current.lines,
      count: current.itemCount,
      ready,
      busy,
      lastError,
      add: ({ sku, slug, quantity = 1, commerceId, variation }) =>
        post({ op: 'add', sku, slug, quantity, commerceId, variation }),
      setQuantity: (key, quantity) => post({ op: 'update', key, quantity }),
      remove: (key) => post({ op: 'remove', key }),
      setShippingQuery: (address) => post({ op: 'customer', address }),
      selectRate: (rateId) => post({ op: 'shipping', rateId }),
      refresh: async () => {
        await enqueue(() => call())
      },
      applyCart: setCart,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      wishlist,
      toggleWish,
      isWished: (slug: string) => wishlist.includes(slug),
    }
  }, [mode, cart, ready, busy, lastError, post, call, enqueue, drawerOpen, wishlist, toggleWish])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart necesita estar dentro de <CartProvider>')
  return context
}
