import { Reveal } from '@/components/ui/reveal'
import { interpolate } from '@/lib/format'
import { getWorldReach } from '@/lib/world'
import type { Dictionary, Locale } from '@/lib/i18n'
import { WorldMap } from './world-map'

/**
 * "Nuestras prendas abrazan al mundo": el mapa de países alcanzados.
 *
 * Vive en Nosotros, en su propia sección («En el mundo»), como bloque
 * `worldReach` del contenido. Se lee de arriba abajo y centrado: título, mapa y
 * la leyenda de los tres colores.
 *
 * El dato de qué país está alcanzado sale de `getWorldReach()`, no de este
 * componente. Hoy lo declara `src/content/world-reach.ts` a mano; el día que lo
 * calculen los pedidos de Dolibarr, acá no se toca nada.
 */

/** Orden de la leyenda: de lo que todavía no pasó a lo que más pesa. */
const LEYENDA = ['none', 'shipped', 'store'] as const

export async function WorldReach({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const reach = await getWorldReach()

  return (
    <section className="paper-grain bg-shell px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-earth">
      <Reveal className="mx-auto max-w-[760px] text-center">
        <h2 className="m-0 font-display text-[clamp(32px,5vw,64px)] font-medium leading-[1.02]">
          {dict.world.titleTop}
          <br />
          {dict.world.titleBottom}
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] font-sans text-[15px] leading-relaxed text-slate">
          {interpolate(dict.world.reached, { count: reach.reachedCount })}
        </p>
      </Reveal>

      {/* Más angosto que el ancho de página: el mapa acompaña, no domina la sección. */}
      <Reveal className="mx-auto mt-10 max-w-[860px]">
        <WorldMap reach={reach} dict={dict} locale={locale} />
      </Reveal>

      <Reveal className="mx-auto mt-7 flex max-w-[900px] flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {LEYENDA.map((estado) => (
          <span
            key={estado}
            className="flex items-center gap-2 font-sans text-[11px] tracking-[0.1em] text-slate uppercase"
          >
            <span className="world-legend-swatch" data-status={estado} aria-hidden />
            {dict.world.legend[estado]}
          </span>
        ))}
      </Reveal>
    </section>
  )
}
