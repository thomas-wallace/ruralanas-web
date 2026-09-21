import { MAP_VIEWBOX, COUNTRY_PATHS, projectPoint } from '@/lib/world/geometry'
import type { WorldReach } from '@/lib/world/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { MapHover } from './world-map-hover'

/**
 * El mapa de alcance de la home.
 *
 * Es un componente de servidor a propósito: los 113 KB de siluetas viven en el
 * HTML y nunca en el bundle de JavaScript. Lo único que llega al navegador es
 * `MapHover`, que no sabe nada de geografía —lee los `data-` de los paths— y
 * pesa unas pocas líneas.
 *
 * Los colores no están acá sino en `globals.css`, bajo `.world-map`: el realce
 * al pasar el mouse tiene que ser CSS para no depender de React.
 */

/**
 * Recorte vertical. La proyección cubre de polo a polo, pero al norte de
 * Groenlandia (83,6°) y al sur del Cabo de Hornos (-55,9°) no queda tierra: la
 * Antártida está excluida del mapa. Recortar ese vacío es lo que convierte el
 * mapa en una franja panorámica en vez de un rectángulo medio desierto.
 *
 * El margen va en píxeles y no en grados a propósito: cerca de los polos
 * Robinson comprime tanto que un par de grados no llegan a ser un respiro.
 */
const MARGEN = 12
const TOP = projectPoint(0, 83.7).y - MARGEN
const BOTTOM = projectPoint(0, -56).y + MARGEN

/** Nombre del país en el idioma de la página; si no hay ICU, queda el código. */
function countryNamer(locale: Locale): (code: string) => string {
  let display: Intl.DisplayNames | null = null
  try {
    display = new Intl.DisplayNames([locale], { type: 'region' })
  } catch {
    /* Entorno sin ICU completo: el código sigue siendo legible. */
  }
  return (code) => display?.of(code) ?? code
}

export function WorldMap({
  reach,
  dict,
  locale,
}: {
  reach: WorldReach
  dict: Dictionary
  locale: Locale
}) {
  const nameOf = countryNamer(locale)
  const byCode = new Map(reach.countries.map((país) => [país.code, país]))

  /** Nodos: locales propios y países que a esta resolución no tienen silueta. */
  const nodes = reach.countries.flatMap((país) => {
    if (!país.node) return []
    const { x, y } = projectPoint(país.node.lon, país.node.lat)
    return [{ ...país, x, y, name: país.node.label ?? nameOf(país.code) }]
  })

  const alcanzados = reach.countries
    .map((país) => nameOf(país.code))
    .sort((a, b) => a.localeCompare(b, locale))

  return (
    <MapHover statusLabels={dict.world.legend}>
      <svg
        viewBox={`0 ${TOP} ${MAP_VIEWBOX.width} ${BOTTOM - TOP}`}
        className="world-map block w-full"
        role="img"
        aria-label={dict.world.mapCaption}
      >
        <g>
          {Object.entries(COUNTRY_PATHS).map(([code, d]) => (
            <path
              key={code}
              d={d}
              data-country={code}
              data-label={nameOf(code)}
              data-status={byCode.get(code)?.status ?? 'none'}
            />
          ))}
        </g>

        {nodes.map((node) => (
          <g key={`node-${node.code}`} data-node={node.status}>
            {/* El halo separa el nodo del relleno del país, que es del mismo rojo. */}
            {node.status === 'store' && <circle cx={node.x} cy={node.y} r={9} className="halo" />}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.status === 'store' ? 4.2 : 3}
              data-country={node.code}
              data-label={node.name}
              data-status={node.status}
            />
          </g>
        ))}
      </svg>

      {/*
        El mapa es una imagen: quien no lo vea necesita la lista. No es adorno
        de accesibilidad, es el mismo contenido en otra forma.
      */}
      <p className="sr-only">{alcanzados.join(', ')}.</p>
    </MapHover>
  )
}
