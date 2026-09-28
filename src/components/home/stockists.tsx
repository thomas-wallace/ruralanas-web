import Image from 'next/image'

import { ScrollRail } from '@/components/ui/scroll-rail'
import type { Dictionary } from '@/lib/i18n'
import { getStockists } from '@/lib/stockists'

const CARD = 'w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[40%] lg:w-[34%]'

/**
 * Tiendas adheridas, debajo del local propio. Mismo carril que el adelanto
 * del catálogo: la última tarjeta queda cortada y la línea de progreso dice
 * cuánto falta.
 *
 * Los logos van en gris y toman su color al pasar el mouse: cada marca trae
 * su paleta, y en color las tres juntas se pelean con la foto del local. Los
 * archivos tienen fondo transparente y vienen recortados al borde del logo:
 * el aire lo pone la tarjeta, no la imagen.
 * Sin tiendas cargadas, el bloque no se muestra.
 */
export async function Stockists({ dict }: { dict: Dictionary }) {
  const stores = await getStockists()
  if (stores.length === 0) return null

  const { stockists: text } = dict.store

  return (
    <div className="mt-12 border-t border-earth/15 pt-8">
      <h3 className="m-0 mb-5 text-[12px] font-normal tracking-[0.06em] text-slate uppercase">
        {text.title}
      </h3>

      <ScrollRail label={text.title} prevLabel={dict.peek.prev} nextLabel={dict.peek.next}>
        {stores.map((store) => {
          const place = [store.city, store.country].filter(Boolean).join(' · ')
          const card = (
            <>
              <div className="relative aspect-4/3">
                {store.logo ? (
                  <Image
                    src={store.logo}
                    alt={store.name}
                    fill
                    sizes="200px"
                    className="object-contain p-[4%] grayscale transition-[filter] duration-500 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-xl text-earth">
                    {store.name}
                  </span>
                )}
              </div>
              <div className="pt-3 text-[13px] leading-snug text-earth">{store.name}</div>
              {place && (
                <div className="mt-1 font-mono text-[10px] tracking-[0.16em] text-slate uppercase">
                  {place}
                </div>
              )}
            </>
          )

          return (
            <li key={store.id} className={CARD}>
              {store.url || store.mapsUrl ? (
                <a
                  href={store.url ?? store.mapsUrl}
                  target="_blank"
                  rel="noopener"
                  className="group block"
                >
                  {card}
                </a>
              ) : (
                <div className="group">{card}</div>
              )}
            </li>
          )
        })}
      </ScrollRail>
    </div>
  )
}
